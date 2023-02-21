// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Costrong } from '@fp4ts/cats-profunctor';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { CostrongLaws } from '../costrong-laws';
import { ProfunctorSuite } from './profunctor-suite';

export const CostrongSuite = <P>(P: Costrong<P>) => {
  const laws = CostrongLaws(P);

  const self = {
    ...ProfunctorSuite(P),

    costrong: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
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
        'Costrong',
        [
          [
            'costrong unfirst is swapped unsecond',
            forAll(
              mkArbF(fc.tuple(arbA, arbC), fc.tuple(arbB, arbC)),
              laws.unfirstIsSwappedUnsecond,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'costrong unsecond is swapped unfirst',
            forAll(
              mkArbF(fc.tuple(arbC, arbA), fc.tuple(arbC, arbB)),
              laws.unsecondIsSwappedUnfirst,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'costrong lmap is rmap andThen unfirst',
            forAll(
              mkArbF(fc.tuple(arbA, fc.constant(undefined)), arbB),
              laws.lmapIsRmapAndThenUnfirst,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'costrong lmap is rmap andThen unsecond',
            forAll(
              mkArbF(fc.tuple(fc.constant(undefined), arbA), arbB),
              laws.lmapIsRmapAndThenUnsecond,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'costrong dinaturality unfirst',
            forAll(
              mkArbF(
                fc.tuple(arbA, fc.constant(undefined)),
                fc.tuple(arbB, fc.constant(undefined)),
              ),
              fc.func(fc.constant(undefined)),
              laws.dinaturalityUnfirst,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'costrong dinaturality unsecond',
            forAll(
              mkArbF(
                fc.tuple(fc.constant(undefined), arbA),
                fc.tuple(fc.constant(undefined), arbB),
              ),
              fc.func(fc.constant(undefined)),
              laws.dinaturalityUnsecond,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'costrong unfirst . unfirst == dimap',
            forAll(
              mkArbF(
                fc.tuple(fc.tuple(arbA, arbC), arbD),
                fc.tuple(fc.tuple(arbB, arbC), arbD),
              ),
              laws.unfirstUnfirstIsDimap,
            )(mkEqF(EcA, EqB)),
          ],
          [
            'costrong unsecond . unsecond == dimap',
            forAll(
              mkArbF(
                fc.tuple(arbD, fc.tuple(arbC, arbA)),
                fc.tuple(arbD, fc.tuple(arbC, arbB)),
              ),
              laws.unsecondUnsecondIsDimap,
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
