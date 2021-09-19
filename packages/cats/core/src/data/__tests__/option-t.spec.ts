import { $, id } from '@cats4ts/core';
import { FunctionK } from '../../function-k';

import { Identity, IdentityK } from '../identity';
import { Right, EitherK } from '../either';
import { Some, None } from '../option';

import { NoneF, OptionT, SomeF } from '../option-t';

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
      expect(mkSome(42).orElse(F)(mkSome(43)).value).toEqual(
        Identity(Some(42)),
      );
    });

    it('should return right result on None', () => {
      expect(mkNone.orElse(F)(mkSome(43)).value).toEqual(Identity(Some(43)));
    });

    it('should return None when both sides are None', () => {
      expect(mkNone.orElse(F)(mkNone).value).toEqual(Identity(None));
    });
  });

  describe('orElseF', () => {
    it('should return left result on Some', () => {
      expect(mkSome(42).orElseF(F)(Identity(Some(43))).value).toEqual(
        Identity(Some(42)),
      );
    });

    it('should return right result on None', () => {
      expect(mkNone.orElseF(F)(Identity(Some(43))).value).toEqual(
        Identity(Some(43)),
      );
    });

    it('should return None when both sides are None', () => {
      expect(mkNone.orElseF(F)(Identity(None)).value).toEqual(Identity(None));
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
      expect(mkSome(42).mapK(id)).toEqual(mkSome(42));
    });

    it('should change context to Either<string, *>', () => {
      const nt: FunctionK<IdentityK, $<EitherK, [string]>> = fa =>
        Right(fa.get);

      expect(mkSome(42).mapK(nt).value).toEqual(Right(Some(42)));
    });
  });

  describe('monad', () => {
    it('should a pure value', () => {
      expect(OptionT.pure(F)(42)).toEqual(SomeF(F)(42));
    });

    test('lest identity', () => {
      const h = (x: number): OptionT<IdentityK, number> =>
        OptionT.pure(F)(x * 2);
      expect(OptionT.pure(F)(42).flatMap(F)(h)).toEqual(h(42));
    });

    test('right identity', () => {
      expect(OptionT.pure(F)(42).flatMap(F)(OptionT.pure(F))).toEqual(
        OptionT.pure(F)(42),
      );
    });

    test('associativity', () => {
      const h = (n: number): OptionT<IdentityK, number> =>
        OptionT.pure(F)(n * 2);
      const g = (n: number): OptionT<IdentityK, number> => OptionT.pure(F)(n);
      const m = OptionT.pure(F)(42);
      expect(m.flatMap(F)(h).flatMap(F)(g)).toEqual(
        m.flatMap(F)(x => h(x).flatMap(F)(g)),
      );
    });
  });
});
