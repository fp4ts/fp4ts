// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Closed } from '@fp4ts/cats-profunctor';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

import { ClosedLaws } from '../closed-laws';
import { ProfunctorSuite } from './profunctor-suite';

export const ClosedSuite = <P>(P: Closed<P>) => {
  const laws = ClosedLaws(P);

  const self = {
    ...ProfunctorSuite(P),

    closed: <A, B, X, Y, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbX: Arbitrary<X>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
      EcX: ExhaustiveCheck<X>,
      EcY: ExhaustiveCheck<Y>,
      EqB2: Eq<B2>,
      mkArbP: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqP: <X, Y>(EcX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
    ) =>
      new RuleSet(
        'Closed',
        [
          [
            'closed lmap (. f) . closed == rmap (. f) . closed',
            forAll(
              mkArbP(arbA, arbB),
              fc.func<[X], X>(arbX),
              laws.lmapClosedIsRmapClosed,
            )(
              mkEqP(
                ec.instance(EcA.allValues.map(a => (_: X) => a)),
                eq.fn1Eq(EcX, EqB),
              ),
            ),
          ],
          [
            'closed closed . closed == dimap uncurry curry . closed',
            forAll(
              mkArbP(arbA, arbB),
              laws.closedClosedIsClosedDimapUncurryCurry<X, Y>(),
            )(
              mkEqP(
                ec.instance(EcA.allValues.map(a => (_: X) => (_: Y) => a)),
                eq.fn1Eq(EcX, eq.fn1Eq(EcY, EqB)),
              ),
            ),
          ],
          [
            'closed dimap const ($ ()) . closed === id',
            forAll(
              mkArbP(arbA, arbB),
              laws.closedDimapConstApplyVoidIsIdentity,
            )(mkEqP(EcA, EqB)),
          ],
        ],
        {
          parent: self.profunctor(
            arbA,
            arbB,
            arbX,
            arbB1,
            arbB2,
            EcA,
            EqB,
            EcX,
            EqB2,
            mkArbP,
            mkEqP,
          ),
        },
      ),
  };
  return self;
};
