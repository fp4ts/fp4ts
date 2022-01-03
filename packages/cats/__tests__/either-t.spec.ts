// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats-core';
import {
  Either,
  EitherT,
  IdentityK,
  Identity,
  Option,
  OptionK,
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
      EitherT.SemigroupK<IdentityK, string>(Identity.Monad),
    );
    checkAll(
      'SemigroupK<EitherT<IdentityK, string, *>>',
      semigroupKTests.semigroupK(
        fc.integer(),
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<EitherT<IdentityK, string, X>> =>
          A.fp4tsEitherT(A.fp4tsEither(fc.string(), arbX)),
        <X>(EqX: Eq<X>): Eq<EitherT<IdentityK, string, X>> =>
          EitherT.Eq(Either.Eq(Eq.primitive, EqX)),
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
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X, Y>(
          arbX: Arbitrary<X>,
          arbY: Arbitrary<Y>,
        ): Arbitrary<EitherT<IdentityK, X, Y>> =>
          A.fp4tsEitherT(A.fp4tsEither(arbX, arbY)),
        <X, Y>(EqX: Eq<X>, EqY: Eq<Y>): Eq<EitherT<IdentityK, X, Y>> =>
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
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X, Y>(
          arbX: Arbitrary<X>,
          arbY: Arbitrary<Y>,
        ): Arbitrary<EitherT<OptionK, X, Y>> =>
          A.fp4tsEitherT(A.fp4tsOption(A.fp4tsEither(arbX, arbY))),
        <X, Y>(EqX: Eq<X>, EqY: Eq<Y>): Eq<EitherT<OptionK, X, Y>> =>
          EitherT.Eq(Option.Eq(Either.Eq(EqX, EqY))),
      ),
    );

    const monadOptionTests = MonadSuite(
      EitherT.Monad<OptionK, string>(Option.Monad),
    );
    checkAll(
      'Monad<EitherT<OptionK, string, *>>',
      monadOptionTests.monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<EitherT<OptionK, string, X>> =>
          A.fp4tsEitherT(A.fp4tsOption(A.fp4tsEither(fc.string(), arbX))),
        <X>(EqX: Eq<X>): Eq<EitherT<OptionK, string, X>> =>
          EitherT.Eq(Option.Eq(Either.Eq(Eq.primitive, EqX))),
      ),
    );

    const monadErrorTests = MonadErrorSuite(
      EitherT.MonadError<IdentityK, string>(Identity.Monad),
    );
    checkAll(
      'Monad<EitherT<IdentityK, string, *>>',
      monadErrorTests.monadError(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<EitherT<IdentityK, string, X>> =>
          A.fp4tsEitherT(A.fp4tsEither(fc.string(), arbX)),
        <X>(EqX: Eq<X>): Eq<EitherT<IdentityK, string, X>> =>
          EitherT.Eq(Either.Eq(Eq.primitive, EqX)),
      ),
    );
  });
});
