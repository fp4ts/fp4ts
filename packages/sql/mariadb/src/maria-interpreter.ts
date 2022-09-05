// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kleisli } from '@fp4ts/cats';
import {
  BeginTransaction,
  Close,
  Commit,
  KleisliInterpreter,
  PreparedStatement,
  PrepareStatement,
  Rollback,
} from '@fp4ts/sql-core/lib/free';
import { MariaConnection } from './maria-connection';
import { MariaPreparedStatement } from './maria-prepared-statement';

export class MariaInterpreter<F> extends KleisliInterpreter<
  F,
  MariaConnection
> {
  public visitPrepareStatement(
    fa: PrepareStatement,
  ): Kleisli<F, MariaConnection, PreparedStatement> {
    return conn =>
      this.F.pure(
        new MariaPreparedStatement(conn, fa.fragment.sql, fa.fragment.params),
      );
  }

  public visitBeginTransaction(
    fa: BeginTransaction,
  ): Kleisli<F, MariaConnection, void> {
    return conn =>
      this.F.fromPromise(this.F.delay(() => conn.client.beginTransaction()));
  }

  public visitCommit(fa: Commit): Kleisli<F, MariaConnection, void> {
    return conn => this.F.fromPromise(this.F.delay(() => conn.client.commit()));
  }

  public visitRollback(fa: Rollback): Kleisli<F, MariaConnection, void> {
    return conn =>
      this.F.fromPromise(this.F.delay(() => conn.client.rollback()));
  }

  public visitClose(fa: Close): Kleisli<F, MariaConnection, void> {
    return conn => conn.close().foldMap(this.KF)(this.liftK())(conn);
  }
}
