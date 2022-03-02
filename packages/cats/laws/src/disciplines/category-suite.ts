// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Category } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { CategoryLaws } from '../category-laws';
import { ComposeSuite } from './compose-suite';

export const CategorySuite = <F>(F: Category<F>) => {
  const laws = CategoryLaws(F);

  const self = {
    ...ComposeSuite(F),

    category: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<F, [X, Y]>>,
      mkEqF: <X, Y>(EqX: Eq<X>, EqY: Eq<Y>) => Eq<Kind<F, [X, Y]>>,
    ) =>
      new RuleSet(
        'Category',
        [
          [
            'category left identity',
            forAll(
              mkArbF(arbA, arbB),
              laws.categoryLeftIdentity,
            )(mkEqF(EqA, EqB)),
          ],
          [
            'category right identity',
            forAll(
              mkArbF(arbA, arbB),
              laws.categoryRightIdentity,
            )(mkEqF(EqA, EqB)),
          ],
        ],
        {
          parent: self.compose(
            arbA,
            arbB,
            arbC,
            arbD,
            EqA,
            EqB,
            EqC,
            EqD,
            mkArbF,
            mkEqF,
          ),
        },
      ),
  };

  return self;
};
