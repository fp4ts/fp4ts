// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, MonoidK } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { MonoidKLaws } from '../monoid-k-laws';
import { SemigroupKSuite } from './semigroup-k-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonoidKSuite = <F>(F: MonoidK<F>) => {
  const laws = MonoidKLaws(F);
  const self = {
    ...SemigroupKSuite(F),

    monoidK: <A>(
      arbA: Arbitrary<A>,
      EqA: Eq<A>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'monoidK',
        [
          [
            'monoidK left identity',
            forAll(mkArbF(arbA), laws.monoidKLeftIdentity)(mkEqF(EqA)),
          ],
          [
            'monoidK right identity',
            forAll(mkArbF(arbA), laws.monoidKRightIdentity)(mkEqF(EqA)),
          ],
        ],
        { parent: self.semigroupK(arbA, EqA, mkArbF, mkEqF) },
      ),
  };
  return self;
};
