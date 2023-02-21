// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Representable } from '@fp4ts/cats-profunctor';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

import { RepresentableLaws } from '../representable-laws';
import { StrongSuite } from './strong-suite';

export const RepresentableSuite = <P, F>(P: Representable<P, F>) => {
  const laws = RepresentableLaws(P);

  const self = {
    ...StrongSuite(P),

    representable: <A, B, C, D, B1, B2>(
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
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(EqY: Eq<X>) => Eq<Kind<F, [X]>>,
    ) =>
      new RuleSet(
        'Representable',
        [
          [
            'representable  sieve . tabulate == id',
            forAll(
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              laws.tabulateSieveIsIdentity,
            )(eq.fn1Eq(EcA, mkEqF(EqB))),
          ],
          [
            'representable  tabulate . sieve == id',
            forAll(
              mkArbP(arbA, arbB),
              laws.sieveTabulateIsIdentity,
            )(mkEqP(EcA, EqB)),
          ],
        ],
        {
          parent: self.strong(
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
        },
      ),
  };

  return self;
};
