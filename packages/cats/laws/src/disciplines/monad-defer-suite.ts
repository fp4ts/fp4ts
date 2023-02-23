// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { MonadDefer } from '@fp4ts/cats-core';
import { exec, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { MonadSuite } from './monad-suite';
import { DeferSuite } from './defer-suite';
import { MonadDeferLaws } from '../monad-defer-laws';

export const MonadDeferSuite = <F>(F: MonadDefer<F>) => {
  const laws = MonadDeferLaws(F);
  const self = {
    ...MonadSuite(F),
    ...DeferSuite(F),

    monadDefer: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'MonadDefer',
        [
          [
            'monadDefer delay is pure',
            forAll(arbA, laws.monadDeferDelayIsPure)(mkEqF(EqA)),
          ],
          [
            'monadDefer delay does not evaluate',
            exec(laws.monadDeferDelayDoesNotEvaluate),
          ],
          [
            'monadDefer map is lazy',
            forAll(mkArbF(arbA), laws.monadDeferMapIsLazy),
          ],
          [
            'monadDefer flatMap is lazy',
            forAll(mkArbF(arbA), laws.monadDeferFlatMapIsLazy),
          ],
          [
            'monadDefer map stack safety',
            exec(laws.monadDeferMapStackSafety)(
              mkEqF(Eq.fromUniversalEquals()),
            ),
          ],
          [
            'monadDefer left bind stack safety',
            exec(laws.monadDeferLeftBindStackSafety)(
              mkEqF(Eq.fromUniversalEquals()),
            ),
          ],
          [
            'monadDefer right bind stack safety',
            exec(laws.monadDeferRightBindStackSafety)(
              mkEqF(Eq.fromUniversalEquals()),
            ),
          ],
        ],
        {
          parents: [
            self.monad(
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
            self.defer(arbA, EqA, mkArbF, mkEqF),
          ],
        },
      ),
  };
  return self;
};
