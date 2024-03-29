// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Unzip } from '@fp4ts/cats-core';
import { Eq } from '@fp4ts/cats-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { UnzipLaws } from '../unzip-laws';
import { ZipSuite } from './zip-suite';

export const UnzipSuite = <F>(F: Unzip<F>) => {
  const laws = UnzipLaws(F);

  const self = {
    ...ZipSuite(F),
    unzip: <A, B, C, D>(
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
        'Unzip',
        [
          [
            'zip unzip identity',
            forAll(
              mkArbF(arbA),
              laws.zipUnzipIdentity,
            )(Eq.tuple(mkEqF(EqA), mkEqF(EqA))),
          ],
          [
            'unzip zip identity',
            forAll(
              mkArbF(fc.tuple(arbA, arbB)),
              laws.unzipZipIdentity,
            )(mkEqF(Eq.tuple(EqA, EqB))),
          ],
          [
            'unzip is consistent with unzipWith',
            forAll(
              mkArbF(fc.tuple(arbA, arbB)),
              laws.unzipWithConsistentWithUnzip,
            )(Eq.tuple(mkEqF(EqA), mkEqF(EqB))),
          ],
        ],
        {
          parent: self.zip(
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
