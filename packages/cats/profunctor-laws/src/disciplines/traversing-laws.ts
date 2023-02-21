// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Traversable } from '@fp4ts/cats-core';
import { Traversing } from '@fp4ts/cats-profunctor';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { TraversingLaws } from '../traversing-laws';
import { ChoiceSuite } from './choice-suite';
import { StrongSuite } from './strong-suite';

export const TraversingSuite = <P>(P: Traversing<P>) => {
  const laws = TraversingLaws(P);

  const self = {
    ...StrongSuite(P),
    ...ChoiceSuite(P),

    traversing: <F, A, B, C, D, B1, B2>(
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
      F: Traversable<F>,
      mkArbP: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqP: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
      mkEcF: <X>(arbX: ExhaustiveCheck<X>) => ExhaustiveCheck<Kind<F, [X]>>,
      mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
    ) =>
      new RuleSet(
        'Traversing',
        [
          [
            'traversing traverse is wander traverse',
            forAll(
              fc.constant(F),
              mkArbP(arbA, arbB),
              laws.traverseIsWanderTraverse,
            )(mkEqP(mkEcF(EcA), mkEqF(EqB))),
          ],
          [
            'traversing rmap traverse is traverse rmap(map)',
            forAll(
              fc.constant(F),
              mkArbP(arbA, arbB),
              fc.func(arbC),
              laws.rmapTraverseIsTraverseRmapMap,
            )(mkEqP(mkEcF(EcA), mkEqF(EqC))),
          ],
          [
            'traversing traverse sequential composition',
            forAll(
              fc.constant(F),
              fc.constant(F),
              mkArbP(arbA, arbB),
              laws.traverseSequentialComposition,
            )(mkEqP(mkEcF(mkEcF(EcA)), mkEqF(mkEqF(EqB)))),
          ],
          [
            'traversing traverse identity',
            forAll(
              mkArbP(arbA, arbB),
              laws.traverseIdentityIsIdentity,
            )(mkEqP(EcA, EqB)),
          ],
        ],
        {
          parents: [
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
