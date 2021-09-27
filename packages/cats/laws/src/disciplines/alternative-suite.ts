import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';
import { AlternativeLaws } from '../alternative-laws';
import { MonoidKSuite } from './monoid-k-suite';
import { ApplicativeSuite } from './applicative-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const AlternativeSuite = <F extends AnyK>(laws: AlternativeLaws<F>) => {
  const self = {
    ...MonoidKSuite(laws),
    ...ApplicativeSuite(laws),

    alternative: <A, B, C>(
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
        'alternative',
        [
          [
            'alternative right absorption',
            forAll(arbFAtoB, laws.alternativeRightAbsorption)(EqFA),
          ],
          [
            'alternative left absorption',
            forAll(
              arbFA,
              arbFA,
              fc.func<[A], B>(arbB),
              laws.alternativeLeftDistributivity,
            )(EqFA),
          ],
          [
            'alternative right absorption',
            forAll(
              arbFA,
              arbFAtoB,
              arbFAtoB,
              laws.alternativeRightDistributivity,
            )(EqFA),
          ],
        ],
        {
          parents: [
            self.monoidK(arbFA, EqFA),
            self.applicative(
              arbFA,
              arbFB,
              arbFC,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              EqFA,
              EqFB,
              EqFC,
            ),
          ],
        },
      ),
  };
  return self;
};
