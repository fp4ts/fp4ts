// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Arrow } from '@fp4ts/cats-arrow';
import { StrongSuite } from '@fp4ts/cats-profunctor-laws';
import { exec, ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ArrowLaws } from '../arrow-laws';
import { CategorySuite } from './category-suite';

export const ArrowSuite = <P>(P: Arrow<P>) => {
  const laws = ArrowLaws(P);

  const self = {
    ...CategorySuite(P),
    ...StrongSuite(P),

    arrow: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EcA: ExhaustiveCheck<A>,
      EqA: Eq<A>,
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
        'Arrow',
        [
          ['arrow identity', exec(laws.arrowIdentity<A>())(mkEqP(EcA, EqA))],
          [
            'arrow composition',
            forAll(
              fc.func<[A], B>(arbB),
              fc.func<[B], C>(arbC),
              laws.arrowComposition,
            )(mkEqP(EcA, EqC)),
          ],
          [
            'arrow extension',
            forAll(
              fc.func<[A], B>(arbB),
              laws.arrowExtension<C>(),
            )(mkEqP(EcA.product(EcC), Eq.tuple(EqB, EqC))),
          ],
          [
            'arrow functor',
            forAll(
              mkArbP(arbA, arbB),
              mkArbP(arbB, arbC),
              laws.arrowFunctor<D>(),
            )(mkEqP(EcA.product(EcD), Eq.tuple(EqC, EqD))),
          ],
          [
            'arrow exchange',
            forAll(
              mkArbP(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.arrowExchange,
            )(mkEqP(EcA.product(EcC), Eq.tuple(EqB, EqD))),
          ],
          [
            'arrow unit',
            forAll(
              mkArbP(arbA, arbB),
              laws.arrowUnit<C>(),
            )(mkEqP(EcA.product(EcC), EqB)),
          ],
          [
            'arrow exchange',
            forAll(
              mkArbP(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.arrowExchange,
            )(mkEqP(EcA.product(EcC), Eq.tuple(EqB, EqD))),
          ],
          [
            'arrow association',
            forAll(
              mkArbP(arbA, arbB),
              laws.arrowAssociation<C, D>(),
            )(
              mkEqP(
                EcA.product(EcC).product(EcD),
                Eq.tuple(EqB, Eq.tuple(EqC, EqD)),
              ),
            ),
          ],
          [
            'arrow split consistent with andThen',
            forAll(
              mkArbP(arbA, arbB),
              mkArbP(arbC, arbD),
              laws.arrowSplitConsistentWithAndThen,
            )(mkEqP(EcA.product(EcC), Eq.tuple(EqB, EqD))),
          ],
          [
            'arrow merge consistent with split',
            forAll(
              mkArbP(arbA, arbB),
              mkArbP(arbA, arbC),
              laws.arrowMergeConsistentWithAndThen,
            )(mkEqP(EcA, Eq.tuple(EqB, EqC))),
          ],
        ],
        {
          parents: [
            self.category(
              arbA,
              arbB,
              arbC,
              arbB2,
              EcA,
              EqB,
              EqC,
              EqB2,
              mkArbP,
              mkEqP,
            ),
            self.strong(
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
