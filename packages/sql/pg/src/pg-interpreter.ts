// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { Kleisli } from '@fp4ts/cats';
import {
  PreparedStatement,
  PrepareStatement,
  BeginTransaction,
  Commit,
  Rollback,
  Close,
  KleisliInterpreter,
} from '@fp4ts/sql-core/lib/free';

import { PgConnection } from './pg-connection';
import { PgPreparedStatement } from './pg-prepared-statement';
import { PgFragmentVisitor } from './pg-fragment';

export class PgInterpreter<F> extends KleisliInterpreter<F, PgConnection> {
  private rawQuery(sql: string): Kleisli<F, PgConnection, void> {
    return conn =>
      pipe(
        this.F.delay(() => conn.client.query(sql)),
        this.F.fromPromise,
        this.F.void,
      );
  }

  public visitPrepareStatement(
    fa: PrepareStatement,
  ): Kleisli<F, PgConnection, PreparedStatement> {
    return conn =>
      this.F.pure(
        new PgPreparedStatement(
          fa.fragment.visit(new PgFragmentVisitor()),
          conn.client,
        ),
      );
  }

  public visitBeginTransaction(
    fa: BeginTransaction,
  ): Kleisli<F, PgConnection, void> {
    return this.rawQuery('BEGIN TRANSACTION');
  }

  public visitCommit(fa: Commit): Kleisli<F, PgConnection, void> {
    return this.rawQuery('COMMIT');
  }

  public visitRollback(fa: Rollback): Kleisli<F, PgConnection, void> {
    return this.rawQuery('ROLLBACK');
  }

  public visitClose(fa: Close): Kleisli<F, PgConnection, void> {
    return conn => conn.close().foldMap(this.KF)(this.liftK())(conn);
  }
}
