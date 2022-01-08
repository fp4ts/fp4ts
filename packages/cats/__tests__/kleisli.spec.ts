// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, id, Kind, throwError } from '@fp4ts/core';
import { FunctionK, Eq } from '@fp4ts/cats-core';
import {
  Identity,
  IdentityK,
  OptionK,
  Some,
  None,
  Option,
  OptionT,
  OptionTK,
  Kleisli,
  ListK,
  List,
  EitherK,
  Either,
} from '@fp4ts/cats-core/lib/data';
import {
  AlternativeSuite,
  ContravariantSuite,
  FunctorFilterSuite,
  MonadErrorSuite,
} from '@fp4ts/cats-laws';
import {
  checkAll,
  fn1Eq,
  MiniInt,
  ExhaustiveCheck,
} from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Kleisli', () => {
  const KleisliId = <A, B>(f: (a: A) => Identity<B>) =>
    Kleisli<IdentityK, A, B>(f);

  const liftId = <A>(a: Identity<A>): Kleisli<IdentityK, unknown, A> =>
    Kleisli.liftF(a);

  describe('types', () => {
    it('should be covariant in output type', () => {
      const r = KleisliId(() => Identity(throwError(new Error('test'))));

      const k: Kleisli<IdentityK, unknown, number> = r;
    });

    it('should disallow unrelated type widening', () => {
      liftId(Identity(42)).dimap(Identity.Functor)(id)(
        // @ts-expect-error
        (f: string) => f,
      );
    });
  });

  describe('map', () => {
    it('should transform the result', () => {
      expect(
        liftId(Identity(42))
          .map(Identity.Functor)(x => x * 2)
          .run(undefined),
      ).toEqual(Identity(84));
    });
  });

  describe('dimap', () => {
    it('should do nothing when ids passed', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .dimap(Identity.Functor)((x: number) => x)(id)
          .run(42),
      ).toEqual(Identity(42));
    });

    it('should modify the input', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .dimap(Identity.Functor)((s: string) => parseInt(s, 10))(id)
          .run('42'),
      ).toEqual(Identity(42));
    });

    it('should modify the output', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .dimap(Identity.Functor)((x: number) => x)(x => `${x}`)
          .run(42),
      ).toEqual(Identity('42'));
    });

    it('should modify both, input and output', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .dimap(Identity.Functor)((inp: string) => parseInt(inp, 10))(
            x => `${x + 1}`,
          )
          .run('42'),
      ).toEqual(Identity('43'));
    });
  });

  describe('adopt', () => {
    it('should modify the input', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .adapt((s: string) => parseInt(s, 10))
          .run('42'),
      ).toEqual(Identity(42));
    });
  });

  describe('adoptF', () => {
    it('should modify the input', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .adaptF(Identity.FlatMap)((s: string) => Identity(parseInt(s, 10)))
          .run('42'),
      ).toEqual(Identity(42));
    });

    it('should return none when adoptF returns none', () => {
      expect(
        Kleisli<OptionK, number, number>((x: number) => Some(x))
          .adaptF(Option.FlatMap)((s: string) => None)
          .run('42'),
      ).toEqual(None);
    });
  });

  describe('andThen', () => {
    it('should compose two kleisli-s', () => {
      const k = KleisliId((x: number) => Identity(x + 1));
      expect(k.andThen(Identity.FlatMap)(k).run(0)).toEqual(Identity(2));
    });

    it('should narrow the result type of the second kleisli', () => {
      const k1 = KleisliId(() => Identity({ x: 1, y: 2 }));
      const k2 = KleisliId(({ x }: { x: number }) => Identity(x));

      expect(
        k1['>=>'](Identity.FlatMap)(k2)
          .map(Identity.Functor)(x => x + 1)
          .run(null),
      ).toEqual(Identity(2));
    });

    it.skip('should be right stack safe', () => {
      const k = KleisliId((x: number) => Identity(x + 1));
      const size = 10_000;
      const loop = (i: number): Kleisli<IdentityK, number, number> => {
        let r: Kleisli<IdentityK, number, number> = KleisliId((x: number) =>
          Identity(x),
        );
        while (i++ < size) r = k['>=>'](Identity.FlatMap)(r);
        return r;
      };

      expect(loop(0).run(0)).toEqual(Identity(size));
    });
  });

  describe('compose', () => {
    it('should compose two kleisli-s', () => {
      const k = KleisliId((x: number) => Identity(x + 1));
      expect(k.compose(Identity.FlatMap)(k).run(0)).toEqual(Identity(2));
    });

    it('should narrow the result type of the second kleisli', () => {
      const k1 = KleisliId(() => Identity({ x: 1, y: 2 }));
      const k2 = KleisliId(({ x }: { x: number }) => Identity(x));

      expect(
        k2['<=<'](Identity.FlatMap)(k1)
          .map(Identity.Functor)(x => x + 1)
          .run(null),
      ).toEqual(Identity(2));
    });

    it.skip('should be left stack safe', () => {
      const k = KleisliId((x: number) => Identity(x + 1));
      const size = 10_000;
      const loop = (i: number): Kleisli<IdentityK, number, number> => {
        let r: Kleisli<IdentityK, number, number> = KleisliId((x: number) =>
          Identity(x),
        );
        while (i++ < size) r = r['<=<'](Identity.FlatMap)(k);
        return r;
      };

      expect(loop(0).run(0)).toEqual(Identity(size));
    });
  });

  describe('flatMap', () => {
    it('should widen the input type', () => {
      const kx = KleisliId(({ x }: { x: number }) => Identity(x));
      const ky = KleisliId(({ y }: { y: number }) => Identity(y));

      expect(
        kx
          .flatMap(Identity.FlatMap)(x => ky.map(Identity.Functor)(y => x + y))
          .run({
            x: 42,
            y: 43,
          }),
      ).toEqual(Identity(85));
    });

    it.skip('should be stack safe', () => {
      const mk = (x: number) => KleisliId(() => Identity(x));
      const size = 10_000;
      const loop = (i: number): Kleisli<IdentityK, unknown, number> =>
        i < size ? mk(i).flatMap(Identity.FlatMap)(i => loop(i + 1)) : mk(i);

      expect(loop(0).run(0)).toEqual(Identity(size));
    });
  });

  describe('flatMapF', () => {
    it('should flat map the wrapped effect', () => {
      const k = KleisliId(({ x }: { x: number }) => Identity(x));

      expect(
        k
          .flatMapF(Identity.FlatMap)(x => Identity(x + 1))
          .run({
            x: 42,
          }),
      ).toEqual(Identity(43));
    });
  });

  describe('flatten', () => {
    it.skip('should be never unless nested', () => {
      // @ts-expect-error
      KleisliId(() => Identity(42)).flatten(Identity.FlatMap);
    });
  });

  describe('ap', () => {
    it('should apply the wrapped function to the value', () => {
      const k = KleisliId(() => Identity((x: number) => x + 1));
      expect(
        k
          .ap(Identity.FlatMap)(KleisliId(() => Identity(42)))
          .run(null),
      ).toEqual(Identity(43));
    });

    it('should do not allow unless a function type', () => {
      const k = KleisliId(() => Identity(42));

      // @ts-expect-error
      k.ap(KleisliId(() => Identity(42)));
    });
  });

  describe('mapK', () => {
    it('should convert Identity context to Option', () => {
      const nt: FunctionK<IdentityK, OptionK> = x => Some(x);

      const k = KleisliId((x: number) => Identity(x))
        .map(Identity.Functor)(x => x + 1)
        .dimap(Identity.Functor)(() => 42)(x => x * 2);

      expect(k.mapK(nt).run(null)).toEqual(Some(86));
    });
  });

  describe('lift', () => {
    it('should lift identity kleisli to option and mapK to OptionT', () => {
      const k = Kleisli<OptionK, number, number>((x: number) => Some(x + 1))
        .map(Option.Functor)(x => x + 1)
        .dimap(Option.Functor)(() => 42)(x => x * 2)
        .lift(Identity.Monad)
        .mapK<OptionTK>(<X>(x: Identity<Option<X>>) =>
          OptionT<IdentityK, X>(x),
        );

      expect(k.run(null)).toEqual(
        OptionT<IdentityK, number>(Identity(Some(88))),
      );
    });
  });

  const eqKleisli = <F, A, B>(
    EA: ExhaustiveCheck<A>,
    EqFB: Eq<Kind<F, [B]>>,
  ): Eq<Kleisli<F, A, B>> => Eq.by(fn1Eq(EA, EqFB), k => x => k.run(x));

  const contravariantTests = ContravariantSuite(
    Kleisli.Contravariant<IdentityK, number>(),
  );
  checkAll(
    'Contravariant<Kleisli<IdentityK, MiniInt, number>>',
    contravariantTests.contravariant(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      <X>(_: Arbitrary<X>) =>
        A.fp4tsKleisli<IdentityK, X, number>(fc.integer()),

      // TODO: hacky? We are not really using the value
      () => eqKleisli(ec.miniInt() as any, Eq.primitive),
    ),
  );

  const functorFilterTests = FunctorFilterSuite(
    Kleisli.FunctorFilter<OptionK, MiniInt>(Option.FunctorFilter),
  );
  checkAll(
    'FunctorFilter<Kleisli<OptionK, MiniInt, number>>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      <X>(x: Arbitrary<X>) =>
        A.fp4tsKleisli<OptionK, MiniInt, X>(A.fp4tsOption(x)),
      <X>(E: Eq<X>) =>
        eqKleisli<OptionK, MiniInt, X>(ec.miniInt(), Option.Eq(E)),
    ),
  );

  const alternativeTests = AlternativeSuite(
    Kleisli.Alternative<ListK, MiniInt>(List.Alternative),
  );
  checkAll(
    'Alternative<Kleisli<ListK, MiniInt, number>>',
    alternativeTests.alternative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      <X>(x: Arbitrary<X>) => A.fp4tsKleisli<ListK, MiniInt, X>(A.fp4tsList(x)),
      <X>(E: Eq<X>) => eqKleisli<ListK, MiniInt, X>(ec.miniInt(), List.Eq(E)),
    ),
  );

  type EitherStringK = $<EitherK, [string]>;
  const monadErrorTests = MonadErrorSuite(
    Kleisli.MonadError<EitherStringK, MiniInt, string>(
      Either.MonadError<string>(),
    ),
  );
  checkAll(
    'MonadError<Kleisli<$<EitherK, [string]>, MiniInt, number>>',
    monadErrorTests.stackUnsafeMonadError(
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
      <X>(x: Arbitrary<X>) =>
        A.fp4tsKleisli<EitherStringK, MiniInt, X>(
          A.fp4tsEither(fc.string(), x),
        ),
      <X>(E: Eq<X>) =>
        eqKleisli<EitherStringK, MiniInt, X>(
          ec.miniInt(),
          Either.Eq(Eq.primitive, E),
        ),
    ),
  );
});
