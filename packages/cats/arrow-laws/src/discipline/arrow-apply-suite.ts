// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { ArrowApply } from '@fp4ts/cats-arrow';
import { exec, ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ArrowApplyLaws } from '../arrow-apply-laws';
import { ArrowSuite } from './arrow-suite';

export const ArrowApplySuite = <P>(P: ArrowApply<P>) => {
  const laws = ArrowApplyLaws(P);

  const self = {
    ...ArrowSuite(P),

    arrowApply: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EcA: ExhaustiveCheck<A>,
      EqA: Eq<A>,
      EcB: ExhaustiveCheck<B>,
      EqB: Eq<B>,
      EcC: ExhaustiveCheck<C>,
      EqC: Eq<C>,
      EcD: ExhaustiveCheck<D>,
      EqD: Eq<D>,
      EqB2: Eq<B2>,
      mkArbP: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqP: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
      mkEcP: <X, Y>(
        EcX: ExhaustiveCheck<X>,
        ECY: ExhaustiveCheck<Y>,
      ) => ExhaustiveCheck<Kind<P, [X, Y]>>,
    ) =>
      new RuleSet(
        'ArrowApply',
        [
          [
            'arrowApply first lift app identity',
            exec(laws.arrowApplyFirstLiftAppIdentity<A, B>())(
              mkEqP(EcA.product(EcB), Eq.tuple(EqA, EqB)),
            ),
          ],
          [
            'arrowApply left left compose app equivalence',
            forAll(
              mkArbP(arbA, arbB),
              laws.arrowApplyLeftComposeAppEquivalence<C>(),
            )(mkEqP(mkEcP(EcB, EcC).product(EcA), EqC)),
          ],
          [
            'arrowApply right compose app equivalence',
            forAll(
              mkArbP(arbA, arbB),
              laws.arrowApplyRightComposeAppEquivalence<C>(),
            )(mkEqP(mkEcP(EcC, EcA).product(EcC), EqB)),
          ],
        ],
        {
          parents: [
            self.arrow(
              arbA,
              arbB,
              arbC,
              arbD,
              arbB1,
              arbB2,
              EcA,
              EqA,
              EqB,
              EcC,
              EqC,
              EcD,
              EqD,
              EqB2,
              mkArbP,
              mkEqP,
            ),
          ],
        },
      ),
  };

  return self;
};
