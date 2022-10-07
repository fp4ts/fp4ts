// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import { IO, IOF } from '@fp4ts/effect-core';
import { ConnectionIO, sql, Strategy, Transactor } from '@fp4ts/sql-core';
import { SqliteTransactor } from '@fp4ts/sql-sqlite';

const prepare = ConnectionIO.Monad.do(function* (_) {
  yield* _(sql`DROP TABLE IF EXISTS person`.update().run());
  yield* _(
    sql`CREATE TABLE person (
      |  first_name TEXT NOT NULL,
      |  last_name TEXT NOT NULL,
      |  age INT NOT NULL
      | );`
      .stripMargin()
      .update()
      .run(),
  );
});

const insertPerson =
  sql`INSERT INTO person VALUES (${'test'}, ${'test'}, ${18})`
    .update()
    .run().void;
const selectPeople = sql`SELECT * FROM person`.query().toArray();

const withTransactor = (f: (trx: Transactor<IOF>) => IO<void>): IO<void> =>
  SqliteTransactor.memory(IO.Async).use(IO.Async)(trx =>
    prepare.transact(trx).productR(f(trx)),
  );

describe('Transactor', () => {
  describe('default strategy', () => {
    it.M('should commit on success', () =>
      withTransactor(trx =>
        IO.Monad.do(function* (_) {
          yield* _(insertPerson.transact(trx));

          const users = yield* _(selectPeople.transact(trx));

          expect(users).toEqual([
            { first_name: 'test', last_name: 'test', age: 18 },
          ]);
        }),
      ),
    );

    it.M('should rollback on failure', () =>
      withTransactor(trx =>
        IO.Monad.do(function* (_) {
          yield* _(
            insertPerson
              .flatMap(() => ConnectionIO.throwError(new Error('test error')))
              .transact(trx).attempt,
          );

          const users = yield* _(selectPeople.transact(trx));

          expect(users).toEqual([]);
        }),
      ),
    );

    it.M('should rollback on cancel', () =>
      withTransactor(trx =>
        IO.Monad.do(function* (_) {
          yield* _(
            insertPerson
              .flatMap(() => ConnectionIO.canceled)
              .transact(trx)
              .fork.flatMap(f => f.join).void,
          );

          const users = yield* _(selectPeople.transact(trx));

          expect(users).toEqual([]);
        }),
      ),
    );
  });

  describe('withTransaction', () => {
    it.M('should commit on success', () =>
      withTransactor(trx =>
        IO.Monad.do(function* (_) {
          yield* _(trx.withTransaction(insertPerson.translate(trx)));

          const users = yield* _(selectPeople.transact(trx));

          expect(users).toEqual([
            { first_name: 'test', last_name: 'test', age: 18 },
          ]);
        }),
      ),
    );

    it.M('should rollback on failure', () =>
      withTransactor(trx =>
        IO.Monad.do(function* (_) {
          yield* _(
            trx.withTransaction(
              insertPerson
                .translate(trx)
                .flatMap(() => IO.throwError(new Error('test error'))),
            ).attempt,
          );

          const users = yield* _(selectPeople.transact(trx));

          expect(users).toEqual([]);
        }),
      ),
    );

    it.M('should rollback on cancel', () =>
      withTransactor(trx =>
        IO.Monad.do(function* (_) {
          yield* _(
            trx
              .withTransaction(
                insertPerson.translate(trx).flatMap(() => IO.canceled),
              )
              .fork.flatMap(f => f.join).void,
          );

          const users = yield* _(selectPeople.transact(trx));

          expect(users).toEqual([]);
        }),
      ),
    );
  });

  describe('Strategy', () => {
    const effects: [string, ConnectionIO<void>][] = [
      ['unit', ConnectionIO.unit],
      ['error', ConnectionIO.throwError<void>(new Error('test error'))],
      ['canceled', ConnectionIO.canceled],
    ];

    const trx = SqliteTransactor.make(IO.Async, ':memory:');

    const run = (s: Strategy, eff: ConnectionIO<void>): Promise<void> =>
      eff
        .transact(trx.modifyStrategy(() => s))
        .attempt.fork.flatMap(f => f.join)
        .void.unsafeRunToPromise();

    describe('before', () => {
      for (const [name, eff] of effects) {
        it(`should execute on ${name}`, async () => {
          let executed = false;
          const before = ConnectionIO.delay(() => (executed = true)).void;

          await run(Strategy.unit.copy({ before }), eff);

          expect(executed).toBe(true);
        });
      }
    });

    describe('after', () => {
      it('should execute on success', async () => {
        let executed = false;
        const after = ConnectionIO.delay(() => (executed = true)).void;

        await run(Strategy.unit.copy({ after }), ConnectionIO.unit);

        expect(executed).toBe(true);
      });

      it('should not execute on error', async () => {
        let executed = false;
        const after = ConnectionIO.delay(() => (executed = true)).void;

        await run(
          Strategy.unit.copy({ after }),
          ConnectionIO.throwError(new Error('test error')),
        );

        expect(executed).toBe(false);
      });

      it('should not execute on cancel', async () => {
        let executed = false;
        const after = ConnectionIO.delay(() => (executed = true)).void;

        await run(Strategy.unit.copy({ after }), ConnectionIO.canceled);

        expect(executed).toBe(false);
      });
    });

    describe('onError', () => {
      it('should not execute on success', async () => {
        let executed = false;
        const onError = ConnectionIO.delay(() => (executed = true)).void;

        await run(Strategy.unit.copy({ onError }), ConnectionIO.unit);

        expect(executed).toBe(false);
      });

      it('should execute on error', async () => {
        let executed = false;
        const onError = ConnectionIO.delay(() => (executed = true)).void;

        await run(
          Strategy.unit.copy({ onError }),
          ConnectionIO.throwError(new Error('test error')),
        );

        expect(executed).toBe(true);
      });

      it('should execute on cancel', async () => {
        let executed = false;
        const onError = ConnectionIO.delay(() => (executed = true)).void;

        await run(Strategy.unit.copy({ onError }), ConnectionIO.canceled);

        expect(executed).toBe(true);
      });
    });

    describe('always', () => {
      for (const [name, eff] of effects) {
        it(`should execute on ${name}`, async () => {
          let executed = false;
          const always = ConnectionIO.delay(() => (executed = true)).void;

          await run(Strategy.unit.copy({ always }), eff);

          expect(executed).toBe(true);
        });
      }
    });
  });
});
