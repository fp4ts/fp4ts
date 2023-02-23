// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import {
  Identity,
  List,
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
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Cokleisli', () => {
  const eqCokleisli = <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) =>
    eq.fn1Eq(ec.instance(X.allValues.map((x: X) => Eval.now(x))), Y);

  checkAll(
    'ArrowLoop<Cokleisli<Eval, *, *>>',
    ArrowLoopSuite(ArrowLoop.Cokleisli(Comonad.Eval)).arrowLoop(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      eqCokleisli,
      { ...Defer.Eval, ...Unzip.Eval },
      A.fp4tsEval,
    ),
  );

  const nonEmptySubsequences = <A>(xs: List<A>): List<List<A>> =>
    xs.fold(
      () => List.empty,
      (x, xs) =>
        nonEmptySubsequences(xs)
          .foldLeft(List.empty as List<List<A>>, (r, ys) =>
            r.cons(ys.cons(x)).cons(ys),
          )
          .cons(List(x)),
    );

  const nelToCofree = <A>(xs: List<A>): Cofree<OptionF, A> =>
    Cofree(
      xs.head,
      Eval.later(() => (xs.tail.isEmpty ? None : Some(nelToCofree(xs.tail)))),
    );

  const cofreeNelEC = <A>(
    ecA: ec.ExhaustiveCheck<A>,
  ): ec.ExhaustiveCheck<Cofree<OptionF, A>> =>
    ec.instance(
      nonEmptySubsequences(ecA.allValues.take(3))
        .filter(xs => xs.nonEmpty)
        .map(nelToCofree),
    );

  checkAll(
    'Compose<Cokleisli<Identity, *, *>>',
    ComposeSuite(Compose.Cokleisli(Identity.CoflatMap)).compose(
      A.fp4tsMiniInt(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) => eq.fn1Eq(X, Y),
    ),
  );

  checkAll(
    'Compose<Cokleisli<Option, *, *>>',
    ComposeSuite(Compose.Cokleisli(Option.CoflatMap)).compose(
      A.fp4tsMiniInt(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Option<X>], Y>(Y),
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) =>
        eq.fn1Eq(
          ec.instance(List(None as Option<X>)['++'](X.allValues.map(Some))),
          Y,
        ),
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
      ec.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) => eq.fn1Eq(X, Y),
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
      ec.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) => eq.fn1Eq(X, Y),
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
      ec.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
        fc.func<[Cofree<OptionF, X>], Y>(Y),
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) => eq.fn1Eq(cofreeNelEC(X), Y),
    ),
  );
});
