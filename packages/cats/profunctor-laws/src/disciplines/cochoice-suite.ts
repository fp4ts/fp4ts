// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Left, Right } from '@fp4ts/cats-core/lib/data';
import { Cochoice } from '@fp4ts/cats-profunctor';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { CochoiceLaws } from '../cochoice-laws';
import { ProfunctorSuite } from './profunctor-suite';

export const CochoiceSuite = <P>(P: Cochoice<P>) => {
  const laws = CochoiceLaws(P);

  const self = {
    ...ProfunctorSuite(P),

    cochoice: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
      EcD: ExhaustiveCheck<D>,
      EqB2: Eq<B2>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqF: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
    ) =>
      new RuleSet(
        'cochoice',
        [
          [
            'cochoice unleft is swapped unright',
            forAll(
              mkArbF(arbA.map(Left), arbB.map(Left)),
              laws.unleftIsSwappedUnright,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'cochoice unright is swapped unleft',
            forAll(
              mkArbF(arbA.map(Right), arbB.map(Right)),
              laws.unrightIsSwappedUnleft,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'cochoice rmap getLeft is lmap getLeft andThen unleft',
            forAll(
              mkArbF(arbA, arbB.map(Left)),
              laws.rmapGetLeftIsLmapGetLeftAndThenUnleft,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'cochoice rmap get is lmap get andThen unright',
            forAll(
              mkArbF(arbA, arbB.map(Right)),
              laws.rmapGetIsLmapGetAndThenUnright,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'cochoice dinaturality unleft',
            forAll(
              mkArbF(arbA.map(Left), arbB.map(Left)),
              fc.func<[D], C>(arbC),
              laws.dinatrualityUnleft,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'cochoice dinaturality unright',
            forAll(
              mkArbF(arbA.map(Right), arbB.map(Right)),
              fc.func<[D], C>(arbC),
              laws.dinatrualityUnright,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'cochoice unleft . unleft == dimap',
            forAll(
              mkArbF(arbA.map(Left).map(Left), arbB.map(Left).map(Left)),
              laws.unleftUnleftIsDimap,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'cochoice unright . unright == dimap',
            forAll(
              mkArbF(arbA.map(Right).map(Right), arbB.map(Right).map(Right)),
              laws.unrightUnrightIsDimap,
            )(mkEqF(EcA, EqB)),
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
