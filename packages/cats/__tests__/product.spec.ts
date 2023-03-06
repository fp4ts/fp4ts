// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, id } from '@fp4ts/core';
import {
  Align,
  Alternative,
  Contravariant,
  Defer,
  Distributive,
  EqK,
  FunctorFilter,
  Monad,
  Traversable,
  TraversableFilter,
  Zip,
} from '@fp4ts/cats-core';
import {
  Identity,
  Kleisli,
  None,
  Option,
  OptionF,
  Product,
  Some,
} from '@fp4ts/cats-core/lib/data';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import {
  AlignSuite,
  AlternativeSuite,
  ContravariantSuite,
  DeferSuite,
  DistributiveSuite,
  MonadSuite,
  TraversableFilterSuite,
  ZipSuite,
} from '@fp4ts/cats-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Product', () => {
  describe('Defer', () => {
    checkAll(
      'Defer<Product<Eval, Eval, *>>',
      DeferSuite(Product.Defer(Defer.Eval, Defer.Eval)).defer(
        fc.integer(),
        Eq.fromUniversalEquals(),
        X => fc.tuple(A.fp4tsEval(X), A.fp4tsEval(X)),
        Product.EqK(EqK.Eval, EqK.Eval).liftEq,
      ),
    );

    checkAll(
      'Defer<Product<Eval, () => *, *>>',
      DeferSuite(Product.Defer(Defer.Eval, Defer.Function0)).defer(
        fc.integer(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) =>
          fc.tuple(
            A.fp4tsEval(X),
            X.map(x => () => x),
          ),
        Product.EqK(EqK.Eval, EqK.Function0).liftEq,
      ),
    );

    checkAll(
      'Defer<Product<() => *, MiniInt => *, *>>',
      DeferSuite(
        Product.Defer(Defer.Function0, Defer.Function1<MiniInt>()),
      ).defer(
        fc.integer(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) =>
          fc.tuple(
            X.map(x => () => x),
            fc.func(X),
          ),
        X => Eq.tuple(Eq.Function0(X), eq.fn1Eq(ExhaustiveCheck.miniInt(), X)),
      ),
    );
  });

  describe('Contravariant', () => {
    checkAll(
      'Contravariant<Product<* => number, * => number>>',
      ContravariantSuite(
        Product.Contravariant(
          Contravariant.Function1<number>(),
          Contravariant.Function1<number>(),
        ),
      ).contravariant(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        ExhaustiveCheck.miniInt(),
        ExhaustiveCheck.miniInt(),
        () => fc.tuple(fc.func(fc.integer()), fc.func(fc.integer())),
        X =>
          Eq.tuple(
            eq.fn1Eq(X, Eq.fromUniversalEquals()),
            eq.fn1Eq(X, Eq.fromUniversalEquals()),
          ),
      ),
    );

    checkAll(
      'Contravariant<Product<* => Eval<number>, * => Option<number>>>',
      ContravariantSuite(
        Product.Contravariant(
          Contravariant.Function1<Eval<number>>(),
          Kleisli.Contravariant<OptionF, number>(),
        ),
      ).contravariant(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        ExhaustiveCheck.miniInt(),
        ExhaustiveCheck.miniInt(),
        () =>
          fc.tuple(
            fc.func(A.fp4tsEval(fc.integer())),
            fc.func(A.fp4tsOption(fc.integer())),
          ),
        X =>
          Eq.tuple(
            eq.fn1Eq(X, Eq.Eval(Eq.fromUniversalEquals())),
            eq.fn1Eq(X, Option.Eq(Eq.fromUniversalEquals())),
          ),
      ),
    );
  });

  describe('Distributive', () => {
    checkAll(
      'Distributive<Identity, () => *>',
      DistributiveSuite(
        Product.Distributive(Identity.Distributive, Distributive.Function0),
      ).distributive(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) =>
          fc.tuple(
            X,
            X.map(x => () => x),
          ),
        Product.EqK(Identity.EqK, EqK.Function0).liftEq,
      ),
    );

    checkAll(
      'Distributive<MiniInt => *, () => *>',
      DistributiveSuite(
        Product.Distributive(
          Distributive.Function1<MiniInt>(),
          Distributive.Function0,
        ),
      ).distributive(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) =>
          fc.tuple(
            fc.func(X),
            X.map(x => () => x),
          ),
        X => Eq.tuple(eq.fn1Eq(ExhaustiveCheck.miniInt(), X), Eq.Function0(X)),
      ),
    );
  });

  describe('Apply', () => {
    it('preserves short-circuiting behavior', () => {
      const F = Product.Apply(Option.Monad, Option.Monad);

      expect(F.map2Eval_([None, None], Eval.bottom(), () => {}).value).toEqual([
        None,
        None,
      ]);
    });

    it('allows short-circuiting on traverse', () => {
      let cnt = 0;
      expect(
        Traversable.Array.traverse_(
          Product.Applicative(Option.Monad, Option.Monad),
        )(
          [1, 2, 3, 4, 5],
          _ => (cnt++, [None, None] as [Option<number>, Option<number>]),
        ),
      ).toEqual([None, None]);
      expect(cnt).toBe(1);
    });

    it("doesn't short-circuit on only left short-circuit", () => {
      let cnt = 0;
      expect(
        Traversable.Array.traverse_(
          Product.Applicative(Option.Monad, Option.Monad),
        )(
          [1, 2, 3, 4, 5],
          x => (cnt++, [None, Some(x)] as [Option<number>, Option<number>]),
        ),
      ).toEqual([None, Some([1, 2, 3, 4, 5])]);
      expect(cnt).toBe(5);
    });

    it("doesn't short-circuit on only right short-circuit", () => {
      let cnt = 0;
      expect(
        Traversable.Array.traverse_(
          Product.Applicative(Option.Monad, Option.Monad),
        )(
          [1, 2, 3, 4, 5],
          x => (cnt++, [Some(x), None] as [Option<number>, Option<number>]),
        ),
      ).toEqual([Some([1, 2, 3, 4, 5]), None]);
      expect(cnt).toBe(5);
    });

    it("doesn't call mapping function more than once per source element", () => {
      let cnt = 0;
      expect(
        Traversable.Array.traverse_(
          Product.Applicative(Option.Monad, Option.Monad),
        )(
          [1, 2, 3, 4, 5],
          x => (cnt++, [Some(x), Some(x)] as [Option<number>, Option<number>]),
        ),
      ).toEqual([Some([1, 2, 3, 4, 5]), Some([1, 2, 3, 4, 5])]);
      expect(cnt).toBe(5);
    });
  });

  describe('Alternative', () => {
    it('preserves short-circuiting behavior of first functor', () => {
      const F = Product.Alternative(Option.Alternative, Option.Alternative);
      expect(
        F.combineKEval_([Some(42), Some(42)], Eval.bottom()).value,
      ).toEqual([Some(42), Some(42)]);
    });

    checkAll(
      'Alternative<Product<[], [], *>>',
      AlternativeSuite(
        Product.Alternative(Alternative.Array, Alternative.Array),
      ).alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.tuple(fc.array(X), fc.array(X)),
        Product.EqK(EqK.Array, EqK.Array).liftEq,
      ),
    );

    checkAll(
      'Alternative<Product<Array, Option, *>>',
      AlternativeSuite(
        Product.Alternative(Alternative.Array, Option.Alternative),
      ).alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.tuple(fc.array(X), A.fp4tsOption(X)),
        Product.EqK(EqK.Array, Option.EqK).liftEq,
      ),
    );
  });

  describe('Monad', () => {
    checkAll(
      'Monad<Product<Eval, Identity, *>>',
      MonadSuite(Product.Monad(Monad.Eval, Identity.Monad)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.tuple(A.fp4tsEval(X), X),
        Product.EqK(EqK.Eval, Identity.EqK).liftEq,
      ),
    );

    checkAll(
      'Monad<Product<Eval, Identity, *>>',
      MonadSuite(Product.Monad(Monad.Function0, Monad.Array)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) =>
          fc.tuple(
            X.map(x => () => x),
            fc.array(X),
          ),
        Product.EqK(EqK.Function0, EqK.Array).liftEq,
      ),
    );
  });

  describe('TraversableFilter', () => {
    checkAll(
      'TraversableFilter<Product<[], Option, *>>',
      TraversableFilterSuite(
        Product.TraversableFilter(
          TraversableFilter.Array,
          Option.TraversableFilter,
        ),
      ).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        Product.FunctorFilter(FunctorFilter.Array, Option.FunctorFilter),
        Monad.Eval,
        Identity.Applicative,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.tuple(fc.array(X), A.fp4tsOption(X)),
        Product.EqK(EqK.Array, Option.EqK).liftEq,
        A.fp4tsEval,
        Eq.Eval,
        id,
        Identity.EqK.liftEq,
      ),
    );

    checkAll(
      'TraversableFilter<Product<[], [], *>>',
      TraversableFilterSuite(
        Product.TraversableFilter(
          TraversableFilter.Array,
          TraversableFilter.Array,
        ),
      ).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        Product.FunctorFilter(FunctorFilter.Array, FunctorFilter.Array),
        Monad.Eval,
        Identity.Applicative,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.tuple(fc.array(X), fc.array(X)),
        Product.EqK(EqK.Array, EqK.Array).liftEq,
        A.fp4tsEval,
        Eq.Eval,
        id,
        Identity.EqK.liftEq,
      ),
    );
  });

  describe('Zip', () => {
    checkAll(
      'Zip<Product<[], [], *>>',
      ZipSuite(Product.Zip(Zip.Array, Zip.Array)).zip(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.tuple(fc.array(X), fc.array(X)),
        Product.EqK(EqK.Array, EqK.Array).liftEq,
      ),
    );
  });

  describe('Align', () => {
    checkAll(
      'Align<Product<[], [], *>>',
      AlignSuite(Product.Align(Align.Array, Align.Array)).align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.tuple(fc.array(X), fc.array(X)),
        Product.EqK(EqK.Array, EqK.Array).liftEq,
      ),
    );
  });
});
