import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import {
  Applicative,
  Eq,
  Functor,
  Monoid,
  UnorderedTraversable,
} from '@cats4ts/cats-core';
import { Nested, Tuple2K } from '@cats4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { UnorderedTraversableLaws } from '../unordered-traversable-laws';
import { UnorderedFoldableSuite } from './unordered-foldable-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const UnorderedTraversableSuite = <T extends AnyK>(
  T: UnorderedTraversable<T>,
) => {
  const laws = UnorderedTraversableLaws(T);
  const self = {
    ...UnorderedFoldableSuite(T),

    unorderedTraversable: <A, B, C, F extends AnyK, G extends AnyK>(
      arbTA: Arbitrary<Kind<T, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbGB: Arbitrary<Kind<G, [B]>>,
      arbGC: Arbitrary<Kind<G, [C]>>,
      arbB: Arbitrary<B>,
      M: Monoid<A>,
      T: Functor<T>,
      F: Applicative<F>,
      G: Applicative<G>,
      EqA: Eq<A>,
      EqTB: Eq<Kind<T, [B]>>,
      EqFGTC: Eq<Kind<F, [Kind<G, [Kind<T, [C]>]>]>>,
      EqFTA: Eq<Kind<F, [Kind<T, [A]>]>>,
      EqGTA: Eq<Kind<G, [Kind<T, [A]>]>>,
    ): RuleSet =>
      new RuleSet(
        'unordered traversable',
        [
          [
            'unorderedTraversable identity',
            forAll(
              arbTA,
              fc.func<[A], B>(arbB),
              laws.unorderedTraversableIdentity(T),
            )(EqTB),
          ],
          [
            'unorderedTraversable traversable sequential composition',
            forAll(
              arbTA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              fc.func<[B], Kind<G, [C]>>(arbGC),
              laws.unorderedTraversableSequentialComposition(F, G),
            )(Nested.Eq(EqFGTC)),
          ],
          [
            'unorderedTraversable traversable sequential composition',
            forAll(
              arbTA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              fc.func<[A], Kind<G, [B]>>(arbGB),
              laws.unorderedTraversableParallelComposition(F, G),
            )(Tuple2K.Eq(EqFTA, EqGTA)),
          ],
          [
            'unorderedTraversable unordered sequence consistent',
            forAll(
              arbTA.chain(ta =>
                arbFB.chain(fb => fc.constant(T.map_(ta, () => fb))),
              ),
              laws.unorderedSequenceConsistent(F),
            )(EqFTA),
          ],
        ],
        { parent: self.unorderedFoldable(arbTA, M, EqA) },
      ),
  };
  return self;
};
