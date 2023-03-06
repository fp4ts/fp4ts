// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import { None, Ord, Some } from '@fp4ts/cats';
import { List, Map } from '@fp4ts/collections';
import { IO } from '@fp4ts/effect';
import { Fragment, Query, Read, Write } from '@fp4ts/sql-core';
import { SqliteTransactor } from '@fp4ts/sql-sqlite';

describe('Query', () => {
  const q = new Query(
    new Write<string>(x => [x]),
    Read.id<{ foo: number }>(),
    Fragment.query("select 42 as foo where ? = 'foo'"),
  );
  const qPair = new Query(
    new Write<string>(x => [x]),
    Read.id<{ id: string; foo: number }>(),
    Fragment.query("select 'xxx' as id, 42 as foo where ? = 'foo'"),
  );
  const trx = SqliteTransactor.make(IO.Async, ':memory:');

  describe('toList', () => {
    it.M('should return a non-empty List', () =>
      q
        .toList('foo')
        .transact(trx)
        .map(xs => expect(xs).toEqual(List({ foo: 42 }))),
    );

    it.M('should return an empty List', () =>
      q
        .toList('baz')
        .transact(trx)
        .map(xs => expect(xs).toEqual(List.empty)),
    );
  });

  describe('toMap', () => {
    it.M('should return a non-empty Map', () =>
      qPair
        .map(xs => [xs.id, xs.foo] as [string, number])
        .toMap(Ord.fromUniversalCompare())('foo')
        .transact(trx)
        .map(xs => expect(xs).toEqual(Map(['xxx', 42]))),
    );

    it.M('should return an empty Map', () =>
      qPair
        .map(xs => [xs.id, xs.foo] as [string, number])
        .toMap(Ord.fromUniversalCompare())('baz')
        .transact(trx)
        .map(xs => expect(xs).toEqual(Map.empty)),
    );
  });

  describe('toOption', () => {
    it.M('should return a non-empty Option', () =>
      q
        .toOption('foo')
        .transact(trx)
        .map(xs => expect(xs).toEqual(Some({ foo: 42 }))),
    );

    it.M('should return None', () =>
      q
        .toOption('baz')
        .transact(trx)
        .map(xs => expect(xs).toEqual(None)),
    );
  });

  describe('map', () => {
    it.M('should extract the value', () =>
      q
        .map(({ foo }) => foo)
        .toList('foo')
        .transact(trx)
        .map(xs => expect(xs).toEqual(List(42))),
    );

    it.M('should not be run on empty result set', () => {
      let hasBeenRun = false;
      return q
        .map(({ foo }) => {
          hasBeenRun = true;
          return foo;
        })
        .toList('bar')
        .transact(trx)
        .map(xs => {
          expect(xs).toEqual(List.empty);
          expect(hasBeenRun).toBe(false);
        });
    });
  });

  describe('contramap', () => {
    it.M('should transform the incoming param', () =>
      q
        .contramap((x: number) => 'foo'.repeat(x))
        .toList(1)
        .transact(trx)
        .map(xs => expect(xs).toEqual(List({ foo: 42 }))),
    );

    it.M('should transform the incoming param', () =>
      q
        .contramap((x: number) => 'foo'.repeat(x))
        .toList(2)
        .transact(trx)
        .map(xs => expect(xs).toEqual(List.empty)),
    );
  });
});

describe('Query0', () => {
  const q = new Query(
    new Write<string>(x => [x]),
    Read.id<{ foo: number }>(),
    Fragment.query("select 42 as foo where ? = 'foo'"),
  );
  const qPair = new Query(
    new Write<string>(x => [x]),
    Read.id<{ id: string; foo: number }>(),
    Fragment.query("select 'xxx' as id, 42 as foo where ? = 'foo'"),
  );
  const trx = SqliteTransactor.make(IO.Async, ':memory:');

  describe('toList', () => {
    it.M('should return a non-empty List', () =>
      q
        .toQuery0('foo')
        .toList()
        .transact(trx)
        .map(xs => expect(xs).toEqual(List({ foo: 42 }))),
    );

    it.M('should return an empty List', () =>
      q
        .toQuery0('baz')
        .toList()
        .transact(trx)
        .map(xs => expect(xs).toEqual(List.empty)),
    );
  });

  describe('toMap', () => {
    it.M('should return a non-empty Map', () =>
      qPair
        .map(xs => [xs.id, xs.foo] as [string, number])
        .toQuery0('foo')
        .toMap(Ord.fromUniversalCompare())
        .transact(trx)
        .map(xs => expect(xs).toEqual(Map(['xxx', 42]))),
    );

    it.M('should return an empty Map', () =>
      qPair
        .map(xs => [xs.id, xs.foo] as [string, number])
        .toQuery0('baz')
        .toMap(Ord.fromUniversalCompare())
        .transact(trx)
        .map(xs => expect(xs).toEqual(Map.empty)),
    );
  });

  describe('toOption', () => {
    it.M('should return a non-empty Option', () =>
      q
        .toQuery0('foo')
        .toOption()
        .transact(trx)
        .map(xs => expect(xs).toEqual(Some({ foo: 42 }))),
    );

    it.M('should return None', () =>
      q
        .toQuery0('baz')
        .toOption()
        .transact(trx)
        .map(xs => expect(xs).toEqual(None)),
    );
  });

  describe('map', () => {
    it.M('should extract the value', () =>
      q
        .toQuery0('foo')
        .map(({ foo }) => foo)
        .toList()
        .transact(trx)
        .map(xs => expect(xs).toEqual(List(42))),
    );

    it.M('should not be run on empty result set', () => {
      let hasBeenRun = false;
      return q
        .toQuery0('bar')
        .map(({ foo }) => {
          hasBeenRun = true;
          return foo;
        })
        .toList()
        .transact(trx)
        .map(xs => {
          expect(xs).toEqual(List.empty);
          expect(hasBeenRun).toBe(false);
        });
    });
  });
});
