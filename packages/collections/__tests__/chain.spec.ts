// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { CommutativeMonoid, Eq, Monad, Option } from '@fp4ts/cats';
import { Chain } from '@fp4ts/collections-core';
import {
  AlignSuite,
  CoflatMapSuite,
  MonadPlusSuite,
  TraversableFilterSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll, IsEq } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as CA from '@fp4ts/collections-test-kit/lib/arbitraries';

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
      CA.fp4tsVector(fc.integer()),
      xs => new IsEq(Chain.fromVector(xs).headOption, xs.headOption),
    )(Option.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'lastOption',
    forAll(
      CA.fp4tsVector(fc.integer()),
      xs => new IsEq(Chain.fromVector(xs).lastOption, xs.lastOption),
    )(Option.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'collectWhile',
    forAll(
      CA.fp4tsChain(fc.integer()),
      fc.func<[number], Option<number>>(A.fp4tsOption(fc.integer())),
      (xs, f) =>
        expect(xs.collectWhile(f).toList).toEqual(xs.toList.collectWhile(f)),
    ),
  );

  test(
    'size to be consistent with toList.size',
    forAll(CA.fp4tsChain(fc.integer()), c => c.size === c.toList.size),
  );

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
        CA.fp4tsChain,
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
        CA.fp4tsChain,
        Chain.Eq,
      ),
    );

    checkAll(
      'MonadPlus<Chain>',
      MonadPlusSuite(Chain.MonadPlus).monadPlus(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        CA.fp4tsChain,
        Chain.Eq,
      ),
    );

    checkAll(
      'TraversableFilter<Chain>',
      TraversableFilterSuite(Chain.TraversableFilter).traversable(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        Chain.FunctorFilter,
        Monad.Eval,
        Monad.Eval,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        CA.fp4tsChain,
        Chain.Eq,
        A.fp4tsEval,
        Eq.Eval,
        A.fp4tsEval,
        Eq.Eval,
      ),
    );
  });
});
