// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { CommutativeMonoid, Eq } from '@fp4ts/cats-kernel';
import { Applicative, Functor, UnorderedTraversable } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { UnorderedTraversableLaws } from '../unordered-traversable-laws';
import { UnorderedFoldableSuite } from './unordered-foldable-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const UnorderedTraversableSuite = <T>(T: UnorderedTraversable<T>) => {
  const laws = UnorderedTraversableLaws(T);
  const self = {
    ...UnorderedFoldableSuite(T),

    unorderedTraversable: <A, B, C, F, G>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      M: CommutativeMonoid<A>,
      T: Functor<T>,
      F: Applicative<F>,
      G: Applicative<G>,
      mkArbT: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<T, [X]>>,
      mkEqT: <X>(E: Eq<X>) => Eq<Kind<T, [X]>>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
      mkArbG: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<G, [X]>>,
      mkEqG: <X>(E: Eq<X>) => Eq<Kind<G, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'unordered traversable',
        [
          [
            'unorderedTraversable identity',
            forAll(
              mkArbT(arbA),
              fc.func<[A], B>(arbB),
              laws.unorderedTraversableIdentity(T),
            )(mkEqT(EqB)),
          ],
          [
            'unorderedTraversable traversable sequential composition',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[B], Kind<G, [C]>>(mkArbG(arbC)),
              laws.unorderedTraversableSequentialComposition(F, G),
            )(mkEqF(mkEqG(mkEqT(EqC)))),
          ],
          [
            'unorderedTraversable traversable parallel composition',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[A], Kind<G, [B]>>(mkArbG(arbB)),
              laws.unorderedTraversableParallelComposition(F, G),
            )(Eq.tuple(mkEqF(mkEqT(EqB)), mkEqG(mkEqT(EqB)))),
          ],
          [
            'unorderedTraversable unordered sequence consistent',
            forAll(
              mkArbT(arbA).chain(ta =>
                mkArbF(arbB).chain(fb => fc.constant(T.map_(ta, () => fb))),
              ),
              laws.unorderedSequenceConsistent(F),
            )(mkEqF(mkEqT(EqB))),
          ],
        ],
        { parent: self.unorderedFoldable(arbA, EqA, M, mkArbT) },
      ),
  };
  return self;
};
