// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Strong } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

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
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      EqB2: Eq<B2>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<F, [X, Y]>>,
      mkEqF: <X, Y>(EqX: Eq<X>, EqY: Eq<Y>) => Eq<Kind<F, [X, Y]>>,
    ) =>
      new RuleSet(
        'Strong',
        [
          [
            'strong first is swapped second',
            forAll(
              mkArbF(arbA, arbB),
              laws.firstIsSwappedSecond,
            )(mkEqF(Eq.tuple(EqA, EqC), Eq.tuple(EqB, EqC)) as any),
          ],
          [
            'strong second is swapped first',
            forAll(
              mkArbF(arbA, arbB),
              laws.secondIsSwappedFirst,
            )(mkEqF(Eq.tuple(EqC, EqA), Eq.tuple(EqC, EqB)) as any),
          ],
          [
            'strong lmap is first andThen rmap',
            forAll(
              mkArbF(arbA, arbB),
              laws.lmapEqualsFirstAndThenRmap,
            )(mkEqF(Eq.tuple(EqA, EqC), EqB) as any),
          ],
          [
            'strong lmap is second andThen rmap',
            forAll(
              mkArbF(arbA, arbB),
              laws.lmapEqualsSecondAndThenRmap,
            )(mkEqF(Eq.tuple(EqC, EqA), EqB) as any),
          ],
          [
            'strong dinaturality first',
            forAll(
              mkArbF(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.dinaturalityFirst,
            )(mkEqF(Eq.tuple(EqA, EqC), Eq.tuple(EqB, EqD))),
          ],
          [
            'strong dinaturality second',
            forAll(
              mkArbF(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.dinaturalitySecond,
            )(mkEqF(Eq.tuple(EqC, EqA), Eq.tuple(EqD, EqB))),
          ],
          [
            'strong first . first == dimap',
            forAll(
              mkArbF(arbA, arbB),
              laws.firstFirstIsDimap,
            )(
              mkEqF(
                Eq.tuple(Eq.tuple(EqA, EqC), EqD),
                Eq.tuple(Eq.tuple(EqB, EqC), EqD),
              ) as any,
            ),
          ],
          [
            'strong second . second == dimap',
            forAll(
              mkArbF(arbA, arbB),
              laws.secondSecondIsDimap,
            )(
              mkEqF(
                Eq.tuple(EqD, Eq.tuple(EqC, EqA)),
                Eq.tuple(EqD, Eq.tuple(EqC, EqB)),
              ) as any,
            ),
          ],
        ],
        {
          parent: self.profunctor(
            arbA,
            arbB,
            arbC,
            arbD,
            arbB1,
            arbB2,
            EqA,
            EqB,
            EqD,
            EqB2,
            mkArbF,
            mkEqF,
          ),
        },
      ),
  };

  return self;
};
