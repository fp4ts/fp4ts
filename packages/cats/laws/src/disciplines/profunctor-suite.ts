// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Profunctor } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ProfunctorLaws } from '../profunctor-laws';

export const ProfunctorSuite = <F>(F: Profunctor<F>) => {
  const laws = ProfunctorLaws(F);

  return {
    profunctor: <A, B, A1, A2, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbA1: Arbitrary<A1>,
      arbA2: Arbitrary<A2>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqA2: Eq<A2>,
      EqB2: Eq<B2>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<F, [X, Y]>>,
      mkEqF: <X, Y>(EqX: Eq<X>, EqY: Eq<Y>) => Eq<Kind<F, [X, Y]>>,
    ) =>
      new RuleSet('Profunctor', [
        [
          'profunctor identity',
          forAll(mkArbF(arbA, arbB), laws.profunctorIdentity)(mkEqF(EqA, EqB)),
        ],
        [
          'profunctor composition',
          forAll(
            mkArbF(arbA, arbB),
            fc.func<[A2], A1>(arbA1),
            fc.func<[A1], A>(arbA),
            fc.func<[B], B1>(arbB1),
            fc.func<[B1], B2>(arbB2),
            laws.profunctorComposition,
          )(mkEqF(EqA2, EqB2)),
        ],
        [
          'profunctor Lmap identity',
          forAll(
            mkArbF(arbA, arbB),
            laws.profunctorLmapIdentity,
          )(mkEqF(EqA, EqB)),
        ],
        [
          'profunctor Lmap composition',
          forAll(
            mkArbF(arbA, arbB),
            fc.func<[A2], A1>(arbA1),
            fc.func<[A1], A>(arbA),
            fc.func<[B], B1>(arbB1),
            fc.func<[B1], B2>(arbB2),
            laws.profunctorLmapComposition,
          )(mkEqF(EqA2, EqB)),
        ],
        [
          'profunctor Rmap identity',
          forAll(
            mkArbF(arbA, arbB),
            laws.profunctorRmapIdentity,
          )(mkEqF(EqA, EqB)),
        ],
        [
          'profunctor Rmap composition',
          forAll(
            mkArbF(arbA, arbB),
            fc.func<[B], B1>(arbB1),
            fc.func<[B1], B2>(arbB2),
            laws.profunctorRmapComposition,
          )(mkEqF(EqA, EqB2)),
        ],
      ]),
  };
};
