// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Strong } from '@fp4ts/cats-core';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { StrongLaws } from '../strong-laws';
import { ProfunctorSuite } from './profunctor-suite';

export const StrongSuite = <F>(F: Strong<F>) => {
  const laws = StrongLaws(F);

  const self = {
    ...ProfunctorSuite(F),

    strong: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
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
        'Strong',
        [
          [
            'strong first is swapped second',
            forAll(
              mkArbF(arbA, arbB),
              laws.firstIsSwappedSecond<C>(),
            )(mkEqF(EcA.product(EcC), Eq.tuple(EqB, EqC))),
          ],
          [
            'strong second is swapped first',
            forAll(
              mkArbF(arbA, arbB),
              laws.secondIsSwappedFirst<C>(),
            )(mkEqF(EcC.product(EcA), Eq.tuple(EqC, EqB))),
          ],
          [
            'strong lmap is first andThen rmap',
            forAll(
              mkArbF(arbA, arbB),
              laws.lmapEqualsFirstAndThenRmap<C>(),
            )(mkEqF(EcA.product(EcC), EqB)),
          ],
          [
            'strong lmap is second andThen rmap',
            forAll(
              mkArbF(arbA, arbB),
              laws.lmapEqualsSecondAndThenRmap<C>(),
            )(mkEqF(EcC.product(EcA), EqB)),
          ],
          [
            'strong dinaturality first',
            forAll(
              mkArbF(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.dinaturalityFirst,
            )(mkEqF(EcA.product(EcC), Eq.tuple(EqB, EqD))),
          ],
          [
            'strong dinaturality second',
            forAll(
              mkArbF(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.dinaturalitySecond,
            )(mkEqF(EcC.product(EcA), Eq.tuple(EqD, EqB))),
          ],
          [
            'strong first . first == dimap',
            forAll(
              mkArbF(arbA, arbB),
              laws.firstFirstIsDimap<C, D>(),
            )(
              mkEqF(
                EcA.product(EcC).product(EcD),
                Eq.tuple(Eq.tuple(EqB, EqC), EqD),
              ),
            ),
          ],
          [
            'strong second . second == dimap',
            forAll(
              mkArbF(arbA, arbB),
              laws.secondSecondIsDimap<C, D>(),
            )(
              mkEqF(
                EcD.product(EcC.product(EcA)),
                Eq.tuple(EqD, Eq.tuple(EqC, EqB)),
              ),
            ),
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
};
