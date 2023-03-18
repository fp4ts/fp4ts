// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $ } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { CoflatMap, EqK, MonadDefer } from '@fp4ts/cats-core';
import {
  Identity,
  IdentityF,
  EitherF,
  Some,
  None,
  OptionT,
  Either,
} from '@fp4ts/cats-core/lib/data';
import {
  CoflatMapSuite,
  MonadDeferSuite,
  MonadErrorSuite,
  MonadPlusSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('OptionT', () => {
  const F = {
    ...OptionT.Monad(Identity.Monad),
    ...OptionT.Alternative(Identity.Monad),
  };

  describe('type', () => {
    it('should be covariant in A parameter', () => {
      const o: OptionT<IdentityF, number> = OptionT.None(Identity.Applicative);
    });
  });

  describe('constructors', () => {
    it('should create a pure value', () => {
      expect(OptionT.fromNullable(Identity.Applicative)(42)).toEqual(
        Identity(Some(42)),
      );
    });

    it('should create a None from null', () => {
      expect(OptionT.fromNullable(Identity.Applicative)(null)).toEqual(
        Identity(None),
      );
    });

    it('should create a None from undefined', () => {
      expect(OptionT.fromNullable(Identity.Applicative)(undefined)).toEqual(
        Identity(None),
      );
    });

    it('should lift pure value wrapped in an effect', () => {
      expect(OptionT.liftF(Identity.Applicative)(Identity(42))).toEqual(
        Identity(Some(42)),
      );
    });

    test('SomeF not to be empty', () => {
      expect(
        OptionT.nonEmpty(Identity.Functor)(
          OptionT.Some(Identity.Applicative)(42),
        ),
      ).toEqual(Identity(true));
    });

    test('NoneF not to be empty', () => {
      expect(
        OptionT.isEmpty(Identity.Applicative)(
          OptionT.None(Identity.Applicative),
        ),
      ).toEqual(Identity(true));
    });
  });

  describe('map', () => {
    it('should double the wrapped value', () => {
      expect(
        OptionT.Functor(Identity.Functor).map_(Some(42), x => x * 2),
      ).toEqual(Identity(Some(84)));
    });

    it('should do nothing on none', () => {
      expect(OptionT.Functor(Identity.Functor).map_(None, x => x * 2)).toEqual(
        Identity(None),
      );
    });
  });

  describe('orElse', () => {
    it('should return left result on Some', () => {
      expect(F.combineK_(Some(42), Some(43))).toEqual(Some(42));
    });

    it('should return right result on None', () => {
      expect(F.combineK_(None, Some(43))).toEqual(Some(43));
    });

    it('should return None when both sides are None', () => {
      expect(F.combineK_(None, None)).toEqual(None);
    });
  });

  describe('flatMap', () => {
    it('should map the wrapped value', () => {
      expect(F.flatMap_(Some(42), x => Some(x * 2))).toEqual(Some(84));
    });

    it('should transform into None', () => {
      expect(F.flatMap_(Some(42), _ => None)).toEqual(None);
    });

    it('should ignore the None', () => {
      expect(F.flatMap_(None, x => Some(x * 2))).toEqual(None);
    });
  });

  describe('laws', () => {
    checkAll(
      'CoflatMap<OptionT<Either<string, *>>>',
      CoflatMapSuite(
        CoflatMap.fromApplicative(OptionT.Monad(Either.Monad<string>())),
      ).coflatMap(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsOptionT<$<EitherF, [string]>, X>(
            A.fp4tsEither(fc.string(), A.fp4tsOption(arbX)),
          ),
        OptionT.EqK<$<EitherF, [string]>>(Either.EqK(Eq.fromUniversalEquals()))
          .liftEq,
      ),
    );

    checkAll(
      'MonadPlus<OptionT<Eval, *>>',
      MonadPlusSuite(OptionT.MonadPlus(MonadDefer.Eval)).monadPlus(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsOptionT(A.fp4tsEval(A.fp4tsOption(arbX))),
        OptionT.EqK(EqK.Eval).liftEq,
      ),
    );

    checkAll(
      'MonadDefer<OptionT<Eval, *>>',
      MonadDeferSuite(OptionT.MonadDefer(MonadDefer.Eval)).monadDefer(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsOptionT(A.fp4tsEval(A.fp4tsOption(arbX))),
        OptionT.EqK(EqK.Eval).liftEq,
      ),
    );

    checkAll(
      'MonadError<OptionT<Either<string, *>, *>>',
      MonadErrorSuite(
        OptionT.MonadError(Either.MonadError<string>()),
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
          A.fp4tsOptionT<$<EitherF, [string]>, X>(
            A.fp4tsEither(fc.string(), A.fp4tsOption(arbX)),
          ),
        OptionT.EqK<$<EitherF, [string]>>(Either.EqK(Eq.fromUniversalEquals()))
          .liftEq,
      ),
    );
  });
});
