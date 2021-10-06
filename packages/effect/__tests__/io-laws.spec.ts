import '@cats4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { Eq } from '@cats4ts/cats';
import { IO } from '@cats4ts/effect-core';
import { AsyncSuite } from '@cats4ts/effect-laws';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/effect-test-kit/lib/arbitraries';
import * as E from '@cats4ts/effect-test-kit/lib/eq';

describe.ticked('IO Laws', ticker => {
  const spawnTests = AsyncSuite(IO.Async);
  checkAll(
    'Async<IO>',
    spawnTests.async(
      fc.integer(),
      fc.string(),
      fc.string(),
      fc.string(),
      ticker.ctx,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      E.eqIOOutcome(Eq.primitive),
      A.cats4tsIO,
      EqX => E.eqIO(EqX, ticker),
    ),
  );
});
