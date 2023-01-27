// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Applicative, Functor, Traversable } from '@fp4ts/cats-core';
import { Tuple2K } from '@fp4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { TraversableLaws } from '../traversable-laws';
import { FoldableSuite } from './foldable-suite';
import { FunctorSuite } from './functor-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const TraversableSuite = <T>(T: Traversable<T>) => {
  const laws = TraversableLaws(T);
  const self = {
    ...FunctorSuite(T),
    ...FoldableSuite(T),

    traversable: <A, B, C, F, G>(
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
        'Traversable',
        [
          [
            'traverse identity',
            forAll(
              mkArbT(arbA),
              fc.func<[A], B>(arbB),
              laws.traversableIdentity,
            )(mkEqT(EqB)),
          ],
          [
            'traverse sequential composition',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[B], Kind<G, [C]>>(mkArbG(arbC)),
              laws.traversableSequentialComposition(F, G),
            )(mkEqF(mkEqG(mkEqT(EqC)))),
          ],
          [
            'traverse parallel composition',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[A], Kind<G, [B]>>(mkArbG(arbB)),
              laws.traversableParallelComposition(F, G),
            )(Tuple2K.Eq(mkEqF(mkEqT(EqB)), mkEqG(mkEqT(EqB)))),
          ],
        ],
        {
          parents: [
            self.functor(arbA, arbB, arbC, EqA, EqC, mkArbT, mkEqT),
            self.foldable(arbA, arbB, MA, MB, EqA, EqB, mkArbT),
          ],
        },
      ),
  };
  return self;
};
