import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq, Monoid } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { UnorderedFoldableLaws } from '../unordered-foldable-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const UnorderedFoldableSuite = <F extends AnyK>(
  laws: UnorderedFoldableLaws<F>,
) => ({
  unorderedFoldable: <A>(
    arbFA: Arbitrary<Kind<F, [A]>>,
    M: Monoid<A>,
    EqA: Eq<A>,
  ): RuleSet =>
    new RuleSet('unordered foldable', [
      [
        'unorderedFoldable unorderedFold consistent with unorderedFoldMap',
        forAll(arbFA, a =>
          laws.unorderedFoldConsistentWithUnorderedFoldMap(a, M),
        )(EqA),
      ],
      [
        'unorderedFoldable all consistent with any',
        forAll(
          arbFA,
          fc.func<[A], boolean>(fc.boolean()),
          laws.allConsistentWithAny,
        ),
      ],
      ['unorderedFoldable any is lazy', forAll(arbFA, laws.anyLazy)],
      ['unorderedFoldable all is lazy', forAll(arbFA, laws.allLazy)],
      [
        'unorderedFoldable all empty',
        forAll(arbFA, fc.func<[A], boolean>(fc.boolean()), laws.allEmpty),
      ],
      [
        'unorderedFoldable nonEmpty reference',
        forAll(arbFA, laws.nonEmptyRef)(Eq.primitive),
      ],
    ]),
});
