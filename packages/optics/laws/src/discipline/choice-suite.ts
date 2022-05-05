// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Either, Eq } from '@fp4ts/cats';
import { ProfunctorSuite } from '@fp4ts/cats-laws';
import { Choice } from '@fp4ts/optics-kernel';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import { ChoiceLaws } from '../choice-laws';

export function ChoiceSuite<P>(P: Choice<P>) {
  const laws = ChoiceLaws(P);

  const self = {
    ...ProfunctorSuite(P),
    choice: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EcC: ExhaustiveCheck<C>,
      EcD: ExhaustiveCheck<D>,
      EqB2: Eq<B2>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqF: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
    ) =>
      new RuleSet(
        'Choice',
        [
          [
            'left consistent with right',
            forAll(
              mkArbF(arbA, arbB),
              laws.leftConsistentWithRight<C>(),
            )(mkEqF(ec.either(EcA, EcC), Either.Eq(EqB, EqC))),
          ],
          [
            'right consistent with left',
            forAll(
              mkArbF(arbA, arbB),
              laws.rightConsistentWithLeft<C>(),
            )(mkEqF(ec.either(EcC, EcA), Either.Eq(EqC, EqB))),
          ],
          [
            'rmap Left ≡ lmap Left . left',
            forAll(
              mkArbF(arbA, arbB),
              laws.rmapLeftIsLmapLeftAndLeft<C>(),
            )(mkEqF(EcA, Either.Eq(EqB, EqC))),
          ],
          [
            'rmap Right ≡ lmap Right . right',
            forAll(
              mkArbF(arbA, arbB),
              laws.rmapRightIsLmapRightAndRight<C>(),
            )(mkEqF(EcA, Either.Eq(EqC, EqB))),
          ],
        ],
        {
          parent: self.profunctor(
            arbA,
            arbB,
            arbC,
            arbB1,
            arbB2,
            EcA,
            EqB,
            EcD,
            EqB2,
            mkArbF,
            mkEqF,
          ),
        },
      ),
  };

  return self;
}
