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
import { MonadDeferLaws } from '../monad-defer-laws';
import { ApplicativeDeferSuite } from './applicative-defer-suite';

export const MonadDeferSuite = <F>(F: MonadDefer<F>) => {
  const laws = MonadDeferLaws(F);
  const self = {
    ...MonadSuite(F),
    ...ApplicativeDeferSuite(F),

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
            'monadDefer flatMap is lazy',
            forAll(mkArbF(arbA), laws.monadDeferFlatMapIsLazy),
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
            self.applicativeDefer(
              arbA,
              arbB,
              arbC,
              EqA,
              EqB,
              EqC,
              mkArbF,
              mkEqF,
            ),
          ],
        },
      ),
  };
  return self;
};
