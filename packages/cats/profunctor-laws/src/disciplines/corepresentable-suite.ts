// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Corepresentable } from '@fp4ts/cats-profunctor';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

import { CorepresentableLaws } from '../corepresentable-laws';
import { CostrongSuite } from './costrong-suite';
import { Defer, Unzip } from '@fp4ts/cats-core';

export const CorepresentableSuite = <P, F>(P: Corepresentable<P, F>) => {
  const laws = CorepresentableLaws(P);

  const self = {
    ...CostrongSuite(P),

    corepresentable: <G, A, B, C, D, B1, B2>(
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
      mkArbP: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqP: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
      mkEcF: <X>(arbX: ExhaustiveCheck<X>) => ExhaustiveCheck<Kind<F, [X]>>,
      G: Defer<G> & Unzip<G>,
      mkArbG: <X>(X: Arbitrary<X>) => Arbitrary<Kind<G, [X]>>,
    ) =>
      new RuleSet(
        'Corepresentable',
        [
          [
            'corepresentable  cosieve . cotabulate == id',
            forAll(
              fc.func<[Kind<F, [A]>], B>(arbB),
              laws.cotabulateCosieveIsIdentity,
            )(eq.fn1Eq(mkEcF(EcA), EqB)),
          ],
          [
            'corepresentable  cotabulate . cosieve == id',
            forAll(
              mkArbP(arbA, arbB),
              laws.cosieveCotabulateIsIdentity,
            )(mkEqP(EcA, EqB)),
          ],
        ],
        {
          parent: self.costrong(
            arbA,
            arbB,
            arbC,
            arbD,
            arbB1,
            arbB2,
            EcA,
            EqB,
            EcD,
            EqB2,
            mkArbP,
            mkEqP,
            G,
            mkArbG,
          ),
        },
      ),
  };

  return self;
};
