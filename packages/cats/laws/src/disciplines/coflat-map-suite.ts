// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { CoflatMap } from '@fp4ts/cats-core';
import { Eq } from '@fp4ts/cats-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { FunctorSuite } from './functor-suite';
import { CoflatMapLaws } from '../coflat-map-laws';

export const CoflatMapSuite = <F>(F: CoflatMap<F>) => {
  const laws = CoflatMapLaws(F);

  const self = {
    ...FunctorSuite(F),

    coflatMap: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'coflatMap',
        [
          [
            'coflatMap associativity',
            forAll(
              mkArbF(arbA),
              fc.func<[Kind<F, [A]>], B>(arbB),
              fc.func<[Kind<F, [B]>], C>(arbC),
              laws.coflatMapAssociativity,
            )(mkEqF(EqC)),
          ],
          [
            'coflatMap coflatten through map',
            forAll(
              mkArbF(arbA),
              laws.coflattenThroughMap,
            )(mkEqF(mkEqF(mkEqF(EqA)))),
          ],
          [
            'coflatMap coflatten coherence',
            forAll(
              mkArbF(arbA),
              fc.func<[Kind<F, [A]>], B>(arbB),
              laws.coflattenCoherence,
            )(mkEqF(EqB)),
          ],
        ],
        { parent: self.functor(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      ),
  };

  return self;
};
