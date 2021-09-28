import fc from 'fast-check';
import { PrimitiveType } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { Either } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { SemigroupKSuite } from '../disciplines/semigroup-k-suite';
import { MonadErrorSuite } from '../disciplines/monad-error-suite';

describe('Either Laws', () => {
  const eqEitherStringPrimitive: Eq<Either<string, PrimitiveType>> = Either.Eq(
    Eq.primitive,
    Eq.primitive,
  );

  const semigroupKTests = SemigroupKSuite(Either.SemigroupK<string>());

  checkAll(
    'SemigroupK<$<EitherK, [string]>>',
    semigroupKTests.semigroupK(
      A.cats4tsEither(fc.string(), A.cats4tsPrimitive()),
      eqEitherStringPrimitive,
    ),
  );

  const tests = MonadErrorSuite(Either.MonadError<string>());
  checkAll(
    'Monad<$<EitherK, [string]>>',
    tests.monadError(
      A.cats4tsEither(fc.string(), fc.integer()),
      A.cats4tsEither(fc.string(), fc.integer()),
      A.cats4tsEither(fc.string(), fc.integer()),
      A.cats4tsEither(fc.string(), fc.integer()),
      A.cats4tsEither(fc.string(), fc.func<[number], number>(fc.integer())),
      A.cats4tsEither(fc.string(), fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.string(),
      eqEitherStringPrimitive,
      eqEitherStringPrimitive,
      eqEitherStringPrimitive,
      Eq.primitive,
      Eq.primitive,
      E => Either.Eq(Eq.primitive, E),
    ),
  );
});
