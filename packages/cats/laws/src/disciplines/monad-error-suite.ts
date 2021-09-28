import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq, MonadError } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { MonadErrorLaws } from '../monad-error-laws';
import { ApplicativeErrorSuite } from './applicative-error-suite';
import { MonadSuite } from './monad-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonadErrorSuite = <F extends AnyK, E>(F: MonadError<F, E>) => {
  const laws = MonadErrorLaws(F);
  const self = {
    ...ApplicativeErrorSuite(F),
    ...MonadSuite(F),

    monadError: <A, B, C, D>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFD: Arbitrary<Kind<F, [D]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbE: Arbitrary<E>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqFD: Eq<Kind<F, [D]>>,
      EqA: Eq<A>,
      EqE: Eq<E>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'monad error',
        [
          [
            'monadError left zero',
            forAll(
              arbE,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              laws.monadErrorLeftZero,
            )(EqFB),
          ],
          [
            'monadError rethrow . attempt',
            forAll(arbFA, laws.rethrowAttempt)(mkEqF(EqA)),
          ],
          [
            'monadError redeemWith is derived from flatMap . attempt',
            forAll(
              arbFA,
              fc.func<[E], Kind<F, [B]>>(arbFB),
              fc.func<[A], Kind<F, [B]>>(arbFB),
              laws.redeemWithDerivedFromAttemptFlatMap,
            )(EqFB),
          ],
        ],
        {
          parents: [
            self.applicativeError(
              arbFA,
              arbFB,
              arbFC,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              arbE,
              EqFB,
              EqFC,
              EqA,
              EqE,
              mkEqF,
            ),
            self.monad(
              arbFA,
              arbFB,
              arbFC,
              arbFD,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              mkEqF(EqA),
              EqFB,
              EqFC,
              EqFD,
            ),
          ],
        },
      ),

    stackUnsafeMonadError: <A, B, C, D>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFD: Arbitrary<Kind<F, [D]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbE: Arbitrary<E>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqFD: Eq<Kind<F, [D]>>,
      EqA: Eq<A>,
      EqE: Eq<E>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'monad error',
        [
          [
            'monadError left zero',
            forAll(
              arbE,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              laws.monadErrorLeftZero,
            )(EqFB),
          ],
          [
            'monadError rethrow . attempt',
            forAll(arbFA, laws.rethrowAttempt)(mkEqF(EqA)),
          ],
          [
            'monadError redeemWith is derived from flatMap . attempt',
            forAll(
              arbFA,
              fc.func<[E], Kind<F, [B]>>(arbFB),
              fc.func<[A], Kind<F, [B]>>(arbFB),
              laws.redeemWithDerivedFromAttemptFlatMap,
            )(EqFB),
          ],
        ],
        {
          parents: [
            self.applicativeError(
              arbFA,
              arbFB,
              arbFC,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              arbE,
              EqFB,
              EqFC,
              EqA,
              EqE,
              mkEqF,
            ),
            self.stackUnsafeMonad(
              arbFA,
              arbFB,
              arbFC,
              arbFD,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              mkEqF(EqA),
              EqFB,
              EqFC,
              EqFD,
            ),
          ],
        },
      ),
  };
  return self;
};
