import fc from 'fast-check';
import { PrimitiveType } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { Either } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { MonadSuite } from '../disciplines/monad-suite';
import { MonadLaws } from '../monad-laws';
import { SemigroupKSuite } from '../disciplines/semigroup-k-suite';
import { SemigroupKLaws } from '../semigroup-k-laws';

describe('Either Laws', () => {
  const eqEitherStringPrimitive: Eq<Either<string, PrimitiveType>> = Either.Eq(
    Eq.primitive,
    Eq.primitive,
  );

  const semigroupKTests = SemigroupKSuite(
    SemigroupKLaws(Either.SemigroupK<string>()),
  );

  checkAll(
    'SemigroupK<$<EitherK, [string]>>',
    semigroupKTests.semigroupK(
      A.cats4tsEither(fc.string(), A.cats4tsPrimitive()),
      eqEitherStringPrimitive,
    ),
  );

  const tests = MonadSuite(MonadLaws(Either.Monad<string>()));
  checkAll(
    'Monad<$<EitherK, [string]>>',
    tests.monad(
      A.cats4tsEither(fc.string(), fc.integer()),
      A.cats4tsEither(fc.string(), fc.integer()),
      A.cats4tsEither(fc.string(), fc.integer()),
      A.cats4tsEither(fc.string(), fc.integer()),
      A.cats4tsEither(fc.string(), fc.func<[number], number>(fc.integer())),
      A.cats4tsEither(fc.string(), fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqEitherStringPrimitive,
      eqEitherStringPrimitive,
      eqEitherStringPrimitive,
      eqEitherStringPrimitive,
    ),
  );
});
