// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { EvalF } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { EqK, MonadDefer } from '@fp4ts/cats-core';
import {
  EitherT,
  IdentityF,
  Identity,
  Option,
  OptionF,
} from '@fp4ts/cats-core/lib/data';
import {
  BifunctorSuite,
  MonadDeferSuite,
  MonadErrorSuite,
  MonadSuite,
  SemigroupKSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('EitherT', () => {
  describe('Laws', () => {
    checkAll(
      'SemigroupK<EitherT<Identity, string, *>>',
      SemigroupKSuite(
        EitherT.SemigroupK<IdentityF, string>(Identity.Monad),
      ).semigroupK(
        fc.integer(),
        Eq.fromUniversalEquals(),
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsEitherT<IdentityF, string, X>(
            A.fp4tsEither(fc.string(), arbX),
          ),
        EitherT.EqK(Identity.EqK, Eq.fromUniversalEquals<string>()).liftEq,
      ),
    );

    checkAll(
      'Bifunctor<EitherT<Identity, *, *>>',
      BifunctorSuite(EitherT.Bifunctor(Identity.Functor)).bifunctor(
        fc.integer(),
        fc.string(),
        fc.integer(),
        fc.string(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X, Y>(arbX: Arbitrary<X>, arbY: Arbitrary<Y>) =>
          A.fp4tsEitherT<IdentityF, X, Y>(A.fp4tsEither(arbX, arbY)),
        <X, Y>(EqX: Eq<X>, EqY: Eq<Y>): Eq<EitherT<IdentityF, X, Y>> =>
          EitherT.EqK(Identity.EqK, EqX).liftEq(EqY),
      ),
    );

    checkAll(
      'Bifunctor<EitherT<Option, *, *>>',
      BifunctorSuite(EitherT.Bifunctor(Option.Functor)).bifunctor(
        fc.integer(),
        fc.string(),
        fc.integer(),
        fc.string(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X, Y>(
          arbX: Arbitrary<X>,
          arbY: Arbitrary<Y>,
        ): Arbitrary<EitherT<OptionF, X, Y>> =>
          A.fp4tsEitherT(A.fp4tsOption(A.fp4tsEither(arbX, arbY))),
        <X, Y>(EqX: Eq<X>, EqY: Eq<Y>): Eq<EitherT<OptionF, X, Y>> =>
          EitherT.EqK(Option.EqK, EqX).liftEq(EqY),
      ),
    );

    checkAll(
      'Monad<EitherT<Option, string, *>>',
      MonadSuite(EitherT.Monad<OptionF, string>(Option.Monad)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(arbX: Arbitrary<X>): Arbitrary<EitherT<OptionF, string, X>> =>
          A.fp4tsEitherT(A.fp4tsOption(A.fp4tsEither(fc.string(), arbX))),
        EitherT.EqK(Option.EqK, Eq.fromUniversalEquals<string>()).liftEq,
      ),
    );

    checkAll(
      'MonadDefer<EitherT<Eval, string, *>>',
      MonadDeferSuite(
        EitherT.MonadDefer<EvalF, string>(MonadDefer.Eval),
      ).monadDefer(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(arbX: Arbitrary<X>): Arbitrary<EitherT<EvalF, string, X>> =>
          A.fp4tsEitherT(A.fp4tsEval(A.fp4tsEither(fc.string(), arbX))),
        EitherT.EqK(EqK.Eval, Eq.fromUniversalEquals<string>()).liftEq,
      ),
    );

    checkAll(
      'Monad<EitherT<Identity, string, *>>',
      MonadErrorSuite(
        EitherT.MonadError<IdentityF, string>(Identity.Monad),
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
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsEitherT<IdentityF, string, X>(
            A.fp4tsEither(fc.string(), arbX),
          ),
        EitherT.EqK(Identity.EqK, Eq.fromUniversalEquals<string>()).liftEq,
      ),
    );
  });
});
