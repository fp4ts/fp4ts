import { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Defer, Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { DeferLaws } from '../defer-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const DeferSuite = <F extends AnyK>(F: Defer<F>) => {
  const laws = DeferLaws(F);
  return {
    defer: <A>(
      arbUtoFA: Arbitrary<() => Kind<F, [A]>>,
      EqFA: Eq<Kind<F, [A]>>,
    ): RuleSet =>
      new RuleSet('defer', [
        ['defer identity', forAll(arbUtoFA, laws.deferIdentity)(EqFA)],
        [
          'defer dot not evaluate',
          forAll(arbUtoFA, laws.deferDoesNotEvaluate)(Eq.primitive),
        ],
        ['defer is stack safe', forAll(arbUtoFA, laws.deferIsStackSafe)(EqFA)],
        ['defer is matches fix', forAll(arbUtoFA, laws.deferMatchesFix)(EqFA)],
      ]),
  };
};
