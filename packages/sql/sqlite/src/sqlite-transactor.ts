// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from '@fp4ts/cats';
import { Async, Resource } from '@fp4ts/effect';
import { Strategy, TransactorAux } from '@fp4ts/sql-core';
import { Database } from 'sqlite3';
import { SqliteConnection } from './sqlite-connection';
import { SqliteInterpreter } from './sqlite-interpreter';

export const SqliteTransactor = Object.freeze({
  make: <F>(F: Async<F>, filename: string): SqliteTransactor<F> =>
    new TransactorAux(
      F,
      filename,
      Strategy.default,
      new SqliteInterpreter(F).liftK(),
      filename =>
        Resource.make(F)(
          F.async_<SqliteConnection>(cb => {
            const db: Database = new Database(filename, err =>
              cb(err ? Left(err) : Right(new SqliteConnection(db))),
            );
          }),
          con =>
            F.async_(cb =>
              con.db.close(err => cb(err ? Left(err) : Either.rightUnit)),
            ),
        ),
    ),
});
export type SqliteTransactor<F> = TransactorAux<F, string, SqliteConnection>;
