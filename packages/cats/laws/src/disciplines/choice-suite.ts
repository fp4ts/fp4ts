// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Choice } from '@fp4ts/cats-core';
import { Either } from '@fp4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ChoiceLaws } from '../choice-laws';
import { CategorySuite } from './category-suite';

export const ChoiceSuite = <F>(F: Choice<F>) => {
  const laws = ChoiceLaws(F);

  const self = {
    ...CategorySuite(F),

    choice: <A, B, C, D>(
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
        'Choice',
        [
          [
            'choice composition distributivity',
            forAll(
              mkArbF(arbA, arbC),
              mkArbF(arbB, arbC),
              mkArbF(arbC, arbD),
              laws.choiceCompositionDistributivity,
            )(mkEqF(Either.Eq(EqA, EqB), EqD)),
          ],
        ],
        {
          parent: self.category(
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
