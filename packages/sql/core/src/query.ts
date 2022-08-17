// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Map, Option, Ord } from '@fp4ts/cats';
import { Chunk, Stream } from '@fp4ts/stream';
import {
  ConnectionIO,
  ConnectionIOF,
  Fragment,
  PreparedStatement,
  ResultSet,
  StreamedResultSet,
} from './free';
import { DefaultChunkSize } from './consts';
import { Read } from './read';
import { Write } from './write';

export class Query<in A, out B> {
  public constructor(
    private readonly W: Write<A>,
    private readonly R: Read<B>,
    private readonly fragment: Fragment,
  ) {}

  public toQuery0(a: A): Query0<B> {
    return {
      map: f => this.map(f).toQuery0(a),
      toArray: () => this.toArray(a),
      toList: () => this.toList(a),
      toOption: () => this.toOption(a),
      toMap: O => (this as any).toMap(O)(a),
      stream: () => this.stream(a),
      streamWithChunkSize: chunkSize => this.streamWithChunkSize(a, chunkSize),
    };
  }

  public map<C>(f: (a: B) => C): Query<A, C> {
    return new Query(this.W, this.R.map(f), this.fragment);
  }

  public contramap<A0>(f: (a0: A0) => A): Query<A0, B> {
    return new Query(this.W.contramap(f), this.R, this.fragment);
  }

  public toArray(a: A): ConnectionIO<B[]> {
    return this.prepareStatement(this.executeQuery(a, rs => rs.getRows())).map(
      rows => rows.map(this.R.fromRow),
    );
  }

  public toList(a: A): ConnectionIO<List<B>> {
    return this.toArray(a).map(List.fromArray);
  }

  public toOption(a: A): ConnectionIO<Option<B>> {
    return this.prepareStatement(this.executeQuery(a, rs => rs.getRows())).map(
      rows => Option(rows[0]).map(this.R.fromRow),
    );
  }

  public toMap<K, V>(
    this: Query<A, [K, V]>,
    O: Ord<K>,
  ): (a: A) => ConnectionIO<Map<K, V>> {
    return a =>
      this.prepareStatement(this.executeQuery(a, rs => rs.getRows()))
        .map(rows => rows.map(this.R.fromRow))
        .map(Map.fromArray(O));
  }

  public stream(a: A): Stream<ConnectionIOF, B> {
    return this.streamWithChunkSize(a, DefaultChunkSize);
  }

  public streamWithChunkSize(
    a: A,
    chunkSize: number,
  ): Stream<ConnectionIOF, B> {
    const acquireStream = (ps: PreparedStatement) =>
      Stream.bracket<ConnectionIOF, StreamedResultSet>(
        ps
          .set(this.W)(a)
          .flatMap(ps => ps.queryStream()),
        rs => rs.close(),
      );

    const pullStream = (rs: StreamedResultSet) =>
      Stream.repeatEval<ConnectionIOF, Option<Chunk<unknown>>>(
        rs.getNextChunk(chunkSize).map(c => Option(c).filter(() => c.nonEmpty)),
      ).unNoneTerminate().unchunks;

    return Stream.bracket<ConnectionIOF, PreparedStatement>(
      ConnectionIO.prepareStatement(this.fragment),
      ps => ps.close(),
    )
      .flatMap(acquireStream)
      .flatMap(pullStream)
      .map(this.R.fromRow);
  }

  private executeQuery<R>(
    a: A,
    f: (rs: ResultSet) => ConnectionIO<R>,
  ): (ps: PreparedStatement) => ConnectionIO<R> {
    return ps =>
      ps
        .set(this.W)(a)
        .flatMap(ps => ps.query())
        .flatMap(f);
  }

  private prepareStatement<R>(
    f: (ps: PreparedStatement) => ConnectionIO<R>,
  ): ConnectionIO<R> {
    return ConnectionIO.prepareStatement(this.fragment).bracket(f, ps =>
      ps.close(),
    );
  }
}

export function Query0<B>(R: Read<B>, fragment: Fragment): Query0<B> {
  return new Query(Write.unit, R, fragment).toQuery0();
}

export interface Query0<B> {
  map<C>(f: (a: B) => C): Query0<C>;
  toArray(): ConnectionIO<B[]>;
  toList(): ConnectionIO<List<B>>;
  toOption(): ConnectionIO<Option<B>>;
  toMap<K, V>(this: Query0<[K, V]>, K: Ord<K>): ConnectionIO<Map<K, V>>;
  stream(): Stream<ConnectionIOF, B>;
  streamWithChunkSize(chunkSize: number): Stream<ConnectionIOF, B>;
}
