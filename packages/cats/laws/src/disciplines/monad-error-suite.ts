// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, MonadError } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { MonadErrorLaws } from '../monad-error-laws';
import { ApplicativeErrorSuite } from './applicative-error-suite';
import { MonadSuite } from './monad-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonadErrorSuite = <F, E>(F: MonadError<F, E>) => {
  const laws = MonadErrorLaws(F);
  const self = {
    ...ApplicativeErrorSuite(F),
    ...MonadSuite(F),

    monadError: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbE: Arbitrary<E>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      EqE: Eq<E>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'monad error',
        [
          [
            'monadError left zero',
            forAll(
              arbE,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              laws.monadErrorLeftZero,
            )(mkEqF(EqB)),
          ],
          [
            'monadError rethrow . attempt',
            forAll(mkArbF(arbA), laws.rethrowAttempt)(mkEqF(EqA)),
          ],
          [
            'monadError redeemWith is derived from flatMap . attempt',
            forAll(
              mkArbF(arbA),
              fc.func<[E], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              laws.redeemWithDerivedFromAttemptFlatMap,
            )(mkEqF(EqB)),
          ],
        ],
        {
          parents: [
            self.applicativeError(
              arbA,
              arbB,
              arbC,
              arbE,
              EqA,
              EqB,
              EqC,
              EqE,
              mkArbF,
              mkEqF,
            ),
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
          ],
        },
      ),

    stackUnsafeMonadError: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbE: Arbitrary<E>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      EqE: Eq<E>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'monad error',
        [
          [
            'monadError left zero',
            forAll(
              arbE,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              laws.monadErrorLeftZero,
            )(mkEqF(EqB)),
          ],
          [
            'monadError rethrow . attempt',
            forAll(mkArbF(arbA), laws.rethrowAttempt)(mkEqF(EqA)),
          ],
          [
            'monadError redeemWith is derived from flatMap . attempt',
            forAll(
              mkArbF(arbA),
              fc.func<[E], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              laws.redeemWithDerivedFromAttemptFlatMap,
            )(mkEqF(EqB)),
          ],
        ],
        {
          parents: [
            self.applicativeError(
              arbA,
              arbB,
              arbC,
              arbE,
              EqA,
              EqB,
              EqC,
              EqE,
              mkArbF,
              mkEqF,
            ),
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
          ],
        },
      ),
  };
  return self;
};
