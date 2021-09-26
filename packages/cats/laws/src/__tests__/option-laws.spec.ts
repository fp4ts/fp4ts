import fc from 'fast-check';
import { PrimitiveType } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { Option } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { MonadSuite } from '../disciplines/monad-suite';
import { MonadLaws } from '../monad-laws';
import { AlternativeSuite } from '../disciplines/alternative-suite';
import { AlternativeLaws } from '../alternative-laws';

describe('Option Laws', () => {
  const eqOptionPrimitive: Eq<Option<PrimitiveType>> = Option.Eq(Eq.primitive);

  const alternativeTests = AlternativeSuite(
    AlternativeLaws(Option.Alternative),
  );

  checkAll(
    'Alternative<OptionK>',
    alternativeTests.alternative(
      A.cats4tsOption(A.cats4tsPrimitive()),
      A.cats4tsOption(A.cats4tsPrimitive()),
      A.cats4tsOption(A.cats4tsPrimitive()),
      A.cats4tsOption(
        fc.func<[PrimitiveType], PrimitiveType>(A.cats4tsPrimitive()),
      ),
      A.cats4tsOption(
        fc.func<[PrimitiveType], PrimitiveType>(A.cats4tsPrimitive()),
      ),
      A.cats4tsPrimitive(),
      A.cats4tsPrimitive(),
      A.cats4tsPrimitive(),
      eqOptionPrimitive,
      eqOptionPrimitive,
      eqOptionPrimitive,
    ),
  );

  const tests = MonadSuite(MonadLaws(Option.Monad));
  checkAll(
    'Monad<OptionK>',
    tests.monad(
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.func<[number], number>(fc.integer())),
      A.cats4tsOption(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqOptionPrimitive,
      eqOptionPrimitive,
      eqOptionPrimitive,
      eqOptionPrimitive,
    ),
  );
});
