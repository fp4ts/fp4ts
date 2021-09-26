import fc from 'fast-check';
import { Eq, Eval } from '@cats4ts/cats-core';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { DeferSuite } from '../disciplines/defer-suite';
import { DeferLaws } from '../defer-laws';
import { MonadSuite } from '../disciplines/monad-suite';
import { MonadLaws } from '../monad-laws';

describe('Eval Laws', () => {
  const eqEvalNumber: Eq<Eval<number>> = {
    equals: (a, b) => a.value === b.value,
    notEquals: (a, b) => a.value !== b.value,
  };

  const deferTests = DeferSuite(DeferLaws(Eval.Defer));
  checkAll(
    'Defer<Eval>',
    deferTests.defer(
      fc.func<[], Eval<number>>(A.cats4tsEval(fc.integer())),
      eqEvalNumber,
    ),
  );

  const tests = MonadSuite(MonadLaws(Eval.Monad));
  checkAll(
    'Monad<Eval>',
    tests.monad(
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.func<[number], number>(fc.integer())),
      A.cats4tsEval(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqEvalNumber,
      eqEvalNumber,
      eqEvalNumber,
      eqEvalNumber,
    ),
  );
});
