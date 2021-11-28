// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Temporal, Outcome } from '@fp4ts/effect-kernel';
import { RuleSet } from '@fp4ts/cats-test-kit';

import { ClockSuite } from './clock-suite';
import { SpawnSuite } from './spawn-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const TemporalSuite = <F, E>(F: Temporal<F, E>) => {
  const self = {
    ...ClockSuite(F),
    ...SpawnSuite(F),

    temporal: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbE: Arbitrary<E>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      EqE: Eq<E>,
      EqOutcome: Eq<Outcome<F, E, A>>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet('temporal', [], {
        parents: [
          self.clock(mkEqF),
          self.spawn(
            arbA,
            arbB,
            arbC,
            arbD,
            arbE,
            EqA,
            EqB,
            EqC,
            EqD,
            EqE,
            EqOutcome,
            mkArbF,
            mkEqF,
          ),
        ],
      }),
  };
  return self;
};
