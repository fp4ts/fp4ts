// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Compose } from '@fp4ts/cats-arrow';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ComposeLaws } from '../compose-laws';

export const ComposeSuite = <P>(P: Compose<P>) => {
  const laws = ComposeLaws(P);

  const self = {
    compose: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EcA: ExhaustiveCheck<A>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbP: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqP: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
    ) =>
      new RuleSet('Compose', [
        [
          'compose associativity',
          forAll(
            mkArbP(arbA, arbB),
            mkArbP(arbB, arbC),
            mkArbP(arbC, arbD),
            laws.composeAssociativity,
          )(mkEqP(EcA, EqD)),
        ],
        [
          'compose compose(g, f) == andThen(f, g)',
          forAll(
            mkArbP(arbA, arbB),
            mkArbP(arbB, arbC),
            laws.composeIsAndThen,
          )(mkEqP(EcA, EqC)),
        ],
      ]),
  };

  return self;
};
