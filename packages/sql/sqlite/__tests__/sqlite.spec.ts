// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import { id } from '@fp4ts/core';
import { Array, Ord } from '@fp4ts/cats';
import { IO } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream';
import {
  sql,
  ConnectionIO,
  Update,
  Write,
  Fragment,
  ConnectionIOF,
} from '@fp4ts/sql-core';
import { SqliteTransactor } from '../src';

describe('sqlite', () => {
  const trx = SqliteTransactor.make(IO.Async, ':memory:');
  const prepare = (): ConnectionIO<void> =>
    ConnectionIO.Monad.do(function* (_) {
      yield* _(sql`DROP TABLE IF EXISTS "person"`.update().run());
      yield* _(
        sql`
          CREATE TABLE "person" (
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
        ).updateMany(Array.FoldableWithIndex())([
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
    prepare()
      .flatMap(() => sql`SELECT * FROM person`.query<Person>().toList())
      .transact(trx)
      .tap(console.log),
  );

  it.M('should perform a simple query', () =>
    prepare()
      .flatMap(() =>
        sql`SELECT * FROM person`
          .query<Person>()
          .map(
            ({ first_name, last_name }) =>
              [first_name, last_name] as [string, string],
          )
          .toMap(Ord.fromUniversalCompare()),
      )
      .transact(trx)
      .tap(console.log),
  );

  it.M(
    'should perform a streaming query',
    () =>
      Stream.evalF<ConnectionIOF, void>(prepare())
        .flatMap(() =>
          sql`SELECT * FROM person`.query<Person>().streamWithChunkSize(1),
        )
        .throughF(trx.transStream())
        .evalTap(IO.Async)(xs => IO.delay(() => console.log(xs)))
        .compileConcurrent().drain,
  );

  it.M('should 1 perform a streaming query', () =>
    Stream.evalF<ConnectionIOF, void>(prepare())
      .flatMap(() =>
        sql`SELECT * FROM person`.query<Person>().streamWithChunkSize(1),
      )
      .compileConcurrent(ConnectionIO.Async)
      .toList.transact(trx)
      .map(console.log),
  );
});
