// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import {
  Applicative,
  FunctorFilter,
  TraversableFilter,
} from '@fp4ts/cats-core';
import { Nested, Option } from '@fp4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import { TraversableFilterLaws } from '../traversable-filter-laws';
import { TraversableSuite } from './traversable-suite';
import { FunctorFilterSuite } from './functor-filter-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const TraversableFilterSuite = <T>(T: TraversableFilter<T>) => {
  const laws = TraversableFilterLaws(T);
  const self = {
    ...FunctorFilterSuite(T),
    ...TraversableSuite(T),

    traversableFilter: <A, B, C, F, G>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      MA: Monoid<A>,
      MB: Monoid<B>,
      T: FunctorFilter<T>,
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
            'traversableFilter identity',
            forAll(mkArbT(arbA), laws.traverseFilterIdentity)(mkEqT(EqA)),
          ],
          [
            'traversableFilter consistent with traverse',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              laws.traverseFilterConsistentWithTraverse(F),
            )(mkEqF(mkEqT(EqB))),
          ],
          [
            'traversableFilter consistent with mapFilter',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Option<B>>(A.fp4tsOption(arbB)),
              laws.traverseFilterConsistentWithMapFilter,
            )(mkEqT(EqB)),
          ],
          [
            'filterA consistent with traverseFilter',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Kind<F, [boolean]>>(mkArbF(fc.boolean())),
              laws.filterAConsistentWithTraverseFilter(F),
            )(mkEqF(mkEqT(EqA))),
          ],
          [
            'traverseFilter sequential composition',
            forAll(
              mkArbT(arbA),
              fc.func<[A], Kind<F, [Option<B>]>>(mkArbF(A.fp4tsOption(arbB))),
              fc.func<[B], Kind<G, [Option<C>]>>(mkArbG(A.fp4tsOption(arbC))),
              laws.traverseFilterSequentialComposition(F, G),
            )(Nested.Eq(mkEqF(mkEqG(mkEqT(EqC))))),
          ],
        ],
        {
          parents: [
            self.functorFilter(arbA, arbB, arbC, EqA, EqB, EqC, mkArbT, mkEqT),
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
