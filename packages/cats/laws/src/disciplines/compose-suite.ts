// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Compose } from '@fp4ts/cats-core';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ComposeLaws } from '../compose-laws';

export const ComposeSuite = <F>(F: Compose<F>) => {
  const laws = ComposeLaws(F);

  return {
    compose: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EcA: ExhaustiveCheck<A>,
      EqD: Eq<D>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<F, [X, Y]>>,
      mkEqF: <X, Y>(EcX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<F, [X, Y]>>,
    ) =>
      new RuleSet('Compose', [
        [
          'compose associativity',
          forAll(
            mkArbF(arbA, arbB),
            mkArbF(arbB, arbC),
            mkArbF(arbC, arbD),
            laws.composeAssociativity,
          )(mkEqF(EcA, EqD)),
        ],
      ]),
  };
};
