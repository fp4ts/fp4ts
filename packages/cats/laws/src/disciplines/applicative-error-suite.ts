import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { ApplicativeError, Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { ApplicativeErrorLaws } from '../applicative-error-laws';
import { ApplicativeSuite } from './applicative-suite';
import { Either } from '@cats4ts/cats-core/lib/data';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ApplicativeErrorSuite = <F extends AnyK, E>(
  F: ApplicativeError<F, E>,
) => {
  const laws = ApplicativeErrorLaws(F);
  const self = {
    ...ApplicativeSuite(F),

    applicativeError: <A, B, C>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbE: Arbitrary<E>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqA: Eq<A>,
      EqE: Eq<E>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'applicative error',
        [
          [
            'applicativeError throwing handleErrorWith',
            forAll(
              arbE,
              fc.func<[E], Kind<F, [A]>>(arbFA),
              laws.applicativeErrorHandleWith,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError pure handleErrorWith',
            forAll(
              arbA,
              fc.func<[E], Kind<F, [A]>>(arbFA),
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
            )(mkEqF(Either.Eq(EqE, Eq.primitive))),
          ],
          [
            'applicativeError pure Attempt',
            forAll(arbA, laws.pureAttempt)(mkEqF(Either.Eq(EqE, EqA))),
          ],
          [
            'applicativeError attempt . fromEither is consistent with pure',
            forAll(
              A.cats4tsEither(arbE, arbA),
              laws.attemptFromEitherConsistentWithPure,
            )(mkEqF(Either.Eq(EqE, EqA))),
          ],
          [
            'applicativeError pure onError',
            forAll(
              arbA,
              fc.func<[E], Kind<F, [void]>>(arbFA.map(F.map(() => undefined))),
              laws.onErrorPure,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError throwing onError',
            forAll(arbFA, arbE, arbFB, laws.onErrorThrow)(EqFB),
          ],
          [
            'applicativeError redeem is derived from map . attempt',
            forAll(
              arbFA,
              fc.func<[E], B>(arbB),
              fc.func<[A], B>(arbB),
              laws.redeemDerivedFromAttemptMap,
            )(EqFB),
          ],
          [
            'applicativeError throwError distributes over ap left',
            forAll(
              arbE,
              fc.func<[E], Kind<F, [A]>>(arbFA),
              laws.throwErrorDistributesOverApLeft,
            )(mkEqF(EqA)),
          ],
          [
            'applicativeError throwError distributes over ap right',
            forAll(
              arbE,
              fc.func<[E], Kind<F, [A]>>(arbFA),
              laws.throwErrorDistributesOverApRight,
            )(mkEqF(EqA)),
          ],
        ],
        {
          parent: self.applicative(
            arbFA,
            arbFB,
            arbFC,
            arbFAtoB,
            arbFBtoC,
            arbA,
            arbB,
            arbC,
            mkEqF(EqA),
            EqFB,
            EqFC,
          ),
        },
      ),
  };
  return self;
};
