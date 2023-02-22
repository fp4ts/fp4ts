// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Category } from '@fp4ts/cats-arrow';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { CategoryLaws } from '../category-laws';
import { ComposeSuite } from './compose-suite';

export const CategorySuite = <P>(P: Category<P>) => {
  const laws = CategoryLaws(P);

  const self = {
    ...ComposeSuite(P),

    category: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbP: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqP: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
    ) =>
      new RuleSet(
        'Category',
        [
          [
            'category left identity',
            forAll(
              mkArbP(arbA, arbB),
              laws.categoryLeftIdentity,
            )(mkEqP(EcA, EqB)),
          ],
          [
            'compose right identity',
            forAll(
              mkArbP(arbA, arbB),
              laws.categoryRightIdentity,
            )(mkEqP(EcA, EqB)),
          ],
        ],
        {
          parent: self.compose(
            arbA,
            arbB,
            arbC,
            arbD,
            EcA,
            EqC,
            EqD,
            mkArbP,
            mkEqP,
          ),
        },
      ),
  };

  return self;
};
