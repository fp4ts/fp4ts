// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Eq, Semigroup } from '@fp4ts/cats-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { SemigroupLaws } from '../semigroup-laws';

export const SemigroupSuite = <A>(S: Semigroup<A>) => {
  const laws = SemigroupLaws(S);

  return {
    semigroup: (arbA: Arbitrary<A>, EqA: Eq<A>): RuleSet =>
      new RuleSet('Semigroup', [
        [
          'semigroup associativity',
          forAll(arbA, arbA, arbA, laws.semigroupAssociativity)(EqA),
        ],
        [
          'semigroup dual reverses',
          forAll(arbA, arbA, laws.semigroupDualReverses)(EqA),
        ],
        [
          'semigroup dual dual is identity',
          forAll(arbA, arbA, laws.semigroupDualDualIsIdentity)(EqA),
        ],
      ]),
  };
};
