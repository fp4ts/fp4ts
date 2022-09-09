// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { MonoidLaws } from '../monoid-laws';
import { SemigroupSuite } from './semigroup-suite';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

export const MonoidSuite = <A>(M: Monoid<A>) => {
  const laws = MonoidLaws(M);
  const self = {
    ...SemigroupSuite(M),

    monoid: (arbA: Arbitrary<A>, EqA: Eq<A>) =>
      new RuleSet(
        'Monoid',
        [
          [
            'monoid right identity',
            forAll(arbA, laws.monoidRightIdentity)(EqA),
          ],
          ['monoid left identity', forAll(arbA, laws.monoidLeftIdentity)(EqA)],
        ],
        { parent: self.semigroup(arbA, EqA) },
      ),
  };

  return self;
};
