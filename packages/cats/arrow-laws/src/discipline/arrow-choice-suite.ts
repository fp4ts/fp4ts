// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Either } from '@fp4ts/cats-core/lib/data';
import { ArrowChoice } from '@fp4ts/cats-arrow';
import { ChoiceSuite } from '@fp4ts/cats-profunctor-laws';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ArrowChoiceLaws } from '../arrow-choice-laws';
import { ArrowSuite } from './arrow-suite';

export const ArrowChoiceSuite = <P>(P: ArrowChoice<P>) => {
  const laws = ArrowChoiceLaws(P);

  const self = {
    ...ArrowSuite(P),
    ...ChoiceSuite(P),

    arrowChoice: <A, B, C, D, B1, B2>(
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
    ) =>
      new RuleSet(
        'ArrowChoice',
        [
          [
            'arrowChoice lift commutes',
            forAll(
              fc.func<[A], B>(arbB),
              laws.arrowChoiceLiftCommutes<C>(),
            )(mkEqP(ExhaustiveCheck.either(EcA, EcC), Either.Eq(EqB, EqC))),
          ],
          [
            'arrowChoice left composition commutes',
            forAll(
              mkArbP(arbA, arbB),
              mkArbP(arbB, arbC),
              laws.arrowChoiceLeftCompositionCommutes<D>(),
            )(mkEqP(ExhaustiveCheck.either(EcA, EcD), Either.Eq(EqC, EqD))),
          ],
          [
            'arrowChoice left andThen lift(Left) commutes',
            forAll(
              mkArbP(arbA, arbB),
              laws.arrowChoiceLeftAndThenLiftedLeftApplyCommutes<C>(),
            )(mkEqP(EcA, Either.Eq(EqB, EqC))),
          ],
          [
            'arrowChoice left andThen right id commutes',
            forAll(
              mkArbP(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.arrowChoiceLeftAndThenRightIdentityCommutes,
            )(mkEqP(ExhaustiveCheck.either(EcA, EcC), Either.Eq(EqB, EqD))),
          ],
          [
            'arrowChoice left . left commutes with assocSum',
            forAll(
              mkArbP(arbA, arbD),
              laws.arrowChoiceLeftLeftCommutesWithSumAssoc<B, C>(),
            )(
              mkEqP(
                ExhaustiveCheck.either(ExhaustiveCheck.either(EcA, EcB), EcC),
                Either.Eq(EqD, Either.Eq(EqB, EqC)),
              ),
            ),
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
            self.choice(
              arbA,
              arbB,
              arbC,
              arbD,
              arbB1,
              arbB2,
              EcA,
              EqB,
              EqC,
              EcC,
              EqD,
              EcD,
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
