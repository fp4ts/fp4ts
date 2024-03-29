// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Applicative } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ApplicativeLaws } from '../applicative-laws';
import { ApplySuite } from './apply-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ApplicativeSuite = <F>(F: Applicative<F>) => {
  const laws = ApplicativeLaws(F);
  const self = {
    ...ApplySuite(F),

    applicative: <A, B, C>(
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
        'applicative',
        [
          [
            'applicative identity',
            forAll(mkArbF(arbA), laws.applicativeIdentity)(mkEqF(EqA)),
          ],
          [
            'applicative homomorphism',
            forAll(
              arbA,
              fc.func<[A], B>(arbB),
              laws.applicativeHomomorphism,
            )(mkEqF(EqB)),
          ],
          [
            'applicative interchange',
            forAll(
              arbA,
              mkArbF(fc.func<[A], B>(arbB)),
              laws.applicativeInterchange,
            )(mkEqF(EqB)),
          ],
          [
            'applicative map',
            forAll(
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              laws.applicativeMap,
            )(mkEqF(EqB)),
          ],
          [
            'applicative ap/product consistent',
            forAll(
              mkArbF(arbA),
              mkArbF(fc.func<[A], B>(arbB)),
              laws.apProductConsistent,
            )(mkEqF(EqB)),
          ],
          ['applicative unit', forAll(arbA, laws.applicativeUnit)(mkEqF(EqA))],
        ],
        { parent: self.apply(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      ),
  };
  return self;
};
