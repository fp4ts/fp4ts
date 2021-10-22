import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@cats4ts/core';
import { Applicative, Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { ApplicativeLaws } from '../applicative-laws';
import { ApplySuite } from './apply-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ApplicativeSuite = <F>(F: Applicative<F>) => {
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
            forAll(mkArbF(arbA), applicativeIdentity)(mkEqF(EqA)),
          ],
          [
            'applicative homomorphism',
            forAll(
              arbA,
              fc.func<[A], B>(arbB),
              applicativeHomomorphism,
            )(mkEqF(EqB)),
          ],
          [
            'applicative interchange',
            forAll(
              arbA,
              mkArbF(fc.func<[A], B>(arbB)),
              applicativeInterchange,
            )(mkEqF(EqB)),
          ],
          [
            'applicative map',
            forAll(
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              applicativeMap,
            )(mkEqF(EqB)),
          ],
          [
            'applicative ap/product consistent',
            forAll(
              mkArbF(arbA),
              mkArbF(fc.func<[A], B>(arbB)),
              apProductConsistent,
            )(mkEqF(EqB)),
          ],
          ['applicative unit', forAll(arbA, applicativeUnit)(mkEqF(EqA))],
        ],
        { parent: self.apply(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      ),
  };
  return self;
};
