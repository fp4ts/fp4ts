import { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { MonoidKLaws } from '../monoid-k-laws';
import { SemigroupKSuite } from './semigroup-k-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonoidKSuite = <F extends AnyK>(laws: MonoidKLaws<F>) => {
  const self = {
    ...SemigroupKSuite(laws),

    monoidK: <A>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      EqFA: Eq<Kind<F, [A]>>,
    ): RuleSet =>
      new RuleSet(
        'monoidK',
        [
          [
            'monoidK left identity',
            forAll(arbFA, EqFA, laws.monoidKLeftIdentity),
          ],
          [
            'monoidK right identity',
            forAll(arbFA, EqFA, laws.monoidKRightIdentity),
          ],
        ],
        { parent: self.semigroupK(arbFA, EqFA) },
      ),
  };
  return self;
};
