import fc from 'fast-check';
import { Eq } from '@cats4ts/cats';
import { MonadCancelSuite } from '@cats4ts/effect-laws';
import { IO } from '@cats4ts/effect-core';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/effect-test-kit/lib/arbitraries';
import * as E from '@cats4ts/effect-test-kit/lib/eq';
import * as AA from '@cats4ts/cats-test-kit/lib/arbitraries';

describe('IO Laws', () => {
  const monadCancelTests = MonadCancelSuite(IO.MonadCancel);
  checkAll(
    'MonadCancel<IO>',
    monadCancelTests.monadCancel(
      fc.integer(),
      fc.string(),
      fc.string(),
      fc.string(),
      AA.cats4tsError(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.Error.strict,
      A.cats4tsIO,
      E.eqIO,
    ),
  );
});
