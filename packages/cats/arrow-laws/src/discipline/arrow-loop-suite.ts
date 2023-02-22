// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Defer, Unzip } from '@fp4ts/cats-core';
import { ArrowLoop } from '@fp4ts/cats-arrow';
import { CostrongSuite } from '@fp4ts/cats-profunctor-laws';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ArrowLoopLaws } from '../arrow-loop-laws';
import { ArrowSuite } from './arrow-suite';

export const ArrowLoopSuite = <P>(P: ArrowLoop<P>) => {
  const laws = ArrowLoopLaws(P);

  const self = {
    ...ArrowSuite(P),
    ...CostrongSuite(P),

    arrowLoop: <F, A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EcA: ExhaustiveCheck<A>,
      EqA: Eq<A>,
      EcB: ExhaustiveCheck<B>,
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
      F: Defer<F> & Unzip<F>,
      mkArbF: <X>(X: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    ) =>
      new RuleSet(
        'ArrowLoop',
        [
          [
            'arrowLoop extension',
            forAll(
              fc.func<[[A, Kind<F, [C]>]], [B, Kind<F, [C]>]>(
                fc.tuple(arbB, mkArbF(arbC)),
              ),
              laws.arrowLoopExtension(F),
            )(mkEqP(EcA, EqB)),
          ],
          [
            'arrowLoop left tightening',
            forAll(
              mkArbP(arbA, arbB),
              mkArbP(
                fc.tuple(arbB, mkArbF(arbC)),
                fc.tuple(arbD, mkArbF(arbC)),
              ),
              laws.arrowLoopLeftTightening(F),
            )(mkEqP(EcA, EqD)),
          ],
          [
            'arrowLoop right tightening',
            forAll(
              mkArbP(
                fc.tuple(arbA, mkArbF(arbC)),
                fc.tuple(arbB, mkArbF(arbC)),
              ),
              mkArbP(arbB, arbD),
              laws.arrowLoopRightTightening(F),
            )(mkEqP(EcA, EqD)),
          ],
          // [
          //   'arrowLoop sliding',
          //   forAll(
          //     mkArbP(
          //       fc.tuple(arbA, mkArbF(arbC)),
          //       fc.tuple(arbB, mkArbF(arbC)),
          //     ),
          //     fc.func<[Kind<F, [C]>], Kind<F, [C]>>(mkArbF(arbC)),
          //     laws.arrowLoopSliding(F),
          //   )(mkEqP(EcA, EqB)),
          // ],
          [
            'arrowLoop vanishing',
            forAll(
              mkArbP(
                fc.tuple(fc.tuple(arbA, mkArbF(arbC)), mkArbF(arbD)),
                fc.tuple(fc.tuple(arbB, mkArbF(arbC)), mkArbF(arbD)),
              ),
              fc.func<[Kind<F, [C]>], Kind<F, [C]>>(mkArbF(arbC)),
              laws.arrowLoopVanishing(F),
            )(mkEqP(EcA, EqB)),
          ],
        ],
        {
          parents: [
            self.arrow(
              arbA,
              arbB,
              arbC,
              arbD,
              arbB1,
              arbB2,
              EcA,
              EqA,
              EqB,
              EcC,
              EqC,
              EcD,
              EqD,
              EqB2,
              mkArbP,
              mkEqP,
            ),
            self.costrong(
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
              F,
              mkArbF,
            ),
          ],
        },
      ),
  };

  return self;
};
