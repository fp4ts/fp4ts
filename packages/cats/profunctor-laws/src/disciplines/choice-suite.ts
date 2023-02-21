// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Either } from '@fp4ts/cats-core/lib/data';
import { Choice } from '@fp4ts/cats-profunctor';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

import { ChoiceLaws } from '../choice-laws';
import { ProfunctorSuite } from './profunctor-suite';

export const ChoiceSuite = <P>(P: Choice<P>) => {
  const laws = ChoiceLaws(P);

  const self = {
    ...ProfunctorSuite(P),

    choice: <A, B, C, D, B1, B2>(
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
      mkArbP: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqP: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
    ) =>
      new RuleSet(
        'Choice',
        [
          [
            'choice left is swapped right',
            forAll(
              mkArbP(arbA, arbB),
              laws.leftIsSwappedRight<C>(),
            )(mkEqP(ec.either(EcA, EcC), Either.Eq(EqB, EqC))),
          ],
          [
            'choice right is swapped left',
            forAll(
              mkArbP(arbA, arbB),
              laws.rightIsSwappedLeft<C>(),
            )(mkEqP(ec.either(EcC, EcA), Either.Eq(EqC, EqB))),
          ],
          [
            'choice rmap Left is lmap Left andThen left',
            forAll(
              mkArbP(arbA, arbB),
              laws.rmapLeftIsLmapLeftAndThenLeft<C>(),
            )(mkEqP(EcA, Either.Eq(EqB, EqC))),
          ],
          [
            'choice rmap Right is lmap Right andThen right',
            forAll(
              mkArbP(arbA, arbB),
              laws.rmapRightIsLmapRightAndThenRight<C>(),
            )(mkEqP(EcA, Either.Eq(EqC, EqB))),
          ],
          [
            'choice dinaturality left',
            forAll(
              mkArbP(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.dinaturalityLeft,
            )(mkEqP(ec.either(EcA, EcC), Either.Eq(EqB, EqD))),
          ],
          [
            'choice dinaturality right',
            forAll(
              mkArbP(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.dinaturalityRight,
            )(mkEqP(ec.either(EcC, EcA), Either.Eq(EqD, EqB))),
          ],
          [
            'choice left . left == dimap',
            forAll(
              mkArbP(arbA, arbB),
              laws.leftLeftIsIsDimap<C, D>(),
            )(
              mkEqP(
                ec.either(ec.either(EcA, EcC), EcD),
                Either.Eq(Either.Eq(EqB, EqC), EqD),
              ),
            ),
          ],
          [
            'choice right . right == dimap',
            forAll(
              mkArbP(arbA, arbB),
              laws.rightRightIsIsDimap<C, D>(),
            )(
              mkEqP(
                ec.either(EcD, ec.either(EcC, EcA)),
                Either.Eq(EqD, Either.Eq(EqC, EqB)),
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
            mkArbP,
            mkEqP,
          ),
        },
      ),
  };

  return self;
};
