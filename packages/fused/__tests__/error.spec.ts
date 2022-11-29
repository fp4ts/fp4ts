// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { $ } from '@fp4ts/core';
import {
  Either,
  EitherF,
  EitherTF,
  Eq,
  Eval,
  EvalF,
  IdentityF,
} from '@fp4ts/cats';
import { Error } from '@fp4ts/fused-core';
import { Algebra } from '@fp4ts/fused-kernel';
import { ErrorC } from '@fp4ts/fused-std';
import { checkAll } from '@fp4ts/cats-test-kit';
import { MonadErrorSuite } from '@fp4ts/cats-laws';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('ErrorC', () => {
  checkAll(
    'MonadError<Either<string, *>>',
    MonadErrorSuite(
      Error.MonadError<string, $<EitherF, [string]>>(ErrorC.Either()),
    ).monadError(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => A.fp4tsEither(fc.string(), X),
      X => Either.Eq(Eq.fromUniversalEquals(), X),
    ),
  );

  checkAll(
    'MonadError<EitherT<Identity, string, *>>',
    MonadErrorSuite(
      Error.MonadError<string, $<EitherTF, [IdentityF, string]>>(
        ErrorC.EitherT(Algebra.Id),
      ),
    ).monadError(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => A.fp4tsEither(fc.string(), X),
      X => Either.Eq(Eq.fromUniversalEquals(), X),
    ),
  );

  checkAll(
    'MonadError<EitherT<Eval, string, *>>',
    MonadErrorSuite(
      Error.MonadError<string, $<EitherTF, [EvalF, string]>>(
        ErrorC.EitherT(Algebra.Eval),
      ),
    ).monadError(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => A.fp4tsEval(A.fp4tsEither(fc.string(), X)),
      X => Eval.Eq(Either.Eq(Eq.fromUniversalEquals(), X)),
    ),
  );
});
