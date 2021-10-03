import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Alternative, Eq } from '@cats4ts/cats-core';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';
import { AlternativeLaws } from '../alternative-laws';
import { MonoidKSuite } from './monoid-k-suite';
import { ApplicativeSuite } from './applicative-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const AlternativeSuite = <F extends AnyK>(F: Alternative<F>) => {
  const laws = AlternativeLaws(F);
  const self = {
    ...MonoidKSuite(F),
    ...ApplicativeSuite(F),

    alternative: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet(
        'alternative',
        [
          [
            'alternative right absorption',
            forAll(
              mkArbF(fc.func<[A], B>(arbB)),
              laws.alternativeRightAbsorption,
            )(mkEqF(EqA)),
          ],
          [
            'alternative left absorption',
            forAll(
              mkArbF(arbA),
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              laws.alternativeLeftDistributivity,
            )(mkEqF(EqA)),
          ],
          [
            'alternative right absorption',
            forAll(
              mkArbF(arbA),
              mkArbF(fc.func<[A], B>(arbB)),
              mkArbF(fc.func<[A], B>(arbB)),
              laws.alternativeRightDistributivity,
            )(mkEqF(EqA)),
          ],
        ],
        {
          parents: [
            self.monoidK(arbA, EqA, mkArbF, mkEqF),
            self.applicative(arbA, arbB, arbC, EqA, EqB, EqC, mkArbF, mkEqF),
          ],
        },
      ),
  };
  return self;
};
