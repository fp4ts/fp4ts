// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { ArrowApply, ArrowMonad } from '@fp4ts/cats-core';
import { List } from '@fp4ts/cats-core/lib/data';
import { exec, ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

import { ArrowApplyLaws } from '../arrow-apply-laws';
import { ArrowSuite } from './arrow-suite';
import { MonadSuite } from './monad-suite';

export function ArrowApplySuite<F>(F: ArrowApply<F>) {
  const laws = ArrowApplyLaws(F);

  const self = {
    ...ArrowSuite(F),

    arrowApply: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EqA: Eq<A>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
      EcB: ExhaustiveCheck<B>,
      EqC: Eq<C>,
      EcC: ExhaustiveCheck<C>,
      EqD: Eq<D>,
      EcD: ExhaustiveCheck<D>,
      EqB2: Eq<B2>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<F, [X, Y]>>,
      mkEqF: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<F, [X, Y]>>,
      mkEcF: <X, Y>(
        EcX: ExhaustiveCheck<X>,
        ECY: ExhaustiveCheck<Y>,
      ) => ExhaustiveCheck<Kind<F, [X, Y]>>,
    ) =>
      new RuleSet(
        'ArrowApply',
        [
          [
            'first (arr (\\x -> arr (\\y -> (x,y)))) >>> app = id',
            exec(laws.firstLiftAppIdentity<A, B>())(
              mkEqF(EcA.product(EcB), Eq.tuple(EqA, EqB)),
            ),
          ],
          [
            'first (arr (g >>>)) >>> app = second g >>> app',
            forAll(
              mkArbF(arbA, arbB),
              laws.leftComposeAppEquivalence<C>(),
            )(mkEqF(mkEcF(EcB, EcC).product(EcA), EqC)),
          ],
          [
            'first (arr (>>> h)) >>> app = app >>> h',
            forAll(
              mkArbF(arbA, arbB),
              laws.rightComposeAppEquivalence<C>(),
            )(mkEqF(mkEcF(EcC, EcA).product(EcC), EqB)),
          ],
          [
            'arrowApply proc-do is composition',
            forAll(
              mkArbF(arbA, arbB),
              mkArbF(arbB, arbC),
              laws.arrowApplyDoIsComposition,
            )(mkEqF(EcA, EqC)),
          ],
          [
            'arrowApply proc-do is first and lift composition',
            forAll(
              mkArbF(arbA, arbB),
              mkArbF(arbA, arbC),
              fc.func<[B, C], D>(arbD),
              laws.arrowApplyDoIsFirstLiftComposition,
            )(mkEqF(EcA, EqD)),
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
              EqA,
              EcA,
              EqB,
              EqC,
              EcC,
              EqD,
              EcD,
              EqB2,
              mkArbF,
              mkEqF,
            ),
            self.arrowMonad(
              arbA,
              arbB,
              arbC,
              arbD,
              EqA,
              EqB,
              EqC,
              EqD,
              <X>(arbX: Arbitrary<X>): Arbitrary<ArrowMonad<F, X>> =>
                mkArbF(fc.constant(undefined as void), arbX),
              <X>(E: Eq<X>): Eq<ArrowMonad<F, X>> =>
                mkEqF(ec.instance(List(undefined as void)), E),
            ),
          ],
        },
      ),

    arrowMonad: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<ArrowMonad<F, X>>,
      mkEqF: <X>(E: Eq<X>) => Eq<ArrowMonad<F, X>>,
    ): RuleSet =>
      new RuleSet('ArrowMonad', [], {
        parent: MonadSuite(F.Monad).stackUnsafeMonad(
          arbA,
          arbB,
          arbC,
          arbD,
          EqA,
          EqB,
          EqC,
          EqD,
          mkArbF,
          mkEqF,
        ),
      }),
  };

  return self;
}
