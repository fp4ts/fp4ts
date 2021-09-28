import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Applicative, Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { ApplicativeLaws } from '../applicative-laws';
import { ApplySuite } from './apply-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ApplicativeSuite = <F extends AnyK>(F: Applicative<F>) => {
  const {
    applicativeIdentity,
    applicativeHomomorphism,
    applicativeInterchange,
    applicativeMap,
    apProductConsistent,
    applicativeUnit,
  } = ApplicativeLaws(F);
  const self = {
    ...ApplySuite(F),

    applicative: <A, B, C>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFA: Eq<Kind<F, [A]>>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
    ): RuleSet =>
      new RuleSet(
        'applicative',
        [
          ['applicative identity', forAll(arbFA, applicativeIdentity)(EqFA)],
          [
            'applicative homomorphism',
            forAll(arbA, fc.func<[A], B>(arbB), applicativeHomomorphism)(EqFB),
          ],
          [
            'applicative interchange',
            forAll(arbA, arbFAtoB, applicativeInterchange)(EqFB),
          ],
          [
            'applicative map',
            forAll(arbFA, fc.func<[A], B>(arbB), applicativeMap)(EqFB),
          ],
          [
            'applicative ap/product consistent',
            forAll(arbFA, arbFAtoB, apProductConsistent)(EqFB),
          ],
          ['applicative unit', forAll(arbA, applicativeUnit)(EqFA)],
        ],
        {
          parent: self.apply(
            arbFA,
            arbFB,
            arbFC,
            arbFAtoB,
            arbFBtoC,
            arbB,
            arbC,
            EqFA,
            EqFC,
          ),
        },
      ),
  };
  return self;
};
