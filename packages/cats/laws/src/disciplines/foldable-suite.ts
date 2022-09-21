// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Foldable } from '@fp4ts/cats-core';
import { Option, List, Vector } from '@fp4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { FoldableLaws } from '../foldable-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FoldableSuite = <F>(F: Foldable<F>) => {
  const laws = FoldableLaws(F);

  const self = {
    foldable: <A, B>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      MA: Monoid<A>,
      MB: Monoid<B>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet('foldable', [
        [
          'foldable foldRight is lazy',
          forAll(mkArbF(arbA), laws.foldRightLazy),
        ],
        [
          'foldable foldLeft consistent with foldMap',
          forAll(
            mkArbF(arbA),
            fc.func<[A], B>(arbB),
            laws.leftFoldConsistentWithFoldMap(MB),
          )(EqB),
        ],
        [
          'foldable foldRight consistent with foldMap',
          forAll(
            mkArbF(arbA),
            fc.func<[A], B>(arbB),
            laws.rightFoldConsistentWithFoldMap(MB),
          )(EqB),
        ],
        [
          'foldable foldM identity',
          forAll(
            mkArbF(arbA),
            arbB,
            fc.func<[B, A], B>(arbB),
            laws.foldMIdentity,
          )(EqB),
        ],
        [
          'foldable all consistent with any',
          forAll(
            mkArbF(arbA),
            fc.func<[A], boolean>(fc.boolean()),
            laws.allConsistentWithAny,
          ),
        ],
        ['foldable any is lazy', forAll(mkArbF(arbA), laws.anyLazy)],
        ['foldable all is lazy', forAll(mkArbF(arbA), laws.allLazy)],
        [
          'foldable all empty',
          forAll(
            mkArbF(arbA),
            fc.func<[A], boolean>(fc.boolean()),
            laws.allEmpty,
          ),
        ],
        [
          'foldable nonEmpty reference',
          forAll(mkArbF(arbA), laws.nonEmptyRef)(Eq.fromUniversalEquals()),
        ],
        [
          'foldable elem reference',
          forAll(
            mkArbF(arbA),
            fc.integer({ min: -2, max: 20 }),
            laws.elemRef,
          )(Option.Eq(EqA)),
        ],
        [
          'foldable toList reference',
          forAll(mkArbF(arbA), laws.toListRef)(List.Eq(EqA)),
        ],
        [
          'foldable toVector reference',
          forAll(mkArbF(arbA), laws.toVectorRef)(Vector.Eq(EqA)),
        ],
        [
          'foldable list from iterator is toList',
          forAll(mkArbF(arbA), laws.listFromIteratorIsToList)(List.Eq(EqA)),
        ],
      ]),
  };
  return self;
};
