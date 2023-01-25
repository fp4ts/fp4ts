// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Unalign } from '@fp4ts/cats-core';
import { Eq } from '@fp4ts/cats-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { UnalignLaws } from '../unalign-laws';
import { AlignSuite } from './align-suite';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

export const UnalignSuite = <F>(F: Unalign<F>) => {
  const laws = UnalignLaws(F);

  const self = {
    ...AlignSuite(F),
    unalign: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(X: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(X: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'Unalign',
        [
          [
            'align unalign identity',
            forAll(
              mkArbF(arbA),
              laws.alignUnalignIdentity,
            )(Eq.tuple(mkEqF(EqA), mkEqF(EqA))),
          ],
          [
            'unalign is consistent with unalignWith',
            forAll(
              mkArbF(A.fp4tsIor(arbA, arbB)),
              laws.unalignWithConsistentWithUnalign,
            )(Eq.tuple(mkEqF(EqA), mkEqF(EqB))),
          ],
        ],
        {
          parent: self.align(
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
        },
      ),
  };
  return self;
};
