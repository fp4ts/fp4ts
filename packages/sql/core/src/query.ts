// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Chain, List, Option } from '@fp4ts/cats';
import { Chunk, Stream } from '@fp4ts/stream';
import {
  ConnectionIO,
  ConnectionIOF,
  PreparedStatement,
  StreamedResultSet,
} from '@fp4ts/sql-free';
import { DefaultChunkSize } from './consts';

export class Read<A> {
  public constructor(
    public readonly fromRecord: (r: Record<string, any>) => A,
  ) {}

  public map<B>(f: (a: A) => B): Read<B> {
    return new Read(a => f(this.fromRecord(a)));
  }
}

export class Query<A> {
  private readonly _A!: () => A;

  public constructor(
    public readonly sql: string,
    public readonly params: Chain<unknown>,
    public readonly read: Read<A>,
  ) {}

  public map<B>(f: (a: A) => B): Query<B> {
    return new Query(this.sql, this.params, this.read.map(f));
  }

  public toList(): ConnectionIO<List<A>> {
    ConnectionIO.prepareStatement(this.sql, this.params)
      .bracket(
        ps => ps.query().flatMap(rs => rs.getRows<A>()),
        ps => ps.close(),
      )
      .map(List.fromArray);

    return ConnectionIO.prepareStatement(this.sql, this.params)
      .flatMap(ps => ps.query())
      .flatMap(rs => rs.getRows<A>())
      .map(List.fromArray);
  }

  public stream(): Stream<ConnectionIOF, A> {
    return this.streamWithChunkSize(DefaultChunkSize);
  }

  public streamWithChunkSize(chunkSize: number): Stream<ConnectionIOF, A> {
    return Stream.bracket<ConnectionIOF, PreparedStatement>(
      ConnectionIO.prepareStatement(this.sql, this.params),
      ps => ps.close(),
    )
      .flatMap(ps =>
        Stream.bracket<ConnectionIOF, StreamedResultSet>(ps.queryStream(), rs =>
          rs.close(),
        ),
      )
      .flatMap(
        rs =>
          Stream.repeatEval<ConnectionIOF, Option<Chunk<A>>>(
            rs.getNextChunk<A>(chunkSize),
          ).unNoneTerminate().unchunks,
      );
  }
}
