// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Option } from '@fp4ts/cats';
import { Chunk, Stream } from '@fp4ts/stream';
import {
  ConnectionIO,
  ConnectionIOF,
  Fragment,
  PreparedStatement,
  Row,
  StreamedResultSet,
} from './free';
import { DefaultChunkSize } from './consts';

export class Read<out A> {
  public constructor(public readonly fromRow: (r: unknown[]) => A) {}

  public map<B>(f: (a: A) => B): Read<B> {
    return new Read(a => f(this.fromRow(a)));
  }
}

export class Query<A> {
  private readonly _A!: () => A;

  public constructor(
    public readonly fragment: Fragment,
    public readonly read: Read<A>,
  ) {}

  public map<B>(f: (a: A) => B): Query<B> {
    return new Query(this.fragment, this.read.map(f));
  }

  public toList(): ConnectionIO<List<A>> {
    return ConnectionIO.prepareStatement(this.fragment)
      .bracket(
        ps => ps.query().flatMap(rs => rs.getRows()),
        ps => ps.close(),
      )
      .map(rows => rows.map(this.read.fromRow))
      .map(List.fromArray);
  }

  public stream(): Stream<ConnectionIOF, A> {
    return this.streamWithChunkSize(DefaultChunkSize);
  }

  public streamWithChunkSize(chunkSize: number): Stream<ConnectionIOF, A> {
    return Stream.bracket<ConnectionIOF, PreparedStatement>(
      ConnectionIO.prepareStatement(this.fragment),
      ps => ps.close(),
    )
      .flatMap(ps =>
        Stream.bracket<ConnectionIOF, StreamedResultSet>(ps.queryStream(), rs =>
          rs.close(),
        ),
      )
      .flatMap(rs =>
        Stream.repeatEval<ConnectionIOF, Option<Chunk<Row>>>(
          rs
            .getNextChunk(chunkSize)
            .map(c => Option(c).filter(() => c.nonEmpty)),
        )
          .unNoneTerminate()
          .unchunks.map(this.read.fromRow),
      );
  }
}
