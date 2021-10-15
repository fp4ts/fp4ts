import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@cats4ts/core';
import { Defer, Eq } from '@cats4ts/cats-core';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';

import { DeferLaws } from '../defer-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const DeferSuite = <F>(F: Defer<F>) => {
  const laws = DeferLaws(F);
  return {
    defer: <A>(
      arbA: Arbitrary<A>,
      EqA: Eq<A>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet('defer', [
        [
          'defer identity',
          forAll(
            fc.func<[], Kind<F, [A]>>(mkArbF(arbA)),
            laws.deferIdentity,
          )(mkEqF(EqA)),
        ],
        [
          'defer dot not evaluate',
          forAll(
            fc.func<[], Kind<F, [A]>>(mkArbF(arbA)),
            laws.deferDoesNotEvaluate,
          )(Eq.primitive),
        ],
        [
          'defer is stack safe',
          forAll(
            fc.func<[], Kind<F, [A]>>(mkArbF(arbA)),
            laws.deferIsStackSafe,
          )(mkEqF(EqA)),
        ],
        [
          'defer is matches fix',
          forAll(
            fc.func<[], Kind<F, [A]>>(mkArbF(arbA)),
            laws.deferMatchesFix,
          )(mkEqF(EqA)),
        ],
      ]),
  };
};
