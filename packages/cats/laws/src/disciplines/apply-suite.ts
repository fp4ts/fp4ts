import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Apply, Eq } from '@cats4ts/cats-core';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';

import { ApplyLaws } from '../apply-laws';
import { FunctorSuite } from './functor-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ApplySuite = <F extends AnyK>(F: Apply<F>) => {
  const laws = ApplyLaws(F);
  const self = {
    ...FunctorSuite(F),

    apply: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet => {
      const {
        applyComposition,
        map2ProductConsistency,
        map2EvalConsistency,
        productLConsistency,
        productRConsistency,
      } = laws;

      return new RuleSet(
        'apply',
        [
          [
            'apply composition',
            forAll(
              mkArbF(arbA),
              mkArbF(fc.func<[A], B>(arbB)),
              mkArbF(fc.func<[B], C>(arbC)),
              applyComposition,
            )(mkEqF(EqC)),
          ],
          [
            'map2/product-map consistency',
            forAll(
              mkArbF(arbA),
              mkArbF(arbB),
              fc.func<[A, B], C>(arbC),
              map2ProductConsistency,
            )(mkEqF(EqC)),
          ],
          [
            'map2/map2Eval consistency',
            forAll(
              mkArbF(arbA),
              mkArbF(arbB),
              fc.func<[A, B], C>(arbC),
              map2EvalConsistency,
            )(mkEqF(EqC)),
          ],
          [
            'productL consistent map2',
            forAll(mkArbF(arbA), mkArbF(arbC), productLConsistency)(mkEqF(EqA)),
          ],
          [
            'productR consistent map2',
            forAll(mkArbF(arbA), mkArbF(arbC), productRConsistency)(mkEqF(EqC)),
          ],
        ],
        { parent: self.functor(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      );
    },
  };
  return self;
};
