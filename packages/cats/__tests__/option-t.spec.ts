// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $ } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Applicative, CoflatMap } from '@fp4ts/cats-core';
import {
  Identity,
  IdentityF,
  EitherF,
  Some,
  None,
  Option,
  OptionT,
  Either,
  SyntaxK,
} from '@fp4ts/cats-core/lib/data';
import {
  AlternativeSuite,
  CoflatMapSuite,
  MonadErrorSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('OptionT', () => {
  const OptIdF = {
    ...OptionT.Monad(Identity.Monad),
    ...OptionT.Alternative(Identity.Monad),
  };
  const mkSomeS = <A>(a: A) => SyntaxK(OptIdF)(Some(a));
  const mkNoneS = <A = never>() => SyntaxK(OptIdF)(None as Option<A>);

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
        SyntaxK(OptionT.Functor(Identity.Functor), Some(42)).map(x => x * 2)
          .value,
      ).toEqual(Identity(Some(84)));
    });

    it('should do nothing on none', () => {
      expect(
        SyntaxK(OptionT.Functor(Identity.Functor), None).map(x => x * 2).value,
      ).toEqual(Identity(None));
    });
  });

  describe('orElse', () => {
    it('should return left result on Some', () => {
      expect(mkSomeS(42).combineK(() => mkSomeS(43)).value).toEqual(
        Identity(Some(42)),
      );
    });

    it('should return right result on None', () => {
      expect(mkNoneS<number>().combineK(() => mkSomeS(43)).value).toEqual(
        Identity(Some(43)),
      );
    });

    it('should return None when both sides are None', () => {
      expect(mkNoneS().combineK(() => mkNoneS()).value).toEqual(Identity(None));
    });
  });

  describe('orElseF', () => {
    it('should return left result on Some', () => {
      expect(mkSomeS(42).combineKF(() => Identity(Some(43))).value).toEqual(
        Identity(Some(42)),
      );
    });

    it('should return right result on None', () => {
      expect(
        mkNoneS<number>().combineKF(() => Identity(Some(43))).value,
      ).toEqual(Identity(Some(43)));
    });

    it('should return None when both sides are None', () => {
      expect(mkNoneS<number>().combineKF(() => Identity(None)).value).toEqual(
        Identity(None),
      );
    });
  });

  // describe('getOrElse', () => {
  //   it('should return lhs when is Some', () => {
  //     expect(mkSome(42).getOrElse(() => 43)).toEqual(Identity(42));
  //   });

  //   it('should return rhs when is None', () => {
  //     expect(mkNone<number>().getOrElse(() => 43)).toEqual(Identity(43));
  //   });
  // });

  // describe('getOrElseF', () => {
  //   it('should return lhs when is Some', () => {
  //     expect(mkSome(42).getOrElseF(F)(() => Identity(43))).toEqual(
  //       Identity(42),
  //     );
  //   });

  //   it('should return rhs when is None', () => {
  //     expect(mkNoneS<number>().getOrElseF(F)(() => Identity(43))).toEqual(
  //       Identity(43),
  //     );
  //   });
  // });

  describe('flatMap', () => {
    it('should map the wrapped value', () => {
      expect(mkSomeS(42).flatMap(x => mkSomeS(x * 2)).value).toEqual(
        Identity(Some(84)),
      );
    });

    it('should transform into None', () => {
      expect(mkSomeS(42).flatMap(() => mkNoneS()).value).toEqual(
        Identity(None),
      );
    });

    it('should ignore the None', () => {
      expect(mkNoneS<number>().flatMap(x => mkSomeS(x * 2)).value).toEqual(
        Identity(None),
      );
    });
  });

  describe('laws', () => {
    checkAll(
      'Alternative<OptionT<Identity, *>>',
      AlternativeSuite(OptionT.Alternative(Identity.Monad)).alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsOptionT<IdentityF, X>(A.fp4tsOption(arbX)),
        OptionT.EqK(Identity.EqK).liftEq,
      ),
    );

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
