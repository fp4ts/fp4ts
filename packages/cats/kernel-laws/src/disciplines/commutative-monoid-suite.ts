// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { CommutativeMonoid, Eq } from '@fp4ts/cats-kernel';
import { RuleSet } from '@fp4ts/cats-test-kit';
import { MonoidSuite } from './monoid-suite';
import { CommutativeSemigroupSuite } from './commutative-semigroup-suite';

export const CommutativeMonoidSuite = <A>(M: CommutativeMonoid<A>) => {
  const self = {
    ...MonoidSuite(M),
    ...CommutativeSemigroupSuite(M),

    commutativeMonoid: (arbA: Arbitrary<A>, EqA: Eq<A>): RuleSet =>
      new RuleSet('CommutativeMonoid', [], {
        parents: [self.commutativeSemigroup(arbA, EqA), self.monoid(arbA, EqA)],
      }),
  };

  return self;
};
