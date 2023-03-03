// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Eq, Option } from '@fp4ts/cats';
import { Prism } from '@fp4ts/optics-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { PrismLaws } from '../prism-laws';
import { TraversalSuite } from './traversal-suite';

export const PrismSuite = <S, A>(prism: Prism<S, A>) => {
  const laws = PrismLaws(prism);

  const self = {
    ...TraversalSuite(prism),

    prism: (arbS: Arbitrary<S>, arbA: Arbitrary<A>, EqS: Eq<S>, EqA: Eq<A>) =>
      new RuleSet(
        'Prism',
        [
          [
            'preview review is some',
            forAll(arbA, laws.previewReviewIsSome)(Option.Eq(EqA)),
          ],
          [
            'review preview is identity',
            forAll(arbS, laws.reviewPreviewIsIdentity)(EqS),
          ],
        ],
        { parent: self.traversal(arbS, arbA, EqS, EqA) },
      ),
  };

  return self;
};
