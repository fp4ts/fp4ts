import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Invariant, Eq } from '@cats4ts/cats-core';
import { InvariantLaws } from '../invariant-laws';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const InvariantSuite = <F extends AnyK>(F: Invariant<F>) => {
  const laws = InvariantLaws(F);

  return {
    invariant: <A, B, C>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFA: Eq<Kind<F, [A]>>,
      EqFC: Eq<Kind<F, [C]>>,
    ): RuleSet =>
      new RuleSet('invariant', [
        ['invariant identity', forAll(arbFA, laws.invariantIdentity)(EqFA)],
        [
          'invariant composition',
          forAll(
            arbFA,
            fc.func<[A], B>(arbB),
            fc.func<[B], C>(arbC),
            fc.func<[B], A>(arbA),
            fc.func<[C], B>(arbB),
            laws.invariantComposition,
          )(EqFC),
        ],
      ]),
  };
};
