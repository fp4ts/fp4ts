// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Chain } from '@fp4ts/cats';
import { Write } from '@fp4ts/sql-core';
import {
  ConnectionIO,
  PreparedStatement,
  ResultSet,
  StreamedResultSet,
} from '@fp4ts/sql-core/lib/free';
import { MariaConnection } from './maria-connection';
import { MariaResultSet, MariaStreamedResultSet } from './maria-result-set';

export class MariaPreparedStatement extends PreparedStatement {
  public constructor(
    private readonly conn: MariaConnection,
    private readonly sql: string,
    private readonly params: Chain<unknown>,
  ) {
    super();
  }

  public query(): ConnectionIO<ResultSet> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() =>
        this.conn.client
          .query(this.sql, this.params.toArray)
          .then(res => new MariaResultSet(res)),
      ),
    );
  }

  public queryStream(): ConnectionIO<StreamedResultSet> {
    return ConnectionIO.uncancelable(() =>
      ConnectionIO.delay(() =>
        this.conn.client.queryStream(this.sql, this.params.toArray),
      ).map(readable => new MariaStreamedResultSet(readable)),
    );
  }

  public set<A>(W: Write<A>): (a: A) => ConnectionIO<PreparedStatement> {
    return a =>
      ConnectionIO.pure(
        new MariaPreparedStatement(
          this.conn,
          this.sql,
          this.params['+++'](Chain.fromArray(W.toRow(a))),
        ),
      );
  }

  public close(): ConnectionIO<void> {
    return ConnectionIO.unit;
  }
}
