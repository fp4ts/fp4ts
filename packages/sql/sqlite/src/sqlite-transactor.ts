// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from '@fp4ts/cats';
import { Async, Resource } from '@fp4ts/effect';
import { Strategy, TransactorAux } from '@fp4ts/sql-core';
import { Database } from 'sqlite3';
import { SqliteConnection } from './sqlite-connection';
import { SqliteInterpreter } from './sqlite-interpreter';

const connect =
  <F>(F: Async<F>) =>
  (filename: string): Resource<F, SqliteConnection> =>
    Resource.make(F)(
      F.async_<SqliteConnection>(cb => {
        const db: any = new Database(filename, err =>
          cb(err ? Left(err) : Right(new SqliteConnection(db))),
        );
      }),
      conn =>
        F.async_(cb =>
          conn.db.close(err => cb(err ? Left(err) : Either.rightUnit)),
        ),
    );

export const SqliteTransactor = Object.freeze({
  make: <F>(F: Async<F>, filename: string): SqliteTransactor<F> =>
    new TransactorAux(
      F,
      filename,
      Strategy.default,
      new SqliteInterpreter(F).liftK(),
      connect(F),
    ),

  memory: <F>(F: Async<F>): Resource<F, SqliteTransactor<F>> =>
    connect(F)(':memory:').map(
      conn =>
        new TransactorAux(
          F,
          '',
          Strategy.default,
          new SqliteInterpreter(F).liftK(),
          () => Resource.pure(conn),
        ),
    ),
});
export type SqliteTransactor<F> = TransactorAux<F, string, SqliteConnection>;
