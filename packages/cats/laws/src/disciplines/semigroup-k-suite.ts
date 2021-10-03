import { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq, SemigroupK } from '@cats4ts/cats-core';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';

import { SemigroupKLaws } from '../semigroup-k-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const SemigroupKSuite = <F extends AnyK>(F: SemigroupK<F>) => {
  const laws = SemigroupKLaws(F);
  return {
    semigroupK: <A>(
      arbA: Arbitrary<A>,
      EqA: Eq<A>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet('semigroupK', [
        [
          'semigroupK associativity',
          forAll(
            mkArbF(arbA),
            mkArbF(arbA),
            mkArbF(arbA),
            laws.semigroupKAssociative,
          )(mkEqF(EqA)),
        ],
      ]),
  };
};
