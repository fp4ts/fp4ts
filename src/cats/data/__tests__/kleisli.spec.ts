import { id, throwError } from '../../../core';
import { Identity, IdentityK } from '../identity';
import { OptionK, Some, None, Option } from '../option';
import { Kleisli } from '../kleisli';

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
      liftId(Identity(42)).dimap(id)(
        // @ts-expect-error
        (f: string) => f,
      );
    });
  });

  describe('map', () => {
    it('should transform the result', () => {
      expect(
        liftId(Identity(42))
          .map(x => x * 2)
          .run(Identity.Monad)(undefined),
      ).toEqual(Identity(84));
    });
  });

  describe('dimap', () => {
    it('should do nothing when ids passed', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .dimap((x: number) => x)(id)
          .run(Identity.Monad)(42),
      ).toEqual(Identity(42));
    });

    it('should modify the input', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .dimap((s: string) => parseInt(s, 10))(id)
          .run(Identity.Monad)('42'),
      ).toEqual(Identity(42));
    });

    it('should modify the output', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .dimap((x: number) => x)(x => `${x}`)
          .run(Identity.Monad)(42),
      ).toEqual(Identity('42'));
    });

    it('should modify both, input and output', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .dimap((inp: string) => parseInt(inp, 10))(x => `${x + 1}`)
          .run(Identity.Monad)('42'),
      ).toEqual(Identity('43'));
    });
  });

  describe('adopt', () => {
    it('should modify the input', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .adapt((s: string) => parseInt(s, 10))
          .run(Identity.Monad)('42'),
      ).toEqual(Identity(42));
    });
  });

  describe('adoptF', () => {
    it('should modify the input', () => {
      expect(
        KleisliId((x: number) => Identity(x))
          .adaptF((s: string) => Identity(parseInt(s, 10)))
          .run(Identity.Monad)('42'),
      ).toEqual(Identity(42));
    });

    it('should return none when adoptF returns none', () => {
      expect(
        Kleisli<OptionK, number, number>((x: number) => Some(x))
          .adaptF((s: string) => None)
          .run(Option.Monad)('42'),
      ).toEqual(None);
    });
  });

  describe('andThen', () => {
    it('should compose two kleisli-s', () => {
      const k = KleisliId((x: number) => Identity(x + 1));
      expect(k.andThen(k).run(Identity.Monad)(0)).toEqual(Identity(2));
    });

    it('should narrow the result type of the second kleisli', () => {
      const k1 = KleisliId(() => Identity({ x: 1, y: 2 }));
      const k2 = KleisliId(({ x }: { x: number }) => Identity(x));

      expect(
        k1['>=>'](k2)
          .map(x => x + 1)
          .run(Identity.Monad)(null),
      ).toEqual(Identity(2));
    });

    // TODO: Fix?
    it.skip('should be left stack safe', () => {
      const k = KleisliId((x: number) => Identity(x + 1));
      const size = 10_000;
      const loop = (i: number): Kleisli<IdentityK, number, number> => {
        let r: Kleisli<IdentityK, number, number> = KleisliId((x: number) =>
          Identity(x),
        );
        while (i++ < size) r = r['>=>'](k);
        return r;
      };

      expect(loop(0).run(Identity.Monad)(0)).toEqual(Identity(size));
    });

    it('should be right stack safe', () => {
      const k = KleisliId((x: number) => Identity(x + 1));
      const size = 10_000;
      const loop = (i: number): Kleisli<IdentityK, number, number> => {
        let r: Kleisli<IdentityK, number, number> = KleisliId((x: number) =>
          Identity(x),
        );
        while (i++ < size) r = k['>=>'](r);
        return r;
      };

      expect(loop(0).run(Identity.Monad)(0)).toEqual(Identity(size));
    });
  });

  describe('compose', () => {
    it('should compose two kleisli-s', () => {
      const k = KleisliId((x: number) => Identity(x + 1));
      expect(k.compose(k).run(Identity.Monad)(0)).toEqual(Identity(2));
    });

    it('should narrow the result type of the second kleisli', () => {
      const k1 = KleisliId(() => Identity({ x: 1, y: 2 }));
      const k2 = KleisliId(({ x }: { x: number }) => Identity(x));

      expect(
        k2['<=<'](k1)
          .map(x => x + 1)
          .run(Identity.Monad)(null),
      ).toEqual(Identity(2));
    });

    it('should be left stack safe', () => {
      const k = KleisliId((x: number) => Identity(x + 1));
      const size = 10_000;
      const loop = (i: number): Kleisli<IdentityK, number, number> => {
        let r: Kleisli<IdentityK, number, number> = KleisliId((x: number) =>
          Identity(x),
        );
        while (i++ < size) r = r['<=<'](k);
        return r;
      };

      expect(loop(0).run(Identity.Monad)(0)).toEqual(Identity(size));
    });
  });

  describe('flatMap', () => {
    it('should widen the input type', () => {
      const kx = KleisliId(({ x }: { x: number }) => Identity(x));
      const ky = KleisliId(({ y }: { y: number }) => Identity(y));

      expect(
        kx.flatMap(x => ky.map(y => x + y)).run(Identity.Monad)({
          x: 42,
          y: 43,
        }),
      ).toEqual(Identity(85));
    });

    it('should be stack safe', () => {
      const mk = (x: number) => KleisliId(() => Identity(x));
      const size = 10_000;
      const loop = (i: number): Kleisli<IdentityK, unknown, number> =>
        i < size ? mk(i).flatMap(i => loop(i + 1)) : mk(i);

      expect(loop(0).run(Identity.Monad)(0)).toEqual(Identity(size));
    });
  });

  describe('flatMapF', () => {
    it('should flat map the wrapped effect', () => {
      const k = KleisliId(({ x }: { x: number }) => Identity(x));

      expect(
        k.flatMapF(x => Identity(x + 1)).run(Identity.Monad)({
          x: 42,
        }),
      ).toEqual(Identity(43));
    });
  });

  describe('flatten', () => {
    it('should be never unless nested', () => {
      const a: never = KleisliId(() => Identity(42)).flatten;
    });
  });

  describe('ap', () => {
    it('should apply the wrapped function to the value', () => {
      const k = KleisliId(() => Identity((x: number) => x + 1));
      expect(
        k.ap(KleisliId(() => Identity(42))).run(Identity.Monad)(null),
      ).toEqual(Identity(43));
    });

    it('should do not allow unless a function type', () => {
      const k = KleisliId(() => Identity(42));

      // @ts-expect-error
      k.ap(KleisliId(() => Identity(42)));
    });
  });
});
