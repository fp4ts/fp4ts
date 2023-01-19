// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { ApplicativeError } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import { ApplicativeErrorLaws } from '../applicative-error-laws';
import { ApplicativeSuite } from './applicative-suite';
import { Either } from '@fp4ts/cats-core/lib/data';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ApplicativeErrorSuite = <F, E>(F: ApplicativeError<F, E>) => {
  const laws = ApplicativeErrorLaws(F);
  const self = {
    ...ApplicativeSuite(F),

    applicativeError: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbE: Arbitrary<E>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqE: Eq<E>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'applicative error',
        [
          [
            'applicativeError throwing handleErrorWith',
            forAll(
              arbE,
              fc.func<[E], Kind<F, [A]>>(mkArbF(arbA)),
              laws.applicativeErrorHandleWith,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError pure handleErrorWith',
            forAll(
              arbA,
              fc.func<[E], Kind<F, [A]>>(mkArbF(arbA)),
              laws.handleErrorWithPure,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError throwing handleError',
            forAll(
              arbE,
              fc.func<[E], A>(arbA),
              laws.handleErrorThrow,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError pure handleError',
            forAll(
              arbA,
              fc.func<[E], A>(arbA),
              laws.handleErrorPure,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError throwing attempt',
            forAll(
              arbE,
              laws.throwErrorAttempt,
            )(mkEqF(Either.Eq(EqE, Eq.fromUniversalEquals<void>()))),
          ],
          [
            'applicativeError pure Attempt',
            forAll(arbA, laws.pureAttempt)(mkEqF(Either.Eq(EqE, EqA))),
          ],
          [
            'applicativeError attempt . fromEither is consistent with pure',
            forAll(
              A.fp4tsEither(arbE, arbA),
              laws.attemptFromEitherConsistentWithPure,
            )(mkEqF(Either.Eq(EqE, EqA))),
          ],
          [
            'applicativeError pure onError',
            forAll(
              arbA,
              fc.func<[E], Kind<F, [void]>>(mkArbF(arbA).map(F.void)),
              laws.onErrorPure,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError throwing onError',
            forAll(
              mkArbF(arbA),
              arbE,
              mkArbF(fc.constant(undefined as void)),
              laws.onErrorThrow,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError redeem is derived from map . attempt',
            forAll(
              mkArbF(arbA),
              fc.func<[E], B>(arbB),
              fc.func<[A], B>(arbB),
              laws.redeemDerivedFromAttemptMap,
            )(mkEqF(EqB)),
          ],
          [
            'applicativeError throwError distributes over ap left',
            forAll(
              arbE,
              fc.func<[E], Kind<F, [A]>>(mkArbF(arbA)),
              laws.throwErrorDistributesOverApLeft,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError throwError distributes over ap right',
            forAll(
              arbE,
              fc.func<[E], Kind<F, [A]>>(mkArbF(arbA)),
              laws.throwErrorDistributesOverApRight,
            )(mkEqF(EqA)),
          ],
        ],
        {
          parent: self.applicative(
            arbA,
            arbB,
            arbC,
            EqA,
            EqB,
            EqC,
            mkArbF,
            mkEqF,
          ),
        },
      ),
  };
  return self;
};
