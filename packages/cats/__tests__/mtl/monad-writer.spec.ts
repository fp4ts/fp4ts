// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, EvalF } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { EqK, Monad } from '@fp4ts/cats-core';
import { EitherT, Option, OptionT } from '@fp4ts/cats-core/lib/data';
import { MonadWriter, WriterT, WriterTF } from '@fp4ts/cats-mtl';
import { MonadWriterSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('MonadWriter', () => {
  checkAll(
    'MonadWriter<Kleisli<WriterT<Eval, string, *>, string, *>, string>',
    MonadWriterSuite(
      MonadWriter.Kleisli<$<WriterTF, [EvalF, string]>, MiniInt, string>(
        WriterT.MonadWriter(Monad.Eval, Monoid.string),
      ),
    ).censor(
      fc.integer(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.func(A.fp4tsEval(fc.tuple(X, fc.string()))),
      X =>
        eq.fn1Eq(ec.miniInt(), Eq.Eval(Eq.tuple(X, Eq.fromUniversalEquals()))),
    ),
  );

  checkAll(
    'MonadWriter<OptionT<WriterT<Eval, string, *>, *>, string>',
    MonadWriterSuite(
      MonadWriter.OptionT(WriterT.MonadWriter(Monad.Eval, Monoid.string)),
    ).censor(
      fc.integer(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(
        X: Arbitrary<X>,
      ): Arbitrary<OptionT<$<WriterTF, [EvalF, string]>, X>> =>
        A.fp4tsEval(fc.tuple(A.fp4tsOption(X), fc.string())),
      <X>(X: Eq<X>): Eq<OptionT<$<WriterTF, [EvalF, string]>, X>> =>
        Eq.Eval(Eq.tuple(Option.Eq(X), Eq.fromUniversalEquals())),
    ),
  );

  checkAll(
    'MonadWriter<EitherT<WriterT<Eval, string, *>, string, *>, string>',
    MonadWriterSuite(
      MonadWriter.EitherT<$<WriterTF, [EvalF, string]>, string, string>(
        WriterT.MonadWriter(Monad.Eval, Monoid.string),
      ),
    ).censor(
      fc.integer(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(X: Arbitrary<X>) =>
        A.fp4tsEitherT<$<WriterTF, [EvalF, string]>, string, X>(
          A.fp4tsEval(fc.tuple(A.fp4tsEither(fc.string(), X), fc.string())),
        ),
      EitherT.EqK(
        WriterT.EqK(EqK.Eval, Eq.fromUniversalEquals<string>()),
        Eq.fromUniversalEquals<string>(),
      ).liftEq,
    ),
  );
});
