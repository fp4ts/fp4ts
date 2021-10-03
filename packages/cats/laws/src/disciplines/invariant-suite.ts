import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Invariant, Eq } from '@cats4ts/cats-core';
import { InvariantLaws } from '../invariant-laws';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const InvariantSuite = <F extends AnyK>(F: Invariant<F>) => {
  const laws = InvariantLaws(F);

  return {
    invariant: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet('invariant', [
        [
          'invariant identity',
          forAll(mkArbF(arbA), laws.invariantIdentity)(mkEqF(EqA)),
        ],
        [
          'invariant composition',
          forAll(
            mkArbF(arbA),
            fc.func<[A], B>(arbB),
            fc.func<[B], C>(arbC),
            fc.func<[B], A>(arbA),
            fc.func<[C], B>(arbB),
            laws.invariantComposition,
          )(mkEqF(EqC)),
        ],
      ]),
  };
};
