import { Arbitrary } from 'fast-check';
import { Kind } from '@cats4ts/core';
import { Eq, MonoidK } from '@cats4ts/cats-core';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';

import { MonoidKLaws } from '../monoid-k-laws';
import { SemigroupKSuite } from './semigroup-k-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonoidKSuite = <F>(F: MonoidK<F>) => {
  const laws = MonoidKLaws(F);
  const self = {
    ...SemigroupKSuite(F),

    monoidK: <A>(
      arbA: Arbitrary<A>,
      EqA: Eq<A>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet(
        'monoidK',
        [
          [
            'monoidK left identity',
            forAll(mkArbF(arbA), laws.monoidKLeftIdentity)(mkEqF(EqA)),
          ],
          [
            'monoidK right identity',
            forAll(mkArbF(arbA), laws.monoidKRightIdentity)(mkEqF(EqA)),
          ],
        ],
        { parent: self.semigroupK(arbA, EqA, mkArbF, mkEqF) },
      ),
  };
  return self;
};
