// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { id } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats-core';
import { Identity, View } from '@fp4ts/cats-core/lib/data';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Forget } from '@fp4ts/cats-profunctor';
import {
  ApplicativeSuite,
  ContravariantSuite,
  MonoidKSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import {
  CochoiceSuite,
  RepresentableSuite,
  TraversingSuite,
} from '@fp4ts/cats-profunctor-laws';

describe('Forget', () => {
  describe('stack safety', () => {
    it('should have Stack-Safe MonoidK instance', () => {
      expect(
        View.range(0, 100_000).foldMapK(
          Forget.MonoidK(Monoid.addition),
          _ => _ => 1,
        )(null),
      ).toBe(100_000);
    });

    it('should have Stack-Safe Applicative instance', () => {
      expect(
        View.range(0, 100_000).traverse(
          Forget.Applicative(Monoid.addition),
          _ => _ => 1,
        )(null),
      ).toBe(100_000);
    });
  });

  checkAll(
    'MonoidK<Forget<number, MiniInt, *>>',
    MonoidKSuite(Forget.MonoidK<number, MiniInt>(Monoid.addition)).monoidK(
      fc.integer(),
      Eq.fromUniversalEquals(),
      _ => fc.func(fc.integer()),
      _ => eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.fromUniversalEquals()),
    ),
  );

  checkAll(
    'Applicative<Forget<number, MiniInt, *>>',
    ApplicativeSuite(
      Forget.Applicative<number, MiniInt>(Monoid.addition),
    ).applicative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      _ => fc.func(fc.integer()),
      _ => eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.fromUniversalEquals()),
    ),
  );

  checkAll(
    'Traversable<Forget<number, MiniInt, *>>',
    TraversableSuite(Forget.Traversable<number, MiniInt>()).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      Forget.Functor(),
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      _ => fc.func(fc.integer()),
      _ => eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.fromUniversalEquals()),
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );

  checkAll(
    'Contravariant<Forget<number, MiniInt, *>>',
    ContravariantSuite(Forget.Contravariant<number, MiniInt>()).contravariant(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      ExhaustiveCheck.miniInt(),
      _ => fc.func(fc.integer()),
      _ => eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.fromUniversalEquals()),
    ),
  );

  checkAll(
    'Traversing<Forget<number, *, *>',
    TraversingSuite(Forget.Traversing(Monoid.addition)).traversing(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      Identity.Traversable,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) =>
        fc.func<[X], number>(fc.integer()),
      <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
        eq.fn1Eq(X, Eq.fromUniversalEquals()),
      id,
      id,
    ),
  );

  checkAll(
    'Representable<Forget<number, *, *>',
    RepresentableSuite(Forget.Representable<number>()).representable(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) =>
        fc.func<[X], number>(fc.integer()),
      <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
        eq.fn1Eq(X, Eq.fromUniversalEquals()),
      _ => fc.integer(),
      _ => Eq.fromUniversalEquals(),
    ),
  );

  checkAll(
    'Cochoice<Forget<number, *, *>',
    CochoiceSuite(Forget.Cochoice<number>()).cochoice(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) =>
        fc.func<[X], number>(fc.integer()),
      <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
        eq.fn1Eq(X, Eq.fromUniversalEquals()),
    ),
  );
});
