import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@cats4ts/core';
import { Contravariant, Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { ContravariantLaws } from '../contravariant-laws';
import { InvariantSuite } from './invariant-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ContravariantSuite = <F>(F: Contravariant<F>) => {
  const laws = ContravariantLaws(F);

  const self = {
    ...InvariantSuite(F),

    contravariant: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'contravariant',
        [
          [
            'contravariant identity',
            forAll(mkArbF(arbA), laws.contravariantIdentity)(mkEqF(EqA)),
          ],
          [
            'contravariant composition',
            forAll(
              mkArbF(arbA),
              fc.func<[B], A>(arbA),
              fc.func<[C], B>(arbB),
              laws.contravariantComposition,
            )(mkEqF(EqC)),
          ],
        ],
        { parent: self.invariant(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      ),
  };
  return self;
};
