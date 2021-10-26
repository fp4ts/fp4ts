import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, Functor } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { FunctorLaws } from '../functor-laws';
import { InvariantSuite } from './invariant-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FunctorSuite = <F>(F: Functor<F>) => {
  const laws = FunctorLaws(F);
  const self = {
    ...InvariantSuite(F),

    functor: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet => {
      const { covariantComposition, covariantIdentity } = laws;
      return new RuleSet(
        'functor',
        [
          [
            'covariant identity',
            forAll(mkArbF(arbA), covariantIdentity)(mkEqF(EqA)),
          ],
          [
            'covariant composition',
            forAll(
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              fc.func<[B], C>(arbC),
              covariantComposition,
            )(mkEqF(EqC)),
          ],
        ],
        { parent: self.invariant(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      );
    },
  };
  return self;
};
