// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { CommutativeMonoid, Eq } from '@fp4ts/cats-kernel';
import { Eval } from '@fp4ts/cats-core';
import { Chain, Option } from '@fp4ts/cats-core/lib/data';
import {
  AlignSuite,
  AlternativeSuite,
  CoflatMapSuite,
  FunctorFilterSuite,
  MonadSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll, IsEq } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Chain', () => {
  describe('types', () => {
    it('should be covariant', () => {
      const c: Chain<number> = Chain.empty;
    });

    it('should not allow for unrelated type widening', () => {
      const c: Chain<number> = Chain.empty;

      // @ts-expect-error
      c.append('string');
    });
  });

  test(
    'headOption',
    forAll(
      A.fp4tsVector(fc.integer()),
      xs => new IsEq(Chain.fromVector(xs).headOption, xs.headOption),
    )(Option.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'lastOption',
    forAll(
      A.fp4tsVector(fc.integer()),
      xs => new IsEq(Chain.fromVector(xs).lastOption, xs.lastOption),
    )(Option.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'size to be consistent with toList.size',
    forAll(A.fp4tsChain(fc.integer()), c => c.size === c.toList.size),
  );

  it('should do something', () => {
    expect(Chain(1, 2, 3)['+++'](Chain(4, 5)).toArray).toEqual([1, 2, 3, 4, 5]);
  });

  describe('Laws', () => {
    checkAll(
      'Align<Chain>',
      AlignSuite(Chain.Align).align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsChain,
        Chain.Eq,
      ),
    );

    checkAll(
      'FunctorFiler<Chain>',
      FunctorFilterSuite(Chain.FunctorFilter).functorFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsChain,
        Chain.Eq,
      ),
    );

    checkAll(
      'Alternative<Chain>',
      AlternativeSuite(Chain.Alternative).alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsChain,
        Chain.Eq,
      ),
    );

    checkAll(
      'CoflatMap<Chain>',
      CoflatMapSuite(Chain.CoflatMap).coflatMap(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsChain,
        Chain.Eq,
      ),
    );

    checkAll(
      'Monad<Chain>',
      MonadSuite(Chain.Monad).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsChain,
        Chain.Eq,
      ),
    );

    checkAll(
      'Traversable<Chain>',
      TraversableSuite(Chain.Traversable).traversable(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        Chain.Monad,
        Eval.Applicative,
        Eval.Applicative,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsChain,
        Chain.Eq,
        A.fp4tsEval,
        Eval.Eq,
        A.fp4tsEval,
        Eval.Eq,
      ),
    );
  });
});
