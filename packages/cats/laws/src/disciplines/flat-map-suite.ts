import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, FlatMap } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { FlatMapLaws } from '../flat-map-laws';
import { ApplySuite } from './apply-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const FlatMapSuite = <F>(F: FlatMap<F>) => {
  const laws = FlatMapLaws(F);
  const self = {
    ...ApplySuite(F),

    flatMap: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
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
              mkArbF(arbA),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[B], Kind<F, [C]>>(mkArbF(arbC)),
              flatMapAssociativity,
            )(mkEqF(EqC)),
          ],
          [
            'flatMap consistent apply',
            forAll(
              mkArbF(fc.func<[A], B>(arbB)),
              mkArbF(arbA),
              flatMapConsistentApply,
            )(mkEqF(EqB)),
          ],
          [
            'kleisli associativity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              fc.func<[B], Kind<F, [C]>>(mkArbF(arbC)),
              fc.func<[C], Kind<F, [D]>>(mkArbF(arbD)),
              kleisliAssociativity,
            )(mkEqF(EqD)),
          ],
          [
            'flatMap from tailRecM consistency',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [A]>>(mkArbF(arbA)),
              tailRecMConsistentFlatMap,
            )(mkEqF(EqA)),
          ],
          [
            'tailRecM consistent flatMap',
            forAll(
              mkArbF(arbA),
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              flatMapFromTailRecMConsistency,
            )(mkEqF(EqB)),
          ],
        ],
        { parent: self.apply(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      );
    },
  };
  return self;
};
