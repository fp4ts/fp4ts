// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { StrongSuite } from '@fp4ts/cats-laws';
import { Affine } from '@fp4ts/optics-kernel';
import { ExhaustiveCheck, RuleSet } from '@fp4ts/cats-test-kit';
import { ChoiceSuite } from './choice-suite';

export function AffineSuite<P>(P: Affine<P>) {
  const self = {
    ...ChoiceSuite(P),
    ...StrongSuite(P),

    affine: <A, B, C, D, B1, B2>(
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
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqF: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
    ) =>
      new RuleSet('Affine', [], {
        parents: [
          self.choice(
            arbA,
            arbB,
            arbC,
            arbB1,
            arbB2,
            EcA,
            EqB,
            EqC,
            EcC,
            EcD,
            EqB2,
            mkArbF,
            mkEqF,
          ),
          self.strong(
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
            mkArbF,
            mkEqF,
          ),
        ],
      }),
  };

  return self;
}
