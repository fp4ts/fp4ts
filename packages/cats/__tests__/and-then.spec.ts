// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { compose, flow } from '@fp4ts/core';
import { AndThen, List } from '@fp4ts/cats-core/lib/data';
import { ContravariantSuite, MonadSuite } from '@fp4ts/cats-laws';
import { checkAll, forAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as E from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('AndThen', () => {
  it(
    'should compose a chain of functions with andThen',
    forAll(
      fc.integer(),
      A.fp4tsList(fc.func<[number], number>(fc.integer()), { minLength: 1 }),
      (x, fs) => {
        const result = fs.map(AndThen).foldLeft1((f, g) => f.andThen(g))(x);
        const expected = fs.foldLeft1((f, g) => flow(f, g))(x);
        return result === expected;
      },
    ),
  );

  it(
    'should compose a chain of functions with compose',
    forAll(
      fc.integer(),
      A.fp4tsList(fc.func<[number], number>(fc.integer()), { minLength: 1 }),
      (x, fs) => {
        const result = fs.map(AndThen).foldLeft1((f, g) => f.compose(g))(x);
        const expected = fs.foldLeft1((f, g) => compose(f, g))(x);
        return result === expected;
      },
    ),
  );

  it('should be stack-safe when composing with andThen', () => {
    const count = 50_000;
    const fs = List.range(0, count).map(() => (x: number) => x + 1);
    const result = fs.foldLeft(AndThen.identity<number>(), (f, g) =>
      f.andThen(g),
    )(42);
    expect(result).toBe(count + 42);
  });

  it('should be stack-safe when composing with compose', () => {
    const count = 50_000;
    const fs = List.range(0, count).map(() => (x: number) => x + 1);
    const result = fs.foldLeft(AndThen.identity<number>(), (f, g) =>
      f.compose(g),
    )(42);
    expect(result).toBe(count + 42);
  });

  const monadTests = MonadSuite(AndThen.Monad<MiniInt>());
  checkAll(
    'Monad<AndThen<MiniInt, *>>',
    monadTests.monad(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      MiniInt.Eq,
      MiniInt.Eq,
      X => A.fp4tsAndThen(X) as any,
      EqX => E.fn1Eq(ec.miniInt(), EqX),
    ),
  );

  const contravariantTests = ContravariantSuite(
    AndThen.Contravariant<MiniInt>(),
  );
  checkAll(
    'Monad<Contravariant<*, MiniInt>>',
    contravariantTests.contravariant(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      X => A.fp4tsAndThen(X) as any,
      EqX => E.fn1Eq(ec.miniInt(), EqX) as any,
    ),
  );
});
