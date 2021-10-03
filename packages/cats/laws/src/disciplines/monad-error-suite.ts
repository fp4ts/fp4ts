import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq, MonadError } from '@cats4ts/cats-core';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';

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
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
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
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
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
