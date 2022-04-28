// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { List, Option } from '@fp4ts/cats-core/lib/data';
import { State, IndexedState } from '@fp4ts/cats-mtl';
import { MonadSuite } from '@fp4ts/cats-laws';
import { MonadStateSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll, forAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
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
    const listHead: IndexedState<
      List<number>,
      Option<number>,
      void
    > = IndexedState.modify(xs => xs.headOption);
    const getOrElse: IndexedState<
      Option<number>,
      number,
      void
    > = IndexedState.modify(x => x.getOrElse(() => 0));
    const toString: IndexedState<number, string, void> = IndexedState.modify(
      x => x.toString(),
    );

    const composite = listHead.flatMap(() =>
      getOrElse.flatMap(() =>
        toString.flatMap(() => IndexedState.get<string>()),
      ),
    );

    expect(composite.runState(List(1, 2, 3))).toEqual(['1', '1']);
    expect(composite.runState(List.empty)).toEqual(['0', '0']);
  });

  it('should be stack safe', () => {
    const add1: State<number, number> = State(n => [n + 1, n]);

    const ns = List.range(0, 50_000);
    const x = ns.traverse(State.Monad<number>())(() => add1);

    expect(x.runStateS(0)).toBe(50_000);
  });

  describe('IndexedState, State consistency', () => {
    test(
      'pure is consistent',
      forAll(fc.string(), fc.integer(), (s, n) => {
        const state: State<string, number> = State.pure(n);
        const indexedState: State<string, number> = IndexedState.pure(n);

        expect(state.runState(s)).toEqual(indexedState.runState(s));
      }),
    );

    test(
      'get is consistent',
      forAll(fc.string(), fc.integer(), s => {
        const state: State<string, string> = State.get();
        const indexedState: State<string, string> = IndexedState.get<string>();

        expect(state.runState(s)).toEqual(indexedState.runState(s));
      }),
    );

    test(
      'state is consistent',
      forAll(
        fc.string(),
        fc.func<[string], [string, number]>(
          fc.tuple(fc.string(), fc.integer()),
        ),
        (s, f) => {
          const state: State<string, number> = State.state(f);
          const indexedState: State<string, number> = IndexedState.state(f);

          expect(state.runState(s)).toEqual(indexedState.runState(s));
        },
      ),
    );

    test(
      'modify is consistent',
      forAll(fc.string(), fc.func<[string], string>(fc.string()), (s, f) => {
        const state: State<string, void> = State.modify(f);
        const indexedState: State<string, void> = IndexedState.modify(f);

        expect(state.runState(s)).toEqual(indexedState.runState(s));
      }),
    );

    test(
      'replace is consistent',
      forAll(fc.string(), fc.string(), (s0, s1) => {
        const state: State<string, void> = State.replace(s1);
        const indexedState: State<string, void> = IndexedState.replace(s1);

        expect(state.runState(s0)).toEqual(indexedState.runState(s0));
      }),
    );
  });

  it('should support do notation', () => {
    const S = State.Monad<number>();
    const r = S.do(function* (_) {
      yield* _(State.modify(x => x + 1));
      yield* _(State.modify(x => x + 1));
      const result = yield* _(State.get());
      return result;
    });

    expect(r.runState(42)).toEqual([44, 44]);
  });

  describe('state management', () => {
    it('should pull the state to a value', () => {
      expect(
        State.get<number>()
          .map(x => x + 1)
          .runState(42),
      ).toEqual([42, 43]);
    });

    it('should set state from a value', () => {
      expect(
        State.pure<number, number>(42)
          .flatMap(x => State.replace(x))
          .runState(-1),
      ).toEqual([42, undefined]);
    });

    it('should update the state', () => {
      expect(State.modify<number>(x => x + 1).runState(42)).toEqual([
        43,
        undefined,
      ]);
    });

    it('should update the state and return it', () => {
      expect(
        State.modify<number>(x => x + 1)
          .get()
          .runState(42),
      ).toEqual([43, 43]);
    });

    it('should update the state and return a new value', () => {
      expect(
        State.modify<number>(x => x + 1)
          .map(() => 'test')
          .runState(42),
      ).toEqual([43, 'test']);
    });

    // it('should update the state using previous value', () => {
    //   expect(
    //     State.pure<number, number>(42)
    //       .transform(Eval.Functor)(([s, x]) => [s + 1, `${s + x}`])
    //       .run(42).value,
    //   ).toEqual([43, '84']);
    // });

    it('should be stack safe', () => {
      const size = 10_000;
      const loop = (i: number): State<number, void> =>
        i < size
          ? State.modify<number>(j => j + 1)
              .get()
              .flatMap(loop)
          : State.pure(undefined);

      expect(loop(0).runState(0)).toEqual([10_000, undefined]);
    });
  });

  describe('State Laws', () => {
    checkAll(
      'Monad<State<MiniInt, *>>',
      MonadSuite(State.Monad<MiniInt>()).monad(
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        X => A.fp4tsState(A.fp4tsMiniInt(), X),
        <X>(EX: Eq<X>): Eq<State<MiniInt, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), Eq.tuple(MiniInt.Eq, EX)),
            fa => s => fa.runState(s),
          ),
      ),
    );

    checkAll(
      'MonadState<State<MiniInt, *>, MiniInt>',
      MonadStateSuite(State.MonadState<MiniInt>()).monadState(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        X => A.fp4tsState(A.fp4tsMiniInt(), X),
        <X>(EX: Eq<X>): Eq<State<MiniInt, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), Eq.tuple(MiniInt.Eq, EX)),
            fa => s => fa.runState(s),
          ),
      ),
    );
  });

  // describe('IndexedStateT Laws', () => {
  //   const identityMonadTests = MonadSuite(
  //     IndexedStateT.Monad<IdentityF, MiniInt>(Identity.Monad),
  //   );
  //   checkAll(
  //     'Monad<IndexedStateT<IdentityK, MiniInt, MiniInt, *>>',
  //     identityMonadTests.monad(
  //       fc.string(),
  //       fc.string(),
  //       fc.string(),
  //       fc.string(),
  //       Eq.primitive,
  //       Eq.primitive,
  //       Eq.primitive,
  //       Eq.primitive,
  //       <X>(
  //         X: Arbitrary<X>,
  //       ): Arbitrary<IndexedStateT<IdentityF, MiniInt, MiniInt, X>> =>
  //         A.fp4tsIndexedStateT<IdentityF, MiniInt, MiniInt, X>(
  //           fc.func<[MiniInt], Identity<[MiniInt, X]>>(
  //             fc.tuple(A.fp4tsMiniInt(), X),
  //           ),
  //         ),
  //       EX =>
  //         E.indexedStateTEq(ec.miniInt(), MiniInt.Eq, EX, id, Identity.Monad),
  //     ),
  //   );

  //   const bifunctorTests = BifunctorSuite(
  //     IndexedStateT.Bifunctor<IdentityF, MiniInt>(Identity.Monad),
  //   );
  //   checkAll(
  //     'Bifunctor<IndexedStateT<IdentityK, MiniInt, *, *>>',
  //     bifunctorTests.bifunctor(
  //       fc.string(),
  //       fc.integer(),
  //       fc.string(),
  //       fc.integer(),
  //       Eq.primitive,
  //       Eq.primitive,
  //       Eq.primitive,
  //       Eq.primitive,
  //       <X, Y>(
  //         X: Arbitrary<X>,
  //         Y: Arbitrary<Y>,
  //       ): Arbitrary<IndexedStateT<IdentityF, MiniInt, X, Y>> =>
  //         A.fp4tsIndexedStateT<IdentityF, MiniInt, X, Y>(
  //           fc.func<[MiniInt], Identity<[X, Y]>>(fc.tuple(X, Y)),
  //         ),
  //       (EX, EY) => E.indexedStateTEq(ec.miniInt(), EX, EY, id, Identity.Monad),
  //     ),
  //   );

  //   const optionMonadTests = MonadSuite(
  //     IndexedStateT.Monad<OptionF, MiniInt>(Option.Monad),
  //   );
  //   checkAll(
  //     'Monad<IndexedStateT<OptionK, MiniInt, MiniInt, *>>',
  //     optionMonadTests.monad(
  //       fc.string(),
  //       fc.string(),
  //       fc.string(),
  //       fc.string(),
  //       Eq.primitive,
  //       Eq.primitive,
  //       Eq.primitive,
  //       Eq.primitive,
  //       <X>(
  //         X: Arbitrary<X>,
  //       ): Arbitrary<IndexedStateT<OptionF, MiniInt, MiniInt, X>> =>
  //         A.fp4tsIndexedStateT<OptionF, MiniInt, MiniInt, X>(
  //           A.fp4tsOption(
  //             fc.func<[MiniInt], Option<[MiniInt, X]>>(
  //               A.fp4tsOption(fc.tuple(A.fp4tsMiniInt(), X)),
  //             ),
  //           ),
  //         ),
  //       EX =>
  //         E.indexedStateTEq(
  //           ec.miniInt(),
  //           MiniInt.Eq,
  //           EX,
  //           Option.Eq,
  //           Option.Monad,
  //         ),
  //     ),
  //   );

  //   const eitherStringMonadErrorTests = MonadErrorSuite(
  //     IndexedStateT.MonadError<$<EitherF, [string]>, MiniInt, string>(
  //       Either.MonadError<string>(),
  //     ),
  //   );
  //   checkAll(
  //     'MonadError<IndexedStateT<Either<string, *>, MiniInt, MiniInt, *>, string>',
  //     eitherStringMonadErrorTests.monadError(
  //       fc.string(),
  //       fc.string(),
  //       fc.string(),
  //       fc.string(),
  //       fc.string(),
  //       Eq.primitive,
  //       Eq.primitive,
  //       Eq.primitive,
  //       Eq.primitive,
  //       Eq.primitive,
  //       <X>(
  //         X: Arbitrary<X>,
  //       ): Arbitrary<
  //         IndexedStateT<$<EitherF, [string]>, MiniInt, MiniInt, X>
  //       > =>
  //         A.fp4tsIndexedStateT<$<EitherF, [string]>, MiniInt, MiniInt, X>(
  //           A.fp4tsEither(
  //             fc.string(),
  //             fc.func<[MiniInt], Either<string, [MiniInt, X]>>(
  //               A.fp4tsEither(fc.string(), fc.tuple(A.fp4tsMiniInt(), X)),
  //             ),
  //           ),
  //         ),
  //       EX =>
  //         E.indexedStateTEq(
  //           ec.miniInt(),
  //           MiniInt.Eq,
  //           EX,
  //           X => Either.Eq(Eq.primitive, X),
  //           Either.Monad<string>(),
  //         ),
  //     ),
  //   );
  // });
});
