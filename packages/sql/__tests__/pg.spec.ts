// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import { IO, IOF, Resource } from '@fp4ts/effect';
import { Client, ClientBase, Pool } from '@fp4ts/sql-pg';
import { sql } from '@fp4ts/sql-core';
import { Client as PgClient } from 'pg';
import { TransactorAux, Strategy } from '@fp4ts/sql-free';
import { PgConnectionOpVisitor } from '@fp4ts/sql-pg/lib/transactor';
import { PgConnection } from '@fp4ts/sql-pg/lib/transactor';

const CONNECTION_CONFIG = {
  host: 'localhost',
  database: 'fp4ts',
  user: 'root',
  password: 'root',
};

// Enable this test IFF you've got a DB running matching the setup above
describe('pg', () => {
  const prepareDb = (client: ClientBase<IOF>): IO<void> =>
    IO.Monad.do(function* (_) {
      yield* _(client.query('DROP TABLE IF EXISTS "person"'));
      yield* _(
        client.query('CREATE TABLE "person" (first_name TEXT, last_name TEXT)'),
      );

      for (let i = 0; i < 5; i++) {
        yield* _(
          client.query(
            'INSERT INTO person(first_name, last_name) VALUES ($1, $2)',
            [`test${i}`, `test${i}`],
          ),
        );
      }
    });

  const expectedResults = [
    { first_name: 'test0', last_name: 'test0' },
    { first_name: 'test1', last_name: 'test1' },
    { first_name: 'test2', last_name: 'test2' },
    { first_name: 'test3', last_name: 'test3' },
    { first_name: 'test4', last_name: 'test4' },
  ];

  describe('client', () => {
    const withDbClient = (
      run: (client: ClientBase<IOF>) => IO<void>,
    ): IO<void> =>
      Client.make(IO.Async, CONNECTION_CONFIG).use(IO.Async)(client =>
        prepareDb(client)['>>>'](run(client)),
      );

    it.M('should query the DB contents', () =>
      withDbClient(client =>
        client
          .query('SELECT * FROM "person"')
          .map(({ rows }) => expect(rows).toEqual(expectedResults)),
      ),
    );

    it.M('should stream the DB contents', () =>
      withDbClient(client =>
        client
          .stream('SELECT * FROM "person"')
          .compileConcurrent()
          .toArray.map(rows => expect(rows).toEqual(expectedResults)),
      ),
    );
  });

  describe('pool', () => {
    const withDbPool = (run: (client: Pool<IOF>) => IO<void>): IO<void> =>
      Pool.make(IO.Async, CONNECTION_CONFIG)
        .evalTap(pool => pool.connect().use(IO.Async)(prepareDb))
        .use(IO.Async)(run);

    it.M('should query the DB contents', () =>
      withDbPool(pool =>
        pool
          .query('SELECT * FROM "person"')
          .map(({ rows }) => expect(rows).toEqual(expectedResults)),
      ),
    );

    it.M('should query the DB contents', () =>
      withDbPool(pool =>
        pool.connect().use(IO.Async)(client =>
          client
            .query('SELECT * FROM "person"')
            .map(({ rows }) => expect(rows).toEqual(expectedResults)),
        ),
      ),
    );

    it.M('should stream the DB contents', () =>
      withDbPool(pool =>
        pool.connect().use(IO.Async)(client =>
          client
            .stream('SELECT * FROM "person"')
            .compileConcurrent()
            .toArray.map(rows => expect(rows).toEqual(expectedResults)),
        ),
      ),
    );
  });

  describe('core sql pg', () => {
    const connect = Resource.make(IO.Functor)(
      IO.deferPromise(() => {
        const client = new PgClient(CONNECTION_CONFIG);
        return client.connect().then(() => client);
      }),
      client => IO.deferPromise(() => client.end()),
    )
      .evalTap(client =>
        IO.deferPromise(async () => {
          await client.query('DROP TABLE IF EXISTS "person"');
          await client.query(
            'CREATE TABLE "person" (first_name TEXT, last_name TEXT)',
          );

          for (let i = 0; i < 5; i++) {
            await client.query(
              'INSERT INTO person(first_name, last_name) VALUES ($1, $2)',
              [`test${i}`, `test${i}`],
            );
          }
        }),
      )
      .map(client => new PgConnection(client));

    it.M('should perform a simple query', () => {
      const vis = new PgConnectionOpVisitor(IO.Async);
      const trx = new TransactorAux(
        IO.Async,
        null,
        Strategy.default,
        vis.liftK(),
        () => connect,
      );

      return sql`SELECT * FROM "person"`
        .query<{ first_name: string; last_name: string }>()
        .toList()
        .transact(trx)
        .tap(console.log);
    });

    it.M('should perform a streaming query', () => {
      const vis = new PgConnectionOpVisitor(IO.Async);
      const trx = new TransactorAux(
        IO.Async,
        null,
        Strategy.default,
        vis.liftK(),
        () => connect,
      );

      return sql`SELECT * FROM "person"`
        .query<{ first_name: string; last_name: string }>()
        .streamWithChunkSize(1)
        .throughF(trx.transStream())
        .evalTap(IO.Async)(xs => IO.delay(() => console.log(xs)))
        .compileConcurrent().drain;
    });
  });
});
