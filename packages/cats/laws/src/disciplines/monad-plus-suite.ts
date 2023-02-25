// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { MonadPlus } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { MonadPlusLaws } from '../monad-plus-laws';

import { AlternativeSuite } from './alternative-suite';
import { FunctorFilterSuite } from './functor-filter-suite';
import { MonadSuite } from './monad-suite';

export const MonadPlusSuite = <F>(F: MonadPlus<F>) => {
  const laws = MonadPlusLaws(F);
  const self = {
    ...MonadSuite(F),
    ...AlternativeSuite(F),
    ...FunctorFilterSuite(F),

    monadPlus: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'MonadPlus',
        [
          [
            'monadPlus filter(_ => false) is emptyK',
            forAll(mkArbF(arbA), laws.monadPlusFilterFalseIsEmpty)(mkEqF(EqA)),
          ],
          [
            'monadPlus filter(_ => true) is id',
            forAll(
              mkArbF(arbA),
              laws.monadPlusFilterTrueIsIdentity,
            )(mkEqF(EqA)),
          ],
          [
            'monadPlus filter is flatMap(a => f(a) ? pure(a) : emptyK())',
            forAll(
              mkArbF(arbA),
              fc.func(fc.boolean()),
              laws.monadPlusFilterReference,
            )(mkEqF(EqA)),
          ],
        ],
        {
          parents: [
            self.monad(
              arbA,
              arbB,
              arbC,
              arbD,
              EqA,
              EqB,
              EqC,
              EqD,
              mkArbF,
              mkEqF,
            ),
            self.functorFilter(arbA, arbB, arbC, EqA, EqB, EqC, mkArbF, mkEqF),
            self.alternative(arbA, arbB, arbC, EqA, EqB, EqC, mkArbF, mkEqF),
          ],
        },
      ),
  };
  return self;
};
