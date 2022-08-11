// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import { id } from '@fp4ts/core';
import { IO } from '@fp4ts/effect';
import { sql, ConnectionIO, Update, Write, Fragment } from '@fp4ts/sql-core';
import { PgTransactor } from '@fp4ts/sql-pg';
import { Array, Ord } from '@fp4ts/cats';

const CONNECTION_CONFIG = {
  host: 'localhost',
  database: 'fp4ts',
  user: 'root',
  password: 'root',
};

// Enable this test IFF you've got a DB running matching the setup above
describe('pg', () => {
  const trx = PgTransactor.make(IO.Async, CONNECTION_CONFIG);
  const prepare = (): ConnectionIO<void> =>
    ConnectionIO.Monad.do(function* (_) {
      yield* _(sql`DROP TABLE IF EXISTS "person"`.update().run());
      yield* _(
        sql`
          CREATE TABLE "person" (
            id SERIAL PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL
          )`
          .update()
          .run(),
      );

      yield* _(
        new Update(
          new Write(id<[string, string]>),
          Fragment.query(
            'INSERT INTO person(first_name, last_name) VALUES ($1, $2)',
          ),
        ).updateMany(Array.FoldableWithIndex())([
          ['test0', 'test0'],
          ['test1', 'test1'],
          ['test2', 'test2'],
          ['test3', 'test3'],
          ['test4', 'test4'],
        ]),
      );
    });

  it.M('should perform a simple query', () =>
    IO.Monad.do(function* (_) {
      yield* _(prepare().transact(trx));
      yield* _(
        sql`SELECT * FROM "person"`
          .query<[string, string]>()
          .toList()
          .transact(trx)
          .tap(console.log),
      );
    }),
  );

  it.M('should perform a simple query', () =>
    IO.Monad.do(function* (_) {
      yield* _(prepare().transact(trx));
      yield* _(
        sql`SELECT * FROM "person"`
          .query<[string, string]>()
          .toMap(Ord.primitive)
          .transact(trx)
          .tap(console.log),
      );
    }),
  );

  it.M('should perform a streaming query', () =>
    IO.Monad.do(function* (_) {
      yield* _(prepare().transact(trx));
      yield* _(
        sql`SELECT * FROM "person"`
          .query<[string, string]>()
          .streamWithChunkSize(1)
          .throughF(trx.transStream())
          .evalTap(IO.Async)(xs => IO.delay(() => console.log(xs)))
          .compileConcurrent().drain,
      );
    }),
  );

  it.M('should 1 perform a streaming query', () =>
    IO.Monad.do(function* (_) {
      yield* _(prepare().transact(trx));
      yield* _(
        sql`SELECT * FROM "person"`
          .query<[string, string]>()
          .streamWithChunkSize(1)
          .compileConcurrent(ConnectionIO.Async)
          .toList.transact(trx)
          .map(console.log),
      );
    }),
  );
});
