// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Chain, Either, Left, Right } from '@fp4ts/cats';
import {
  ConnectionIO,
  PreparedStatement,
  ResultSet,
  StreamedResultSet,
  Write,
} from '@fp4ts/sql-core';
import { Statement } from 'sqlite3';
import { SqliteResultSet, SqliteStreamedResultSet } from './sqlite-result-set';

export class SqlitePreparedStatement extends PreparedStatement {
  public constructor(
    private readonly stmt: Statement,
    private readonly params: Chain<unknown>,
  ) {
    super();
  }

  public query(): ConnectionIO<ResultSet> {
    return ConnectionIO.async_(cb =>
      this.stmt.bind(...this.params, (err: Error | null) =>
        cb(err ? Left(err) : Right(new SqliteResultSet(this.stmt))),
      ),
    );
  }

  public queryStream(): ConnectionIO<StreamedResultSet> {
    return ConnectionIO.async_(cb =>
      this.stmt.bind(...this.params, (err: Error | null) =>
        cb(err ? Left(err) : Right(new SqliteStreamedResultSet(this.stmt))),
      ),
    );
  }

  public set<A>(W: Write<A>): (a: A) => ConnectionIO<PreparedStatement> {
    return a =>
      ConnectionIO.pure(
        new SqlitePreparedStatement(
          this.stmt,
          this.params['+++'](Chain.fromArray(W.toRow(a))),
        ),
      );
  }

  public close(): ConnectionIO<void> {
    return ConnectionIO.async_(cb =>
      this.stmt.finalize(err => cb(err ? Left(err) : Either.rightUnit)),
    );
  }
}
