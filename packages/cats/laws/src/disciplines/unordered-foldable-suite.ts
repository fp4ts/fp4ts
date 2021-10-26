import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, Monoid, UnorderedFoldable } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { UnorderedFoldableLaws } from '../unordered-foldable-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const UnorderedFoldableSuite = <F>(F: UnorderedFoldable<F>) => {
  const laws = UnorderedFoldableLaws(F);
  return {
    unorderedFoldable: <A>(
      arbA: Arbitrary<A>,
      EqA: Eq<A>,
      M: Monoid<A>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet('unordered foldable', [
        [
          'unorderedFoldable unorderedFold consistent with unorderedFoldMap',
          forAll(mkArbF(arbA), a =>
            laws.unorderedFoldConsistentWithUnorderedFoldMap(a, M),
          )(EqA),
        ],
        [
          'unorderedFoldable all consistent with any',
          forAll(
            mkArbF(arbA),
            fc.func<[A], boolean>(fc.boolean()),
            laws.allConsistentWithAny,
          ),
        ],
        ['unorderedFoldable any is lazy', forAll(mkArbF(arbA), laws.anyLazy)],
        ['unorderedFoldable all is lazy', forAll(mkArbF(arbA), laws.allLazy)],
        [
          'unorderedFoldable all empty',
          forAll(
            mkArbF(arbA),
            fc.func<[A], boolean>(fc.boolean()),
            laws.allEmpty,
          ),
        ],
        [
          'unorderedFoldable nonEmpty reference',
          forAll(mkArbF(arbA), laws.nonEmptyRef)(Eq.primitive),
        ],
      ]),
  };
};
