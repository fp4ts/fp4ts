// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Bifunctor, Eq } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { BifunctorLaws } from '../bifunctor-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const BifunctorSuite = <F>(F: Bifunctor<F>) => {
  const laws = BifunctorLaws(F);

  return {
    bifunctor: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<F, [X, Y]>>,
      mkEqF: <X, Y>(EqX: Eq<X>, EqY: Eq<Y>) => Eq<Kind<F, [X, Y]>>,
    ): RuleSet =>
      new RuleSet('bifunctor', [
        [
          'bifunctor identity',
          forAll(mkArbF(arbA, arbB), laws.bifunctorIdentity)(mkEqF(EqA, EqB)),
        ],
        [
          'bifunctor composition',
          forAll(
            mkArbF(arbA, arbB),
            fc.func<[A], B>(arbB),
            fc.func<[B], C>(arbC),
            fc.func<[B], C>(arbC),
            fc.func<[C], D>(arbD),
            laws.bifunctorComposition,
          )(mkEqF(EqC, EqD)),
        ],
        [
          'bifunctor left map identity',
          forAll(
            mkArbF(arbA, arbB),
            laws.bifunctorLeftMapIdentity,
          )(mkEqF(EqA, EqB)),
        ],
        [
          'bifunctor left map composition',
          forAll(
            mkArbF(arbA, arbB),
            fc.func<[A], C>(arbC),
            fc.func<[C], D>(arbD),
            laws.bifunctorLeftMapComposition,
          )(mkEqF(EqC, EqB)),
        ],
        [
          'bifunctor map identity',
          forAll(
            mkArbF(arbA, arbB),
            laws.bifunctorLeftMapIdentity,
          )(mkEqF(EqA, EqB)),
        ],
        [
          'bifunctor map composition',
          forAll(
            mkArbF(arbA, arbB),
            fc.func<[B], C>(arbC),
            fc.func<[C], D>(arbD),
            laws.bifunctorMapComposition,
          )(mkEqF(EqA, EqD)),
        ],
      ]),
  };
};
