// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import {
  Cokleisli,
  Identity,
  IdentityF,
  List,
  None,
  Option,
  OptionF,
  Some,
} from '@fp4ts/cats-core/lib/data';
import { Eval } from '@fp4ts/cats-core';
import { Cofree, CofreeF } from '@fp4ts/cats-free';
import { ArrowSuite, ComposeSuite, MonadSuite } from '@fp4ts/cats-laws';
import {
  checkAll,
  ExhaustiveCheck,
  fn1Eq,
  MiniInt,
} from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Cokleisli', () => {
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
    ecA: ExhaustiveCheck<A>,
  ): ExhaustiveCheck<Cofree<OptionF, A>> =>
    ec.instance(
      nonEmptySubsequences(ecA.allValues.take(3))
        .filter(xs => xs.nonEmpty)
        .map(nelToCofree),
    );

  describe('Laws', () => {
    const eqCokleisli = <F, A, B>(
      EFA: ExhaustiveCheck<Kind<F, [A]>>,
      EqB: Eq<B>,
    ): Eq<Cokleisli<F, A, B>> => fn1Eq(EFA, EqB);

    checkAll(
      'Monad<Cokleisli<Identity, MiniInt, *>>',
      MonadSuite(Cokleisli.Monad<IdentityF, MiniInt>()).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(X: Arbitrary<X>) => fc.func<[MiniInt], X>(X),
        <X>(X: Eq<X>) => eqCokleisli(ec.miniInt(), X),
      ),
    );

    checkAll(
      'Compose<Cokleisli<Identity, *, *>>',
      ComposeSuite(Cokleisli.Compose(Identity.CoflatMap)).compose(
        A.fp4tsMiniInt(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        ec.miniInt(),
        Eq.primitive,
        <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
        <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
          eqCokleisli<IdentityF, X, Y>(X, Y),
      ),
    );

    checkAll(
      'Compose<Cokleisli<Option, *, *>>',
      ComposeSuite(Cokleisli.Compose(Option.CoflatMap)).compose(
        A.fp4tsMiniInt(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        ec.miniInt(),
        Eq.primitive,
        <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Option<X>], Y>(Y),
        <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
          eqCokleisli<OptionF, X, Y>(
            ec.instance(List(None as Option<X>)['+++'](X.allValues.map(Some))),
            Y,
          ),
      ),
    );

    checkAll(
      'Arrow<Cokleisli<Identity, *, *>>',
      ArrowSuite(Cokleisli.Arrow(Identity.Comonad)).arrow(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        fc.boolean(),
        fc.boolean(),
        fc.integer(),
        fc.integer(),
        MiniInt.Eq,
        ec.miniInt(),
        MiniInt.Eq,
        Eq.primitive,
        ec.boolean(),
        Eq.primitive,
        ec.boolean(),
        Eq.primitive,
        <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
        <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
          eqCokleisli<IdentityF, X, Y>(X, Y),
      ),
    );

    checkAll(
      'Arrow<Cokleisli<Identity, *, *>>',
      ArrowSuite(Cokleisli.Arrow(Identity.Comonad)).arrow(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        fc.boolean(),
        fc.boolean(),
        fc.integer(),
        fc.integer(),
        MiniInt.Eq,
        ec.miniInt(),
        MiniInt.Eq,
        Eq.primitive,
        ec.boolean(),
        Eq.primitive,
        ec.boolean(),
        Eq.primitive,
        <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
        <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
          eqCokleisli<IdentityF, X, Y>(X, Y),
      ),
    );

    checkAll(
      'Arrow<Cokleisli<Cofree<Option, *>, *, *>>',
      ArrowSuite(Cokleisli.Arrow(Cofree.Comonad(Option.Functor))).arrow(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        fc.boolean(),
        fc.boolean(),
        fc.integer(),
        fc.integer(),
        MiniInt.Eq,
        ec.miniInt(),
        MiniInt.Eq,
        Eq.primitive,
        ec.boolean(),
        Eq.primitive,
        ec.boolean(),
        Eq.primitive,
        <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
          fc.func<[Cofree<OptionF, X>], Y>(Y),
        <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
          eqCokleisli<$<CofreeF, [OptionF]>, X, Y>(cofreeNelEC(X), Y),
      ),
    );
  });
});
