import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { FunctorSuite } from './functor-suite';
import { Eq } from '@cats4ts/cats-core';
import { ApplyLaws } from '../apply-laws';

import { forAll } from '../for-all';

export class ApplySuite<
  F extends AnyK,
  L extends ApplyLaws<F>,
> extends FunctorSuite<F, L> {
  public readonly apply = <A, B, C>(
    arbFA: Arbitrary<Kind<F, [A]>>,
    arbFB: Arbitrary<Kind<F, [B]>>,
    arbFC: Arbitrary<Kind<F, [C]>>,
    arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
    arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
    arbB: Arbitrary<B>,
    arbC: Arbitrary<C>,
    EqFA: Eq<Kind<F, [A]>>,
    EqFC: Eq<Kind<F, [C]>>,
  ): TestSuite => {
    const {
      applyComposition,
      map2ProductConsistency,
      map2EvalConsistency,
      productLConsistency,
      productRConsistency,
    } = this.laws;

    return {
      name: 'apply',
      parent: this.functor(arbFA, arbB, arbC, EqFA, EqFC),
      tests: [
        [
          'apply composition',
          forAll(arbFA, arbFAtoB, arbFBtoC, EqFC, applyComposition),
        ],
        [
          'map2/product-map consistency',
          forAll(
            arbFA,
            arbFB,
            fc.func<[A, B], C>(arbC),
            EqFC,
            map2ProductConsistency,
          ),
        ],
        [
          'map2/map2Eval consistency',
          forAll(
            arbFA,
            arbFB,
            fc.func<[A, B], C>(arbC),
            EqFC,
            map2EvalConsistency,
          ),
        ],
        [
          'productL consistent map2',
          forAll(arbFA, arbFC, EqFA, productLConsistency),
        ],
        [
          'productR consistent map2',
          forAll(arbFA, arbFC, EqFC, productRConsistency),
        ],
      ],
    };
  };
}
