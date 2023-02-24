// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import {
  Identity,
  None,
  Option,
  OptionF,
  Some,
} from '@fp4ts/cats-core/lib/data';
import { Comonad, Defer, Unzip } from '@fp4ts/cats-core';
import { Arrow, ArrowLoop, Compose } from '@fp4ts/cats-arrow';
import { Cofree } from '@fp4ts/cats-free';
import {
  ArrowLoopSuite,
  ArrowSuite,
  ComposeSuite,
} from '@fp4ts/cats-arrow-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Cokleisli', () => {
  const eqCokleisli = <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
    eq.fn1Eq(
      X.map((x: X) => Eval.now(x)),
      Y,
    );

  checkAll(
    'ArrowLoop<Cokleisli<Eval, *, *>>',
    ArrowLoopSuite(ArrowLoop.Cokleisli(Comonad.Eval)).arrowLoop(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      eqCokleisli,
      { ...Defer.Eval, ...Unzip.Eval },
      A.fp4tsEval,
    ),
  );

  const nonEmptySubsequences = <A>(xs: A[]): A[][] =>
    xs.length === 0
      ? []
      : [
          [xs[0]],
          ...nonEmptySubsequences(xs.slice(1)).reduce(
            (r, ys) => [ys, [xs[0], ...ys], ...r],
            [] as A[][],
          ),
        ];

  const nelToCofree = <A>(xs: A[]): Cofree<OptionF, A> => {
    const sz = xs.length;
    const go = (idx: number): Cofree<OptionF, A> =>
      Cofree(
        xs[idx],
        Eval.later(() => (idx + 1 >= sz ? None : Some(go(idx + 1)))),
      );
    return go(0);
  };

  const cofreeNelEC = <A>(
    ecA: ExhaustiveCheck<A>,
  ): ExhaustiveCheck<Cofree<OptionF, A>> =>
    ExhaustiveCheck.fromArray(
      nonEmptySubsequences(ecA.allValues.slice(0, 5))
        .filter(xs => xs.length > 0)
        .map(nelToCofree),
    );

  checkAll(
    'Compose<Cokleisli<Identity, *, *>>',
    ComposeSuite(Compose.Cokleisli(Identity.CoflatMap)).compose(
      A.fp4tsMiniInt(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      ExhaustiveCheck.miniInt(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) => eq.fn1Eq(X, Y),
    ),
  );

  checkAll(
    'Compose<Cokleisli<Option, *, *>>',
    ComposeSuite(Compose.Cokleisli(Option.CoflatMap)).compose(
      A.fp4tsMiniInt(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      ExhaustiveCheck.miniInt(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Option<X>], Y>(Y),
      <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
        eq.fn1Eq(ExhaustiveCheck(None as Option<X>).concat(X.map(Some)), Y),
    ),
  );

  checkAll(
    'Arrow<Cokleisli<Identity, *, *>>',
    ArrowSuite(Arrow.Cokleisli(Identity.Comonad)).arrow(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) => eq.fn1Eq(X, Y),
    ),
  );

  checkAll(
    'Arrow<Cokleisli<Identity, *, *>>',
    ArrowSuite(Arrow.Cokleisli(Identity.Comonad)).arrow(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) => eq.fn1Eq(X, Y),
    ),
  );

  checkAll(
    'Arrow<Cokleisli<Cofree<Option, *>, *, *>>',
    ArrowSuite(Arrow.Cokleisli(Cofree.Comonad(Option.Functor))).arrow(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
        fc.func<[Cofree<OptionF, X>], Y>(Y),
      <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) => eq.fn1Eq(cofreeNelEC(X), Y),
    ),
  );
});
