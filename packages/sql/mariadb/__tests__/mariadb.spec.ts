// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import { id } from '@fp4ts/core';
import { Foldable } from '@fp4ts/cats';
import { IO } from '@fp4ts/effect';
import { sql, ConnectionIO, Update, Write, Fragment } from '@fp4ts/sql-core';
import { MariaTransactor } from '../src';

// Enable this test IFF you've got a DB running matching the setup above
describe.skip('maria-db', () => {
  const CONNECTION_CONFIG = {
    host: 'localhost',
    database: 'fp4ts',
    user: 'root',
    password: 'root',
  };
  const trx = MariaTransactor.make(IO.Async, CONNECTION_CONFIG);
  const prepare = (): ConnectionIO<void> =>
    ConnectionIO.Monad.do(function* (_) {
      yield* _(sql`DROP TABLE IF EXISTS person`.update().run());
      yield* _(
        sql`
          CREATE TABLE person (
            id SERIAL,
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
            'INSERT INTO person(first_name, last_name) VALUES (?, ?)',
          ),
        ).updateMany(Foldable.Array)([
          ['test0', 'test0'],
          ['test1', 'test1'],
          ['test2', 'test2'],
          ['test3', 'test3'],
          ['test4', 'test4'],
        ]),
      );
    });

  type Person = { readonly first_name: string; readonly last_name: string };

  it.M('should perform a simple query', () =>
    IO.Monad.do(function* (_) {
      yield* _(prepare().transact(trx));
      yield* _(
        sql`SELECT * FROM person`
          .query<Person>()
          .toList()
          .transact(trx)
          .tap(xs => console.log(xs.toArray)),
      );
    }),
  );

  it.M('should perform a streaming query', () =>
    IO.Monad.do(function* (_) {
      let x = 0;
      yield* _(prepare().transact(trx));
      yield* _(
        sql`SELECT * FROM person`
          .query<Person>()
          .streamWithChunkSize(1)
          .throughF(trx.transStream())
          .evalTap(IO.Async)(xs => IO.delay(() => console.log(x++, xs)))
          .compileConcurrent().drain,
      );
    }),
  );

  it.M('should 1 perform a streaming query', () =>
    IO.Monad.do(function* (_) {
      yield* _(prepare().transact(trx));
      yield* _(
        sql`SELECT * FROM person`
          .query<Person>()
          .streamWithChunkSize(512)
          .compileConcurrent(ConnectionIO.Async)
          .toList.transact(trx)
          .map(console.log),
      );
    }),
  );
});
