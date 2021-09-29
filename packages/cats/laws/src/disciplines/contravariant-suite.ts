import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Contravariant, Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { ContravariantLaws } from '../contravariant-laws';
import { InvariantSuite } from './invariant-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ContravariantSuite = <F extends AnyK>(F: Contravariant<F>) => {
  const laws = ContravariantLaws(F);

  const self = {
    ...InvariantSuite(F),

    contravariant: <A, B, C>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFA: Eq<Kind<F, [A]>>,
      EqFC: Eq<Kind<F, [C]>>,
    ): RuleSet =>
      new RuleSet(
        'contravariant',
        [
          [
            'contravariant identity',
            forAll(arbFA, laws.contravariantIdentity)(EqFA),
          ],
          [
            'contravariant composition',
            forAll(
              arbFA,
              fc.func<[B], A>(arbA),
              fc.func<[C], B>(arbB),
              laws.contravariantComposition,
            )(EqFC),
          ],
        ],
        { parent: self.invariant(arbFA, arbA, arbB, arbC, EqFA, EqFC) },
      ),
  };
  return self;
};
