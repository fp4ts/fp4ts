// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { FoldableWithIndex } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { FoldableWithIndexLaws } from '../foldable-with-index-laws';
import { FoldableSuite } from './foldable-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FoldableWithIndexSuite = <F, I>(F: FoldableWithIndex<F, I>) => {
  const laws = FoldableWithIndexLaws(F);

  const self = {
    ...FoldableSuite(F),

    foldableWithIndex: <A, B>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      MA: Monoid<A>,
      MB: Monoid<B>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'FoldableWithIndex',
        [
          [
            'foldable foldLeft consistent with foldMap',
            forAll(
              mkArbF(arbA),
              fc.func<[A, I], B>(arbB),
              laws.indexedLeftFoldConsistentWithFoldMap(MB),
            )(EqB),
          ],
          [
            'foldable foldRight consistent with foldMap',
            forAll(
              mkArbF(arbA),
              fc.func<[A, I], B>(arbB),
              laws.indexedRightFoldConsistentWithFoldMap(MB),
            )(EqB),
          ],
        ],
        { parent: self.foldable(arbA, arbB, MA, MB, EqA, EqB, mkArbF) },
      ),
  };
  return self;
};
