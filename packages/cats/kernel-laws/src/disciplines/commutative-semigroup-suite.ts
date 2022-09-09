// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { CommutativeSemigroup, Eq } from '@fp4ts/cats-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { CommutativeSemigroupLaws } from '../commutative-semigroup-laws';
import { SemigroupSuite } from './semigroup-suite';

export const CommutativeSemigroupSuite = <A>(S: CommutativeSemigroup<A>) => {
  const laws = CommutativeSemigroupLaws(S);

  const self = {
    ...SemigroupSuite(S),

    commutativeSemigroup: (arbA: Arbitrary<A>, EqA: Eq<A>): RuleSet =>
      new RuleSet(
        'CommutativeSemigroup',
        [
          [
            'commutative semigroup commutative',
            forAll(arbA, arbA, laws.commutative)(EqA),
          ],
          [
            'semigroup associativity',
            forAll(arbA, arbA, arbA, laws.semigroupAssociativity)(EqA),
          ],
          [
            'semigroup dual dual is identity',
            forAll(arbA, arbA, laws.semigroupDualDualIsIdentity)(EqA),
          ],
        ],
        { parent: self.semigroup(arbA, EqA) },
      ),
  };

  return self;
};
