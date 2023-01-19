// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { ArrowChoice } from '@fp4ts/cats-core';
import { Either } from '@fp4ts/cats-core/lib/data';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

import { ArrowChoiceLaws } from '../arrow-choice-laws';
import { ArrowSuite } from './arrow-suite';
import { ChoiceSuite } from './choice-suite';

export function ArrowChoiceSuite<F>(F: ArrowChoice<F>) {
  const laws = ArrowChoiceLaws(F);

  const self = {
    ...ArrowSuite(F),
    ...ChoiceSuite(F),

    arrowChoice: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EqA: Eq<A>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
      EcB: ExhaustiveCheck<B>,
      EqC: Eq<C>,
      EcC: ExhaustiveCheck<C>,
      EqD: Eq<D>,
      EcD: ExhaustiveCheck<D>,
      EqB2: Eq<B2>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<F, [X, Y]>>,
      mkEqF: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<F, [X, Y]>>,
    ) =>
      new RuleSet(
        'ArrowChoice',
        [
          [
            'left lift commute',
            forAll(
              fc.func<[A], B>(arbB),
              laws.leftLiftCommute<C>(),
            )(mkEqF(ec.either(EcA, EcC), Either.Eq(EqB, EqC))),
          ],
          [
            'left compose commute',
            forAll(
              mkArbF(arbA, arbB),
              mkArbF(arbB, arbC),
              laws.leftComposeCommute<D>(),
            )(mkEqF(ec.either(EcA, EcD), Either.Eq(EqC, EqD))),
          ],
          [
            'left right consistent',
            forAll(
              fc.func<[A], B>(arbB),
              laws.leftRightConsistent<C>(),
            )(mkEqF(ec.either(EcC, EcA), Either.Eq(EqC, EqB))),
          ],
          [
            'left >>> lift . left apply commutes',
            forAll(
              mkArbF(arbA, arbB),
              laws.leftAndThenLiftedLeftApplyCommutes<C>(),
            )(mkEqF(EcA, Either.Eq(EqB, EqC))),
          ],
          [
            'left >>> right . id commutes',
            forAll(
              mkArbF(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.leftAndThenRightIdentityCommutes,
            )(mkEqF(ec.either(EcA, EcC), Either.Eq(EqB, EqD))),
          ],
          [
            'left . left >>> assoc . (+++) commutes',
            forAll(
              mkArbF(arbA, arbD),
              laws.leftTwiceCommutesWithSumAssociation<B, C>(),
            )(
              mkEqF(
                ec.either(ec.either(EcA, EcB), EcC),
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
              EqA,
              EcA,
              EqB,
              EqC,
              EcC,
              EqD,
              EcD,
              EqB2,
              mkArbF,
              mkEqF,
            ),
            self.choice(
              arbA,
              arbB,
              arbC,
              arbD,
              EcA,
              EqB,
              EcB,
              EqD,
              mkArbF,
              mkEqF,
            ),
          ],
        },
      ),
  };

  return self;
}
