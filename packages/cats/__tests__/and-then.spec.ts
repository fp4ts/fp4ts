// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { compose, flow } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { AndThen, List } from '@fp4ts/cats-core/lib/data';
import {
  ArrowApplySuite,
  ArrowChoiceSuite,
  ContravariantSuite,
  MonadSuite,
} from '@fp4ts/cats-laws';
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
    const result = fs.foldLeft(AndThen.id<number>(), (f, g) => f.andThen(g))(
      42,
    );
    expect(result).toBe(count + 42);
  });

  it('should be stack-safe when composing with compose', () => {
    const count = 50_000;
    const fs = List.range(0, count).map(() => (x: number) => x + 1);
    const result = fs.foldLeft(AndThen.id<number>(), (f, g) => f.compose(g))(
      42,
    );
    expect(result).toBe(count + 42);
  });

  checkAll(
    'Monad<Contravariant<*, MiniInt>>',
    ContravariantSuite(AndThen.Contravariant<MiniInt>()).contravariant(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ec.miniInt(),
      ec.miniInt(),
      <X>(X: Arbitrary<X>) => A.fp4tsAndThen<X, MiniInt>(A.fp4tsMiniInt()),
      <X>(X: ec.ExhaustiveCheck<X>) =>
        E.fn1Eq(X, MiniInt.Eq) as any as Eq<AndThen<X, MiniInt>>,
    ),
  );

  checkAll(
    'Monad<AndThen<MiniInt, *>>',
    MonadSuite(AndThen.Monad<MiniInt>()).monad(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      MiniInt.Eq,
      MiniInt.Eq,
      X => A.fp4tsAndThen(X),
      <X>(X: Eq<X>) =>
        E.fn1Eq(ec.miniInt(), X) as any as Eq<AndThen<MiniInt, X>>,
    ),
  );

  checkAll(
    'ArrowChoice<AndThen>',
    ArrowChoiceSuite(AndThen.ArrowChoice).arrowChoice(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => A.fp4tsAndThen<X, Y>(Y),
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) =>
        E.fn1Eq(X, Y) as any as Eq<AndThen<X, Y>>,
    ),
  );

  checkAll(
    'ArrowApply<AndThen>',
    ArrowApplySuite(AndThen.ArrowApply).arrowApply(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => A.fp4tsAndThen<X, Y>(Y),
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) =>
        E.fn1Eq(X, Y) as any as Eq<AndThen<X, Y>>,
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: ec.ExhaustiveCheck<Y>) =>
        ec.instance(Y.allValues.map(y => AndThen.lift((x: X) => y))),
    ),
  );
});
