import fc from 'fast-check';
import { Eq } from '@cats4ts/cats-core';
import { Option } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { ApplicativeSuite } from '../disciplines/applicative-suite';
import { ApplicativeLaws } from '../applicative-laws';

describe('Option Laws', () => {
  const eqOptionNumber: Eq<Option<number>> = {
    equals: (lhs, rhs) => lhs.equals(rhs),
    notEquals: (lhs, rhs) => !lhs.equals(rhs),
  };

  const tests = new ApplicativeSuite(new ApplicativeLaws(Option.Applicative));

  checkAll(
    'Option<number>',
    tests.applicative(
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.func<[number], number>(fc.integer())),
      A.cats4tsOption(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqOptionNumber,
      eqOptionNumber,
      eqOptionNumber,
    ),
  );
});
