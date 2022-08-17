// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Kleisli, Left, Right } from '@fp4ts/cats';
import {
  BeginTransaction,
  Close,
  Commit,
  KleisliInterpreter,
  PreparedStatement,
  PrepareStatement,
  Rollback,
} from '@fp4ts/sql-core/lib/free';
import { Statement } from 'sqlite3';
import { SqlitePreparedStatement } from './sqlite-prepared-statement';
import { SqliteConnection } from './sqlite-connection';

export class SqliteInterpreter<F> extends KleisliInterpreter<
  F,
  SqliteConnection
> {
  private rawQuery(sql: string): Kleisli<F, SqliteConnection, void> {
    return Kleisli(conn =>
      this.F.async_(cb =>
        conn.db.run(sql, err => cb(err ? Left(err) : Either.rightUnit)),
      ),
    );
  }

  public visitPrepareStatement(
    fa: PrepareStatement,
  ): Kleisli<F, SqliteConnection, PreparedStatement> {
    return Kleisli(conn =>
      this.F.async_(cb => {
        const stmt: Statement = conn.db.prepare(fa.fragment.sql, err =>
          cb(
            err
              ? Left(err)
              : Right(new SqlitePreparedStatement(stmt, fa.fragment.params)),
          ),
        );
      }),
    );
  }

  public visitBeginTransaction(
    fa: BeginTransaction,
  ): Kleisli<F, SqliteConnection, void> {
    return this.rawQuery('BEGIN TRANSACTION');
  }

  public visitCommit(fa: Commit): Kleisli<F, SqliteConnection, void> {
    return this.rawQuery('COMMIT');
  }

  public visitRollback(fa: Rollback): Kleisli<F, SqliteConnection, void> {
    return this.rawQuery('ROLLBACK');
  }

  public visitClose(fa: Close): Kleisli<F, SqliteConnection, void> {
    return Kleisli(conn =>
      conn.close().foldMap(this.KF)(this.liftK()).run(conn),
    );
  }
}
