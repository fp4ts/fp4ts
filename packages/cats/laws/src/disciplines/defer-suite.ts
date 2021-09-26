import { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { DeferLaws } from '../defer-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const DeferSuite = <F extends AnyK>(laws: DeferLaws<F>) => ({
  defer: <A>(
    arbUtoFA: Arbitrary<() => Kind<F, [A]>>,
    EqFA: Eq<Kind<F, [A]>>,
  ): RuleSet =>
    new RuleSet('defer', [
      ['defer identity', forAll(arbUtoFA, EqFA, laws.deferIdentity)],
      [
        'defer dot not evaluate',
        forAll(arbUtoFA, Eq.primitive, laws.deferDoesNotEvaluate),
      ],
      ['defer is stack safe', forAll(arbUtoFA, EqFA, laws.deferIsStackSafe)],
      ['defer is matches fix', forAll(arbUtoFA, EqFA, laws.deferMatchesFix)],
    ]),
});
