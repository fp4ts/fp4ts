// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { ApplicativeDefer } from '@fp4ts/cats-core';
import { exec, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { DeferSuite } from './defer-suite';
import { ApplicativeDeferLaws } from '../applicative-defer-laws';
import { ApplicativeSuite } from './applicative-suite';

export const ApplicativeDeferSuite = <F>(F: ApplicativeDefer<F>) => {
  const laws = ApplicativeDeferLaws(F);
  const self = {
    ...ApplicativeSuite(F),
    ...DeferSuite(F),

    applicativeDefer: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'applicativeDefer',
        [
          [
            'applicativeDefer delay is pure',
            forAll(arbA, laws.applicativeDeferDelayIsPure)(mkEqF(EqA)),
          ],
          [
            'applicativeDefer delay does not evaluate',
            exec(laws.applicativeDeferDelayDoesNotEvaluate),
          ],
          [
            'applicativeDefer map is lazy',
            forAll(mkArbF(arbA), laws.applicativeDeferMapIsLazy),
          ],
          [
            'applicativeDefer map stack safety',
            exec(laws.applicativeDeferMapStackSafety)(
              mkEqF(Eq.fromUniversalEquals()),
            ),
          ],
        ],
        {
          parents: [
            self.applicative(arbA, arbB, arbC, EqA, EqB, EqC, mkArbF, mkEqF),
            self.defer(arbA, EqA, mkArbF, mkEqF),
          ],
        },
      ),
  };
  return self;
};
