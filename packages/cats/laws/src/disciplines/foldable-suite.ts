import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@cats4ts/core';
import { Eq, Foldable, Monoid } from '@cats4ts/cats-core';
import { Option, List, Vector } from '@cats4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { FoldableLaws } from '../foldable-laws';
import { UnorderedFoldableSuite } from './unordered-foldable-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FoldableSuite = <F>(F: Foldable<F>) => {
  const laws = FoldableLaws(F);

  const self = {
    ...UnorderedFoldableSuite(F),

    foldable: <A, B>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      MA: Monoid<A>,
      MB: Monoid<B>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'foldable',
        [
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
            'foldable elem reference',
            forAll(
              mkArbF(arbA),
              fc.integer(-2, 20),
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
        ],
        { parent: self.unorderedFoldable(arbA, EqA, MA, mkArbF) },
      ),
  };
  return self;
};
