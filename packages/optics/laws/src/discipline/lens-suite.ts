// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats';
import { Lens } from '@fp4ts/optics-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { LensLaws } from '../lens-laws';
// import { OptionalSuite } from './optional-suite';

export const LensSuite = <S, A>(lens: Lens<S, A>) => {
  const laws = LensLaws(lens);

  const self = {
    // ...OptionalSuite(lens),

    lens: (arbS: Arbitrary<S>, arbA: Arbitrary<A>, EqS: Eq<S>, EqA: Eq<A>) =>
      new RuleSet(
        'Lens',
        [
          ['lens get replace', forAll(arbS, laws.getReplace)(EqS)],
          ['lens replace get', forAll(arbS, arbA, laws.replaceGet)(EqA)],
          [
            'lens consistent modify modify id',
            forAll(arbS, arbA, laws.consistentModifyModifyId)(EqS),
          ],
          [
            'lens consistent get modify id',
            forAll(arbS, arbA, laws.consistentGetModifyId)(EqA),
          ],
        ],
        // { parent: self.optional(arbS, arbA, EqS, EqA) },
      ),
  };

  return self;
};
