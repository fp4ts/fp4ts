import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import {
  Applicative,
  Eq,
  Functor,
  Monoid,
  Traversable,
} from '@cats4ts/cats-core';
import { Nested, Tuple2K } from '@cats4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { TraversableLaws } from '../traversable-laws';
import { FoldableSuite } from './foldable-suite';
import { FunctorSuite } from './functor-suite';
import { UnorderedTraversableSuite } from './unordered-traversable-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const TraversableSuite = <T extends AnyK>(T: Traversable<T>) => {
  const laws = TraversableLaws(T);
  const self = {
    ...FunctorSuite(T),
    ...FoldableSuite(T),
    ...UnorderedTraversableSuite(T),

    traversable: <A, B, C, F extends AnyK, G extends AnyK>(
      arbTA: Arbitrary<Kind<T, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbGB: Arbitrary<Kind<G, [B]>>,
      arbGC: Arbitrary<Kind<G, [C]>>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      MA: Monoid<A>,
      MB: Monoid<B>,
      T: Functor<T>,
      F: Applicative<F>,
      G: Applicative<G>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqTA: Eq<Kind<T, [A]>>,
      EqTB: Eq<Kind<T, [B]>>,
      EqTC: Eq<Kind<T, [C]>>,
      EqFGTC: Eq<Kind<F, [Kind<G, [Kind<T, [C]>]>]>>,
      EqFTA: Eq<Kind<F, [Kind<T, [A]>]>>,
      EqGTA: Eq<Kind<G, [Kind<T, [A]>]>>,
    ): RuleSet =>
      new RuleSet(
        'traversable',
        [
          [
            'traversable identity',
            forAll(
              arbTA,
              fc.func<[A], B>(arbB),
              laws.unorderedTraversableIdentity(T),
            )(EqTB),
          ],
          [
            'traversable sequential coposition',
            forAll(
              arbTA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              fc.func<[B], Kind<G, [C]>>(arbGC),
              laws.traversableSequentialComposition(F, G),
            )(Nested.Eq(EqFGTC)),
          ],
          [
            'traversable parallel composition',
            forAll(
              arbTA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              fc.func<[A], Kind<G, [B]>>(arbGB),
              laws.traversableParallelComposition(F, G),
            )(Tuple2K.Eq(EqFTA, EqGTA)),
          ],
        ],
        {
          parents: [
            self.functor(arbTA, arbB, arbC, EqTA, EqTC),
            self.foldable(arbTA, arbB, MA, MB, EqA, EqB),
            self.unorderedTraversable(
              arbTA,
              arbFB,
              arbGB,
              arbGC,
              arbB,
              MA,
              T,
              F,
              G,
              EqA,
              EqTB,
              EqFGTC,
              EqFTA,
              EqGTA,
            ),
          ],
        },
      ),
  };
  return self;
};
