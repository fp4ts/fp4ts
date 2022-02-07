// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Align } from '@fp4ts/cats-core';
import { Ior } from '@fp4ts/cats-core/lib/data';

import { AlignLaws } from '../align-laws';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const AlignSuite = <F>(F: Align<F>) => {
  const laws = AlignLaws(F);

  return {
    align: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(EqX: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet('align', [
        [
          'align associativity',
          forAll(
            mkArbF(arbA),
            mkArbF(arbB),
            mkArbF(arbC),
            laws.alignAssociativity,
          )(mkEqF(Ior.Eq(Ior.Eq(EqA, EqB), EqC))),
        ],
        [
          'align homomorphism',
          forAll(
            mkArbF(arbA),
            mkArbF(arbB),
            fc.func<[A], C>(arbC),
            fc.func<[B], D>(arbD),
            laws.alignHomomorphism,
          )(mkEqF(Ior.Eq(EqC, EqD))),
        ],
        [
          'align consistent with alignWith',
          forAll(
            mkArbF(arbA),
            mkArbF(arbB),
            fc.func<[Ior<A, B>], C>(arbC),
            laws.alignWithConsistent,
          )(mkEqF(EqC)),
        ],
      ]),
  };
};
