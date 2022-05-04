// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Applicative, Functor, TraversableWithIndex } from '@fp4ts/cats-core';
import { Nested, Tuple2K } from '@fp4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { TraversableWithIndexLaws } from '../traversable-with-index-laws';
import { FunctorWithIndexSuite } from './functor-with-index-suite';
import { FoldableWithIndexSuite } from './foldable-with-index-suite';
import { TraversableSuite } from './traversable-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const TraversableWithIndexSuite = <T, I>(
  T: TraversableWithIndex<T, I>,
) => {
  const laws = TraversableWithIndexLaws(T);
  const self = {
    ...FunctorWithIndexSuite(T),
    ...FoldableWithIndexSuite(T),
    ...TraversableSuite(T),

    traversableWithIndex: <A, B, C, F, G>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      MA: Monoid<A>,
      MB: Monoid<B>,
      T: Functor<T>,
      F: Applicative<F>,
      G: Applicative<G>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      mkArbT: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<T, [X]>>,
      mkEqT: <X>(E: Eq<X>) => Eq<Kind<T, [X]>>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
      mkArbG: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<G, [X]>>,
      mkEqG: <X>(E: Eq<X>) => Eq<Kind<G, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'TraversableWithIndex',
        [
          [
            'traversable identity',
            forAll(
              mkArbT(arbA),
              fc.func<[A, I], B>(arbB),
              laws.indexedTraversableIdentity,
            )(mkEqT(EqB)),
          ],
          [
            'traversable sequential coposition',
            forAll(
              mkArbT(arbA),
              fc.func<[A, I], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[B, I], Kind<G, [C]>>(mkArbG(arbC)),
              laws.indexedTraversableSequentialComposition(F, G),
            )(Nested.Eq(mkEqF(mkEqG(mkEqT(EqC))))),
          ],
          [
            'traversable parallel composition',
            forAll(
              mkArbT(arbA),
              fc.func<[A, I], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[A, I], Kind<G, [B]>>(mkArbG(arbB)),
              laws.indexedTraversableParallelComposition(F, G),
            )(Tuple2K.Eq(mkEqF(mkEqT(EqB)), mkEqG(mkEqT(EqB)))),
          ],
        ],
        {
          parents: [
            self.functorWithIndex(arbA, arbB, arbC, EqA, EqC, mkArbT, mkEqT),
            self.foldableWithIndex(arbA, arbB, MA, MB, EqA, EqB, mkArbT),
            self.traversable(
              arbA,
              arbB,
              arbC,
              MA,
              MB,
              T,
              F,
              G,
              EqA,
              EqB,
              EqC,
              mkArbT,
              mkEqT,
              mkArbF,
              mkEqF,
              mkArbG,
              mkEqG,
            ),
          ],
        },
      ),
  };
  return self;
};
