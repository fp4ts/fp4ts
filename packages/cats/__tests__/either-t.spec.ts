// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import {
  Either,
  EitherT,
  IdentityF,
  Identity,
  Option,
  OptionF,
} from '@fp4ts/cats-core/lib/data';
import {
  BifunctorSuite,
  MonadErrorSuite,
  MonadSuite,
  SemigroupKSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('EitherT', () => {
  describe('Laws', () => {
    const semigroupKTests = SemigroupKSuite(
      EitherT.SemigroupK<IdentityF, string>(Identity.Monad),
    );
    checkAll(
      'SemigroupK<EitherT<IdentityK, string, *>>',
      semigroupKTests.semigroupK(
        fc.integer(),
        Eq.fromUniversalEquals(),
        <X>(arbX: Arbitrary<X>): Arbitrary<EitherT<IdentityF, string, X>> =>
          A.fp4tsEitherT(A.fp4tsEither(fc.string(), arbX)),
        <X>(EqX: Eq<X>): Eq<EitherT<IdentityF, string, X>> =>
          EitherT.Eq(Either.Eq(Eq.fromUniversalEquals(), EqX)),
      ),
    );

    const bifunctorTests = BifunctorSuite(EitherT.Bifunctor(Identity.Functor));
    checkAll(
      'Bifunctor<EitherT<IdentityK, *, *>>',
      bifunctorTests.bifunctor(
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
        ): Arbitrary<EitherT<IdentityF, X, Y>> =>
          A.fp4tsEitherT(A.fp4tsEither(arbX, arbY)),
        <X, Y>(EqX: Eq<X>, EqY: Eq<Y>): Eq<EitherT<IdentityF, X, Y>> =>
          EitherT.Eq(Either.Eq(EqX, EqY)),
      ),
    );

    const bifunctorOptionTests = BifunctorSuite(
      EitherT.Bifunctor(Option.Functor),
    );
    checkAll(
      'Bifunctor<EitherT<OptionK, *, *>>',
      bifunctorOptionTests.bifunctor(
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
          EitherT.Eq(Option.Eq(Either.Eq(EqX, EqY))),
      ),
    );

    const monadOptionTests = MonadSuite(
      EitherT.Monad<OptionF, string>(Option.Monad),
    );
    checkAll(
      'Monad<EitherT<OptionK, string, *>>',
      monadOptionTests.monad(
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
        <X>(EqX: Eq<X>): Eq<EitherT<OptionF, string, X>> =>
          EitherT.Eq(Option.Eq(Either.Eq(Eq.fromUniversalEquals(), EqX))),
      ),
    );

    const monadErrorTests = MonadErrorSuite(
      EitherT.MonadError<IdentityF, string>(Identity.Monad),
    );
    checkAll(
      'Monad<EitherT<IdentityK, string, *>>',
      monadErrorTests.monadError(
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
        <X>(arbX: Arbitrary<X>): Arbitrary<EitherT<IdentityF, string, X>> =>
          A.fp4tsEitherT(A.fp4tsEither(fc.string(), arbX)),
        <X>(EqX: Eq<X>): Eq<EitherT<IdentityF, string, X>> =>
          EitherT.Eq(Either.Eq(Eq.fromUniversalEquals(), EqX)),
      ),
    );
  });
});
