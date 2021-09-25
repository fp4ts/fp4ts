import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';

import { FunctorLaws } from '../functor-laws';
import { forAll } from '../for-all';

export class FunctorSuite<F extends AnyK, L extends FunctorLaws<F>> {
  public constructor(public readonly laws: L) {}

  public readonly functor = <A, B, C>(
    arbFA: Arbitrary<Kind<F, [A]>>,
    arbB: Arbitrary<B>,
    arbC: Arbitrary<C>,
    EqFA: Eq<Kind<F, [A]>>,
    EqFC: Eq<Kind<F, [C]>>,
  ): TestSuite => {
    const { covariantComposition, covariantIdentity } = this.laws;
    return {
      name: 'functor',
      tests: [
        ['covariant identity', forAll(arbFA, EqFA, covariantIdentity)],
        [
          'covariant composition',
          forAll(
            arbFA,
            fc.func<[A], B>(arbB),
            fc.func<[B], C>(arbC),
            EqFC,
            covariantComposition,
          ),
        ],
      ],
    };
  };
}
