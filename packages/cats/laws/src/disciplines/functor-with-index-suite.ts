// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { FunctorWithIndex } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { FunctorWithIndexLaws } from '../functor-with-index-laws';
import { FunctorSuite } from './functor-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FunctorWithIndexSuite = <F, I>(F: FunctorWithIndex<F, I>) => {
  const laws = FunctorWithIndexLaws(F);
  const self = {
    ...FunctorSuite(F),

    functorWithIndex: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet => {
      return new RuleSet(
        'FunctorWithIndex',
        [
          [
            'covariant identity',
            forAll(mkArbF(arbA), laws.indexedCovariantIdentity)(mkEqF(EqA)),
          ],
          [
            'covariant composition',
            forAll(
              mkArbF(arbA),
              fc.func<[A, I], B>(arbB),
              fc.func<[B, I], C>(arbC),
              laws.indexedCovariantComposition,
            )(mkEqF(EqC)),
          ],
        ],
        { parent: self.functor(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      );
    },
  };
  return self;
};
