import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { ArrowApply } from '@fp4ts/cats-core';
import { exec, ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ArrowApplyLaws } from '../arrow-apply-laws';
import { ArrowSuite } from './arrow-suite';

export function ArrowApplySuite<F>(F: ArrowApply<F>) {
  const laws = ArrowApplyLaws(F);

  const self = {
    ...ArrowSuite(F),

    arrowApply: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EqA: Eq<A>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
      EcB: ExhaustiveCheck<B>,
      EqC: Eq<C>,
      EcC: ExhaustiveCheck<C>,
      EqD: Eq<D>,
      EcD: ExhaustiveCheck<D>,
      EqB2: Eq<B2>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<F, [X, Y]>>,
      mkEqF: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<F, [X, Y]>>,
      mkEcF: <X, Y>(
        EcX: ExhaustiveCheck<X>,
        ECY: ExhaustiveCheck<Y>,
      ) => ExhaustiveCheck<Kind<F, [X, Y]>>,
    ) =>
      new RuleSet(
        'ArrowApply',
        [
          [
            'first (arr (\\x -> arr (\\y -> (x,y)))) >>> app = id',
            exec(laws.firstLiftAppIdentity<A, B>())(
              mkEqF(EcA.product(EcB), Eq.tuple(EqA, EqB)),
            ),
          ],
          [
            'first (arr (g >>>)) >>> app = second g >>> app',
            forAll(
              mkArbF(arbA, arbB),
              laws.leftComposeAppEquivalence<C>(),
            )(mkEqF(mkEcF(EcB, EcC).product(EcA), EqC)),
          ],
          [
            'first (arr (>>> h)) >>> app = app >>> h',
            forAll(
              mkArbF(arbA, arbB),
              laws.rightComposeAppEquivalence<C>(),
            )(mkEqF(mkEcF(EcC, EcA).product(EcC), EqB)),
          ],
        ],
        {
          parent: self.arrow(
            arbA,
            arbB,
            arbC,
            arbD,
            arbB1,
            arbB2,
            EqA,
            EcA,
            EqB,
            EqC,
            EcC,
            EqD,
            EcD,
            EqB2,
            mkArbF,
            mkEqF,
          ),
        },
      ),
  };

  return self;
}
