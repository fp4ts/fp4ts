import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { FlatMapLaws } from '../flat-map-laws';
import { ApplySuite } from './apply-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FlatMapSuite = <F extends AnyK>(laws: FlatMapLaws<F>) => {
  const self = {
    ...ApplySuite(laws),

    flatMap: <A, B, C, D>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFD: Arbitrary<Kind<F, [D]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFA: Eq<Kind<F, [A]>>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqFD: Eq<Kind<F, [D]>>,
    ): RuleSet => {
      const {
        flatMapAssociativity,
        flatMapConsistentApply,
        kleisliAssociativity,
        tailRecMConsistentFlatMap,
        flatMapFromTailRecMConsistency,
      } = laws;

      return new RuleSet(
        'flat map',
        [
          [
            'flatMap associativity',
            forAll(
              arbFA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              fc.func<[B], Kind<F, [C]>>(arbFC),
              EqFC,
              flatMapAssociativity,
            ),
          ],
          [
            'flatMap consistent apply',
            forAll(arbFAtoB, arbFA, EqFB, flatMapConsistentApply),
          ],
          [
            'kleisli associativity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              fc.func<[B], Kind<F, [C]>>(arbFC),
              fc.func<[C], Kind<F, [D]>>(arbFD),
              EqFD,
              kleisliAssociativity,
            ),
          ],
          [
            'flatMap from tailRecM consistency',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [A]>>(arbFA),
              EqFA,
              tailRecMConsistentFlatMap,
            ),
          ],
          [
            'tailRecM consistent flatMap',
            forAll(
              arbFA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              EqFB,
              flatMapFromTailRecMConsistency,
            ),
          ],
        ],
        {
          parent: self.apply(
            arbFA,
            arbFB,
            arbFC,
            arbFAtoB,
            arbFBtoC,
            arbB,
            arbC,
            EqFA,
            EqFC,
          ),
        },
      );
    },
  };
  return self;
};
