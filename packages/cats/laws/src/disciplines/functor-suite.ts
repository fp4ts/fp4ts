import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq, Functor } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { FunctorLaws } from '../functor-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FunctorSuite = <F extends AnyK>(F: Functor<F>) => {
  const laws = FunctorLaws(F);
  return {
    functor: <A, B, C>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFA: Eq<Kind<F, [A]>>,
      EqFC: Eq<Kind<F, [C]>>,
    ): RuleSet => {
      const { covariantComposition, covariantIdentity } = laws;
      return new RuleSet('functor', [
        ['covariant identity', forAll(arbFA, covariantIdentity)(EqFA)],
        [
          'covariant composition',
          forAll(
            arbFA,
            fc.func<[A], B>(arbB),
            fc.func<[B], C>(arbC),
            covariantComposition,
          )(EqFC),
        ],
      ]);
    },
  };
};
