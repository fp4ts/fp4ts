// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats';
import { Lens } from '@fp4ts/optics-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { LensLaws } from '../lens-laws';
import { TraversalSuite } from './traversal-suite';

export const LensSuite = <S, A>(lens: Lens<S, A>) => {
  const laws = LensLaws(lens);

  const self = {
    ...TraversalSuite(lens),

    lens: (arbS: Arbitrary<S>, arbA: Arbitrary<A>, EqS: Eq<S>, EqA: Eq<A>) =>
      new RuleSet(
        'Lens',
        [
          ['get andThen replace identity', forAll(arbS, laws.getReplace)(EqS)],
          [
            'replace andThen get identity',
            forAll(arbS, arbA, laws.replaceGet)(EqA),
          ],
        ],
        { parent: self.traversal(arbS, arbA, EqS, EqA) },
      ),
  };

  return self;
};
