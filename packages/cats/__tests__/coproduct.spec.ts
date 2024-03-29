// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, id } from '@fp4ts/core';
import {
  ArrayF,
  Contravariant,
  EqK,
  FunctorFilter,
  Monad,
  TraversableFilter,
} from '@fp4ts/cats-core';
import {
  Coproduct,
  Identity,
  Kleisli,
  Option,
  OptionF,
} from '@fp4ts/cats-core/lib/data';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import {
  ContravariantSuite,
  FunctorFilterSuite,
  FunctorSuite,
  TraversableFilterSuite,
} from '@fp4ts/cats-laws';
import { checkAll, ExhaustiveCheck } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('coproduct', () => {
  describe('Functor', () => {
    checkAll(
      'Functor<Coproduct<Identity, Eval, *>>',
      FunctorSuite(Coproduct.Functor(Identity.Functor, Monad.Eval)).functor(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) => A.fp4tsCoproduct(X, A.fp4tsEval(X)),
        Coproduct.EqK(Identity.EqK, EqK.Eval).liftEq,
      ),
    );

    checkAll(
      'Functor<Coproduct<Eval, Identity, *>>',
      FunctorSuite(Coproduct.Functor(Monad.Eval, Identity.Functor)).functor(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) => A.fp4tsCoproduct(A.fp4tsEval(X), X),
        Coproduct.EqK(EqK.Eval, Identity.EqK).liftEq,
      ),
    );
  });

  describe('FunctorFilter', () => {
    checkAll(
      'FunctorFilter<Coproduct<Option, [], *>>',
      FunctorFilterSuite(
        Coproduct.FunctorFilter(Option.FunctorFilter, FunctorFilter.Array),
      ).functorFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) => A.fp4tsCoproduct(A.fp4tsOption(X), fc.array(X)),
        Coproduct.EqK(Option.EqK, EqK.Array).liftEq,
      ),
    );
  });

  describe('Contravariant', () => {
    checkAll(
      'Contravariant<Coproduct<* => number, * => number>>',
      ContravariantSuite(
        Coproduct.Contravariant(
          Contravariant.Function1<number>(),
          Contravariant.Function1<number>(),
        ),
      ).contravariant(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        ExhaustiveCheck.miniInt(),
        ExhaustiveCheck.miniInt(),
        () => A.fp4tsCoproduct(fc.func(fc.integer()), fc.func(fc.integer())),
        <X>(X: ExhaustiveCheck<X>) =>
          Coproduct.Eq(
            eq.fn1Eq(X, Eq.fromUniversalEquals<number>()) as any,
            eq.fn1Eq(X, Eq.fromUniversalEquals<number>()) as any,
          ) as any,
      ),
    );

    checkAll(
      'Contravariant<Product<* => Eval<number>, * => Option<number>>>',
      ContravariantSuite(
        Coproduct.Contravariant(
          Contravariant.Function1<Eval<number>>(),
          Kleisli.Contravariant<OptionF, number>(),
        ),
      ).contravariant(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        ExhaustiveCheck.miniInt(),
        ExhaustiveCheck.miniInt(),
        () =>
          A.fp4tsCoproduct(
            fc.func(A.fp4tsEval(fc.integer())),
            fc.func(A.fp4tsOption(fc.integer())),
          ),
        <X>(X: ExhaustiveCheck<X>) =>
          Coproduct.Eq(
            eq.fn1Eq(X, Eq.Eval(Eq.fromUniversalEquals())) as any,
            eq.fn1Eq(X, Option.Eq(Eq.fromUniversalEquals())) as any,
          ) as any,
      ),
    );
  });

  describe('TraversableFilter', () => {
    checkAll(
      'TraversableFilter<Coproduct<[], Option, *>>',
      TraversableFilterSuite(
        Coproduct.TraversableFilter(
          TraversableFilter.Array,
          Option.TraversableFilter,
        ),
      ).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        Coproduct.FunctorFilter(FunctorFilter.Array, Option.FunctorFilter),
        Monad.Eval,
        Identity.Applicative,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => A.fp4tsCoproduct(fc.array(X), A.fp4tsOption(X)),
        Coproduct.EqK(EqK.Array, Option.EqK).liftEq,
        A.fp4tsEval,
        Eq.Eval,
        id,
        Identity.EqK.liftEq,
      ),
    );

    checkAll(
      'TraversableFilter<Coproduct<[], [], *>>',
      TraversableFilterSuite(
        Coproduct.TraversableFilter(
          TraversableFilter.Array,
          TraversableFilter.Array,
        ),
      ).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        Coproduct.FunctorFilter(FunctorFilter.Array, FunctorFilter.Array),
        Monad.Eval,
        Identity.Applicative,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) =>
          A.fp4tsCoproduct<ArrayF, ArrayF, X>(fc.array(X), fc.array(X)),
        Coproduct.EqK(EqK.Array, EqK.Array).liftEq,
        A.fp4tsEval,
        Eq.Eval,
        id,
        Identity.EqK.liftEq,
      ),
    );
  });
});
