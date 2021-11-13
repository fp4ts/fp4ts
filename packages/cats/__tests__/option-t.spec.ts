import fc, { Arbitrary } from 'fast-check';
import { $, id } from '@fp4ts/core';
import { FunctionK, Eq } from '@fp4ts/cats-core';
import {
  Identity,
  IdentityK,
  Right,
  EitherK,
  Some,
  None,
  NoneF,
  Option,
  OptionT,
  SomeF,
  Either,
} from '@fp4ts/cats-core/lib/data';
import { AlternativeSuite, MonadErrorSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('OptionT', () => {
  const mkSome = <A>(x: A) => SomeF(Identity.Applicative)(x);
  const mkNone = NoneF(Identity.Applicative);
  const F = Identity.Monad;

  describe('type', () => {
    it('should be covariant in A parameter', () => {
      const o: OptionT<IdentityK, number> = NoneF(Identity.Applicative);
    });
  });

  describe('constructors', () => {
    it('should create a pure value', () => {
      expect(OptionT.fromNullable(Identity.Applicative)(42).value).toEqual(
        Identity(Some(42)),
      );
    });

    it('should create a None from null', () => {
      expect(OptionT.fromNullable(Identity.Applicative)(null).value).toEqual(
        Identity(None),
      );
    });

    it('should create a None from undefined', () => {
      expect(
        OptionT.fromNullable(Identity.Applicative)(undefined).value,
      ).toEqual(Identity(None));
    });

    it('should lift pure value wrapped in an effect', () => {
      expect(OptionT.liftF(Identity.Applicative)(Identity(42)).value).toEqual(
        Identity(Some(42)),
      );
    });

    test('SomeF not to be empty', () => {
      expect(
        SomeF(Identity.Applicative)(42).nonEmpty(Identity.Functor),
      ).toEqual(Identity(true));
    });

    test('NoneF not to be empty', () => {
      expect(NoneF(Identity.Applicative).isEmpty(Identity.Functor)).toEqual(
        Identity(true),
      );
    });
  });

  describe('map', () => {
    it('should double the wrapped value', () => {
      expect(mkSome(42).map(Identity.Functor)(x => x * 2).value).toEqual(
        Identity(Some(84)),
      );
    });

    it('should do nothing on none', () => {
      expect(mkNone.map(Identity.Functor)(x => x * 2).value).toEqual(
        Identity(None),
      );
    });
  });

  describe('orElse', () => {
    it('should return left result on Some', () => {
      expect(mkSome(42).orElse(F)(() => mkSome(43)).value).toEqual(
        Identity(Some(42)),
      );
    });

    it('should return right result on None', () => {
      expect(mkNone.orElse(F)(() => mkSome(43)).value).toEqual(
        Identity(Some(43)),
      );
    });

    it('should return None when both sides are None', () => {
      expect(mkNone.orElse(F)(() => mkNone).value).toEqual(Identity(None));
    });
  });

  describe('orElseF', () => {
    it('should return left result on Some', () => {
      expect(mkSome(42).orElseF(F)(() => Identity(Some(43))).value).toEqual(
        Identity(Some(42)),
      );
    });

    it('should return right result on None', () => {
      expect(mkNone.orElseF(F)(() => Identity(Some(43))).value).toEqual(
        Identity(Some(43)),
      );
    });

    it('should return None when both sides are None', () => {
      expect(mkNone.orElseF(F)(() => Identity(None)).value).toEqual(
        Identity(None),
      );
    });
  });

  describe('getOrElse', () => {
    it('should return lhs when is Some', () => {
      expect(mkSome(42).getOrElse(F)(() => 43)).toEqual(Identity(42));
    });

    it('should return rhs when is None', () => {
      expect(mkNone.getOrElse(F)(() => 43)).toEqual(Identity(43));
    });
  });

  describe('getOrElseF', () => {
    it('should return lhs when is Some', () => {
      expect(mkSome(42).getOrElseF(F)(() => Identity(43))).toEqual(
        Identity(42),
      );
    });

    it('should return rhs when is None', () => {
      expect(mkNone.getOrElseF(F)(() => Identity(43))).toEqual(Identity(43));
    });
  });

  describe('flatMap', () => {
    it('should map the wrapped value', () => {
      expect(mkSome(42).flatMap(F)(x => mkSome(x * 2)).value).toEqual(
        Identity(Some(84)),
      );
    });

    it('should transform into None', () => {
      expect(mkSome(42).flatMap(F)(() => mkNone).value).toEqual(Identity(None));
    });

    it('should ignore the None', () => {
      expect(mkNone.flatMap(F)(x => mkSome(x * 2)).value).toEqual(
        Identity(None),
      );
    });
  });

  describe('flatten', () => {
    it('should flatten the nested value', () => {
      expect(mkSome(mkSome(42)).flatten(F).value).toEqual(Identity(Some(42)));
    });

    it('should flatten to None', () => {
      expect(mkSome(mkNone).flatten(F).value).toEqual(Identity(None));
    });
  });

  describe('mapK', () => {
    it('should do nothing when mapping over identity', () => {
      expect(mkSome(42).mapK<IdentityK>(id)).toEqual(mkSome(42));
    });

    it('should change context to Either<string, *>', () => {
      const nt: FunctionK<IdentityK, $<EitherK, [string]>> = fa => Right(fa);

      expect(mkSome(42).mapK(nt).value).toEqual(Right(Some(42)));
    });
  });

  describe('laws', () => {
    const alternativeTests = AlternativeSuite(
      OptionT.Alternative(Identity.Monad),
    );
    checkAll(
      'Alternative<$<OptionTK, [IdentityK]>',
      alternativeTests.alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsOptionT<IdentityK, X>(A.fp4tsOption(arbX)),
        <X>(eqX: Eq<X>) => OptionT.Eq<IdentityK, X>(Option.Eq(eqX)),
      ),
    );

    const monadErrorTests = MonadErrorSuite(
      OptionT.MonadError(Either.MonadError<string>()),
    );
    checkAll(
      'MonadError<$<OptionTK, [$<EitherK, [string]>]>',
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
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsOptionT<$<EitherK, [string]>, X>(
            A.fp4tsEither(fc.string(), A.fp4tsOption(arbX)),
          ),
        <X>(eqX: Eq<X>) =>
          OptionT.Eq<$<EitherK, [string]>, X>(
            Either.Eq(Eq.primitive, Option.Eq(eqX)),
          ),
      ),
    );
  });
});
