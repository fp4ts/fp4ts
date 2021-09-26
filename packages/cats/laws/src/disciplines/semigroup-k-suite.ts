import { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { SemigroupKLaws } from '../semigroup-k-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const SemigroupKSuite = <F extends AnyK>(laws: SemigroupKLaws<F>) => ({
  semigroupK: <A>(
    arbFA: Arbitrary<Kind<F, [A]>>,
    EqFA: Eq<Kind<F, [A]>>,
  ): RuleSet =>
    new RuleSet('semigroupK', [
      [
        'semigroupK associativity',
        forAll(arbFA, arbFA, arbFA, EqFA, laws.semigroupKAssociative),
      ],
    ]),
});
