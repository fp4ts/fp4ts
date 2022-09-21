// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { List, Option } from '@fp4ts/cats-core/lib/data';
import { State, IxState } from '@fp4ts/cats-mtl';
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
      const s: State<number, number> = s1;
    });
  });

  test('basic usage', () => {
    const listHead = IxState.modify((xs: List<number>) => xs.headOption);
    const getOrElse = IxState.modify((x: Option<number>) =>
      x.getOrElse(() => 0),
    );
    const toString = IxState.modify((x: number) => x.toString());

    const composite = listHead.flatMap(() =>
      getOrElse.flatMap(() => toString.flatMap(() => IxState.get<string>())),
    );

    expect(composite.runState(List(1, 2, 3))).toEqual(['1', '1']);
    expect(composite.runState(List.empty)).toEqual(['0', '0']);
  });

  describe('traverse', () => {
    it('should be stack safe', () => {
      const size = 50_000;
      const add1 = State((n: number) => [n, n + 1]);

      const ns = List.range(0, size);
      const x = ns.traverse(State.Monad<number>())(() => add1);

      expect(x.runStateS(0)).toBe(size);
      expect(x.map(xs => xs.size).runStateA(0)).toBe(size);
    });
  });

  describe('IxState, State consistency', () => {
    test(
      'pure is consistent',
      forAll(fc.string(), fc.integer(), (s, n) => {
        const state: State<string, number> = State.pure(n);
        const ixState: State<string, number> = IxState.pure(n);

        expect(state.runState(s)).toEqual(ixState.runState(s));
      }),
    );

    test(
      'get is consistent',
      forAll(fc.string(), fc.integer(), s => {
        const state: State<string, string> = State.get();
        const ixState: State<string, string> = IxState.get<string>();

        expect(state.runState(s)).toEqual(ixState.runState(s));
      }),
    );

    test(
      'state is consistent',
      forAll(
        fc.string(),
        fc.func<[string], [number, string]>(
          fc.tuple(fc.integer(), fc.string()),
        ),
        (s, f) => {
          const state: State<string, number> = State.state(f);
          const ixState: State<string, number> = IxState.state(f);

          expect(state.runState(s)).toEqual(ixState.runState(s));
        },
      ),
    );

    test(
      'modify is consistent',
      forAll(fc.string(), fc.func<[string], string>(fc.string()), (s, f) => {
        const state: State<string, void> = State.modify(f);
        const ixState: State<string, void> = IxState.modify(f);

        expect(state.runState(s)).toEqual(ixState.runState(s));
      }),
    );

    test(
      'set is consistent',
      forAll(fc.string(), fc.string(), (s0, s1) => {
        const state: State<string, void> = State.set(s1);
        const ixState: State<string, void> = IxState.set(s1);

        expect(state.runState(s0)).toEqual(ixState.runState(s0));
      }),
    );
  });

  it('should support do notation', () => {
    const r = State.Monad<number>().do(function* (_) {
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
      ).toEqual([43, 42]);
    });

    it('should set state from a value', () => {
      expect(
        State.pure<number, number>(42)
          .flatMap(x => State.set(x))
          .runState(-1),
      ).toEqual([undefined, 42]);
    });

    it('should update the state', () => {
      expect(State.modify<number>(x => x + 1).runState(42)).toEqual([
        undefined,
        43,
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
      ).toEqual(['test', 43]);
    });

    it('should be stack safe', () => {
      const size = 50_000;
      const loop = (i: number): State<number, void> =>
        i < size
          ? State.modify<number>(j => j + 1)
              .get()
              .flatMap(loop)
          : State.pure(undefined);

      expect(loop(0).runState(0)).toEqual([undefined, size]);
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
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => A.fp4tsState(A.fp4tsMiniInt(), X),
        <X>(EX: Eq<X>): Eq<State<MiniInt, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), Eq.tuple(EX, MiniInt.Eq)),
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
            eq.fn1Eq(ec.miniInt(), Eq.tuple(EX, MiniInt.Eq)),
            fa => s => fa.runState(s),
          ),
      ),
    );
  });
});
