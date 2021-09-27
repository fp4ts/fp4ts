import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq, Foldable, Monoid } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { FoldableLaws } from '../foldable-laws';
import { UnorderedFoldableSuite } from './unordered-foldable-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FoldableSuite = <F extends AnyK>(F: Foldable<F>) => {
  const laws = FoldableLaws(F);

  const self = {
    ...UnorderedFoldableSuite(F),

    foldable: <A, B>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbB: Arbitrary<B>,
      MA: Monoid<A>,
      MB: Monoid<B>,
      EqA: Eq<A>,
      EqB: Eq<B>,
    ): RuleSet =>
      new RuleSet(
        'foldable',
        [
          ['foldable foldRight is lazy', forAll(arbFA, laws.foldRightLazy)],
          [
            'foldable foldLeft consistent with foldMap',
            forAll(
              arbFA,
              fc.func<[A], B>(arbB),
              laws.leftFoldConsistentWithFoldMap(MB),
            )(EqB),
          ],
          [
            'foldable foldRight consistent with foldMap',
            forAll(
              arbFA,
              fc.func<[A], B>(arbB),
              laws.rightFoldConsistentWithFoldMap(MB),
            )(EqB),
          ],
        ],
        { parent: self.unorderedFoldable(arbFA, MA, EqA) },
      ),
  };
  return self;
};
