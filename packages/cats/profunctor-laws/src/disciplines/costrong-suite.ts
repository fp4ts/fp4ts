// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Defer, Unzip } from '@fp4ts/cats-core';
import { Proxy } from '@fp4ts/cats-core/lib/data';
import { Eq } from '@fp4ts/cats-kernel';
import { Costrong } from '@fp4ts/cats-profunctor';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { CostrongLaws } from '../costrong-laws';
import { ProfunctorSuite } from './profunctor-suite';

export const CostrongSuite = <P>(P: Costrong<P>) => {
  const laws = CostrongLaws(P);

  const self = {
    ...ProfunctorSuite(P),

    costrong: <F, A, B, C, D, B1, B2>(
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
      F: Defer<F> & Unzip<F>,
      mkArbF: <X>(X: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    ) =>
      new RuleSet(
        'Costrong',
        [
          [
            'costrong unfirst is swapped unsecond',
            forAll(
              mkArbP(
                fc.tuple(arbA, mkArbF(arbC)),
                fc.tuple(arbB, mkArbF(arbC)),
              ),
              laws.unfirstIsSwappedUnsecond(F),
            )(mkEqP(EcA, EqB)),
          ],
          [
            'costrong unsecond is swapped unfirst',
            forAll(
              mkArbP(
                fc.tuple(mkArbF(arbC), arbA),
                fc.tuple(mkArbF(arbC), arbB),
              ),
              laws.unsecondIsSwappedUnfirst(F),
            )(mkEqP(EcA, EqB)),
          ],
          [
            'costrong lmap is rmap andThen unfirst',
            forAll(
              mkArbP(fc.tuple(arbA, fc.constant(Proxy<void>())), arbB),
              laws.lmapIsRmapAndThenUnfirst,
            )(mkEqP(EcA, EqB)),
          ],
          [
            'costrong lmap is rmap andThen unsecond',
            forAll(
              mkArbP(fc.tuple(fc.constant(Proxy<void>()), arbA), arbB),
              laws.lmapIsRmapAndThenUnsecond,
            )(mkEqP(EcA, EqB)),
          ],
          [
            'costrong dinaturality unfirst',
            forAll(
              mkArbP(
                fc.tuple(arbA, mkArbF(arbC)),
                fc.tuple(arbB, mkArbF(arbD)),
              ),
              fc.func(arbC),
              laws.dinaturalityUnfirst(F),
            )(mkEqP(EcA, EqB)),
          ],
          [
            'costrong dinaturality unsecond',
            forAll(
              mkArbP(
                fc.tuple(mkArbF(arbC), arbA),
                fc.tuple(mkArbF(arbD), arbB),
              ),
              fc.func(arbC),
              laws.dinaturalityUnsecond(F),
            )(mkEqP(EcA, EqB)),
          ],
          [
            'costrong unfirst . unfirst == dimap',
            forAll(
              mkArbP(
                fc.tuple(fc.tuple(arbA, mkArbF(arbC)), mkArbF(arbD)),
                fc.tuple(fc.tuple(arbB, mkArbF(arbC)), mkArbF(arbD)),
              ),
              laws.unfirstUnfirstIsDimap(F),
            )(mkEqP(EcA, EqB)),
          ],
          [
            'costrong unsecond . unsecond == dimap',
            forAll(
              mkArbP(
                fc.tuple(mkArbF(arbD), fc.tuple(mkArbF(arbC), arbA)),
                fc.tuple(mkArbF(arbD), fc.tuple(mkArbF(arbC), arbB)),
              ),
              laws.unsecondUnsecondIsDimap(F),
            )(mkEqP(EcA, EqB)),
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
