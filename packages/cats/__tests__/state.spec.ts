// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, compose, id, pipe } from '@fp4ts/core';
import { Eval, Eq } from '@fp4ts/cats-core';
import {
  Either,
  EitherK,
  List,
  State,
  StateT,
  IndexedStateT,
  IdentityK,
  Identity,
  Option,
  OptionK,
} from '@fp4ts/cats-core/lib/data';
import { BifunctorSuite, MonadErrorSuite, MonadSuite } from '@fp4ts/cats-laws';
import { checkAll, forAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as E from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('State', () => {
  describe('types', () => {
    it('should be covariant in second type parameter', () => {
      const s1: State<number, 1> = State.pure(1 as const);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const s: State<number, number> = s1;
    });
  });

  test('basic usage', () => {
    const listHead: IndexedStateT<
      IdentityK,
      List<number>,
      Option<number>,
      void
    > = IndexedStateT.modify(Identity.Applicative)(xs => xs.headOption);
    const getOrElse: IndexedStateT<
      IdentityK,
      Option<number>,
      number,
      void
    > = IndexedStateT.modify(Identity.Applicative)(x => x.getOrElse(() => 0));
    const toString: IndexedStateT<IdentityK, number, string, void> =
      IndexedStateT.modify(Identity.Applicative)(x => x.toString());

    const composite = listHead.flatMap(Identity.Monad)(() =>
      getOrElse.flatMap(Identity.Monad)(() =>
        toString.flatMap(Identity.Monad)(() =>
          IndexedStateT.get<IdentityK, string>(Identity.Applicative),
        ),
      ),
    );

    expect(composite.run(Identity.Monad)(List(1, 2, 3))).toEqual(['1', '1']);
    expect(composite.run(Identity.Monad)(List.empty)).toEqual(['0', '0']);
  });

  it('should be stack safe', () => {
    const add1: State<number, number> = State(n => [n + 1, n]);

    const ns = List.range(0, 50_000);
    const x = ns.traverse(State.Monad<number>())(() => add1);

    expect(x.runS(Eval.Monad)(0).value).toBe(50_000);
  });

  describe('IndexedStateT, StateT, State consistency', () => {
    test(
      'pure is consistent',
      forAll(fc.string(), fc.integer(), (s, n) => {
        const state: State<string, number> = State.pure(n);
        const stateT: State<string, number> = StateT.pure(Eval.Applicative)(n);
        const indexedStateT: State<string, number> = IndexedStateT.pure(
          Eval.Applicative,
        )(n);

        expect(state.run(s).value).toEqual(stateT.run(s).value);
        expect(state.run(s).value).toEqual(indexedStateT.run(s).value);
        return true;
      }),
    );

    test(
      'get is consistent',
      forAll(fc.string(), fc.integer(), s => {
        const state: State<string, string> = State.get();
        const stateT: State<string, string> = StateT.get(Eval.Applicative);
        const indexedStateT: State<string, string> = IndexedStateT.get(
          Eval.Applicative,
        );

        expect(state.run(s).value).toEqual(stateT.run(s).value);
        expect(state.run(s).value).toEqual(indexedStateT.run(s).value);
        return true;
      }),
    );

    test(
      'inspect is consistent',
      forAll(fc.string(), fc.func<[string], number>(fc.integer()), (s, f) => {
        const state: State<string, number> = State.inspect(f);
        const stateT: State<string, number> = StateT.inspect(Eval.Applicative)(
          f,
        );
        const indexedStateT: State<string, number> = IndexedStateT.inspect(
          Eval.Applicative,
        )(f);

        expect(state.run(s).value).toEqual(stateT.run(s).value);
        expect(state.run(s).value).toEqual(indexedStateT.run(s).value);
        return true;
      }),
    );

    test(
      'inspect and inspectF are consistent',
      forAll(fc.string(), fc.func<[string], number>(fc.integer()), (s, f) => {
        const state: State<string, number> = State.inspect(f);
        const stateT: State<string, number> = StateT.inspectF(Eval.Applicative)(
          compose(Eval.now, f),
        );
        const indexedStateT: State<string, number> = IndexedStateT.inspectF(
          Eval.Applicative,
        )(compose(Eval.now, f));

        expect(state.run(s).value).toEqual(stateT.run(s).value);
        expect(state.run(s).value).toEqual(indexedStateT.run(s).value);
        return true;
      }),
    );

    test(
      'modify is consistent',
      forAll(fc.string(), fc.func<[string], string>(fc.string()), (s, f) => {
        const state: State<string, void> = State.modify(f);
        const stateT: State<string, void> = StateT.modify(Eval.Applicative)(f);
        const indexedStateT: State<string, void> = IndexedStateT.modify(
          Eval.Applicative,
        )(f);

        expect(state.run(s).value).toEqual(stateT.run(s).value);
        expect(state.run(s).value).toEqual(indexedStateT.run(s).value);
        return true;
      }),
    );

    test(
      'modify and modifyF are consistent',
      forAll(fc.string(), fc.func<[string], string>(fc.string()), (s, f) => {
        const state: State<string, void> = State.modify(f);
        const stateT: State<string, void> = StateT.modifyF(Eval.Applicative)(
          compose(Eval.now, f),
        );
        const indexedStateT: State<string, void> = IndexedStateT.modifyF(
          Eval.Applicative,
        )(compose(Eval.now, f));

        expect(state.run(s).value).toEqual(stateT.run(s).value);
        expect(state.run(s).value).toEqual(indexedStateT.run(s).value);
        return true;
      }),
    );

    test(
      'pure and liftF are consistent',
      forAll(fc.string(), fc.integer(), (s, n) => {
        const state: State<string, number> = State.pure(n);
        const stateT: State<string, number> = StateT.liftF(Eval.Applicative)(
          Eval.now(n),
        );
        const indexedStateT: State<string, number> = IndexedStateT.liftF(
          Eval.Applicative,
        )(Eval.now(n));

        expect(state.run(s).value).toEqual(stateT.run(s).value);
        expect(state.run(s).value).toEqual(indexedStateT.run(s).value);
        return true;
      }),
    );

    test(
      'set is consistent',
      forAll(fc.string(), fc.string(), (s0, s1) => {
        const state: State<string, void> = State.set(s1);
        const stateT: State<string, void> = StateT.set(Eval.Applicative)(s1);
        const indexedStateT: State<string, void> = IndexedStateT.set(
          Eval.Applicative,
        )(s1);

        expect(state.run(s0).value).toEqual(stateT.run(s0).value);
        expect(state.run(s0).value).toEqual(indexedStateT.run(s0).value);
        return true;
      }),
    );

    test(
      'set and setF are consistent',
      forAll(fc.string(), fc.string(), (s0, s1) => {
        const state: State<string, void> = State.set(s1);
        const stateT: State<string, void> = StateT.setF(Eval.Applicative)(
          Eval.now(s1),
        );
        const indexedStateT: State<string, void> = IndexedStateT.setF(
          Eval.Applicative,
        )(Eval.now(s1));

        expect(state.run(s0).value).toEqual(stateT.run(s0).value);
        expect(state.run(s0).value).toEqual(indexedStateT.run(s0).value);
        return true;
      }),
    );
  });

  it('should support do notation', () => {
    const S = State.Monad<number>();
    const r = pipe(
      S.Do,
      S.bind(() => State.modify(x => x + 1)),
      S.bind(() => State.modify(x => x + 1)),
      S.productR(State.get()),
    );

    expect(r.run(42).value).toEqual([44, 44]);
  });

  describe('state management', () => {
    it('should pull the state to a value', () => {
      expect(
        State.get<number>()
          .map(x => x + 1)
          .run(42).value,
      ).toEqual([42, 43]);
    });

    it('should set state from a value', () => {
      expect(
        State.pure<number, number>(42)
          .flatMap(x => State.set(x))
          .run(-1).value,
      ).toEqual([42, undefined]);
    });

    it('should update the state', () => {
      expect(State.modify<number>(x => x + 1).run(42).value).toEqual([
        43,
        undefined,
      ]);
    });

    it('should update the state and return it', () => {
      expect(
        State.modify<number>(x => x + 1)
          .get()
          .run(42).value,
      ).toEqual([43, 43]);
    });

    it('should update the state and return a new value', () => {
      expect(
        State.modify<number>(x => x + 1)
          .map(() => 'test')
          .run(42).value,
      ).toEqual([43, 'test']);
    });

    it('should update the state using previous value', () => {
      expect(
        State.pure<number, number>(42)
          .transform(Eval.Functor)(([s, x]) => [s + 1, `${s + x}`])
          .run(42).value,
      ).toEqual([43, '84']);
    });

    it('should be stack safe', () => {
      const size = 10_000;
      const loop = (i: number): State<number, void> =>
        i < size
          ? State.modify<number>(j => j + 1)
              .get()
              .flatMap(loop)
          : State.pure(undefined);

      expect(loop(0).run(0).value).toEqual([10_000, undefined]);
    });
  });

  describe('State Laws', () => {
    const monadTests = MonadSuite(State.Monad<MiniInt>());
    checkAll(
      'Monad<State<MiniInt, *>>',
      monadTests.monad(
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        X => A.fp4tsState(A.fp4tsMiniInt(), X),
        EX => E.stateEq(ec.miniInt(), MiniInt.Eq, EX),
      ),
    );
  });

  describe('IndexedStateT Laws', () => {
    const identityMonadTests = MonadSuite(
      IndexedStateT.Monad<IdentityK, MiniInt>(Identity.Monad),
    );
    checkAll(
      'Monad<IndexedStateT<IdentityK, MiniInt, MiniInt, *>>',
      identityMonadTests.monad(
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<IndexedStateT<IdentityK, MiniInt, MiniInt, X>> =>
          A.fp4tsIndexedStateT<IdentityK, MiniInt, MiniInt, X>(
            fc.func<[MiniInt], Identity<[MiniInt, X]>>(
              fc.tuple(A.fp4tsMiniInt(), X),
            ),
          ),
        EX =>
          E.indexedStateTEq(ec.miniInt(), MiniInt.Eq, EX, id, Identity.Monad),
      ),
    );

    const bifunctorTests = BifunctorSuite(
      IndexedStateT.Bifunctor<IdentityK, MiniInt>(Identity.Monad),
    );
    checkAll(
      'Bifunctor<IndexedStateT<IdentityK, MiniInt, *, *>>',
      bifunctorTests.bifunctor(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X, Y>(
          X: Arbitrary<X>,
          Y: Arbitrary<Y>,
        ): Arbitrary<IndexedStateT<IdentityK, MiniInt, X, Y>> =>
          A.fp4tsIndexedStateT<IdentityK, MiniInt, X, Y>(
            fc.func<[MiniInt], Identity<[X, Y]>>(fc.tuple(X, Y)),
          ),
        (EX, EY) => E.indexedStateTEq(ec.miniInt(), EX, EY, id, Identity.Monad),
      ),
    );

    const optionMonadTests = MonadSuite(
      IndexedStateT.Monad<OptionK, MiniInt>(Option.Monad),
    );
    checkAll(
      'Monad<IndexedStateT<OptionK, MiniInt, MiniInt, *>>',
      optionMonadTests.monad(
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<IndexedStateT<OptionK, MiniInt, MiniInt, X>> =>
          A.fp4tsIndexedStateT<OptionK, MiniInt, MiniInt, X>(
            A.fp4tsOption(
              fc.func<[MiniInt], Option<[MiniInt, X]>>(
                A.fp4tsOption(fc.tuple(A.fp4tsMiniInt(), X)),
              ),
            ),
          ),
        EX =>
          E.indexedStateTEq(
            ec.miniInt(),
            MiniInt.Eq,
            EX,
            Option.Eq,
            Option.Monad,
          ),
      ),
    );

    const eitherStringMonadErrorTests = MonadErrorSuite(
      IndexedStateT.MonadError<$<EitherK, [string]>, MiniInt, string>(
        Either.MonadError<string>(),
      ),
    );
    checkAll(
      'MonadError<IndexedStateT<Either<string, *>, MiniInt, MiniInt, *>, string>',
      eitherStringMonadErrorTests.monadError(
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<
          IndexedStateT<$<EitherK, [string]>, MiniInt, MiniInt, X>
        > =>
          A.fp4tsIndexedStateT<$<EitherK, [string]>, MiniInt, MiniInt, X>(
            A.fp4tsEither(
              fc.string(),
              fc.func<[MiniInt], Either<string, [MiniInt, X]>>(
                A.fp4tsEither(fc.string(), fc.tuple(A.fp4tsMiniInt(), X)),
              ),
            ),
          ),
        EX =>
          E.indexedStateTEq(
            ec.miniInt(),
            MiniInt.Eq,
            EX,
            Option.Eq,
            Option.Monad,
          ),
      ),
    );
  });
});
