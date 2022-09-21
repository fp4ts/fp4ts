// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, id, Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Eval, EvalF, Monad } from '@fp4ts/cats-core';
import { Identity, Option, EitherF, Either } from '@fp4ts/cats-core/lib/data';
import { IxStateT, StateT } from '@fp4ts/cats-mtl';
import { MonadStateSuite } from '@fp4ts/cats-mtl-laws';
import { MonadErrorSuite, MonadSuite, StrongSuite } from '@fp4ts/cats-laws';
import { checkAll, MiniInt, ExhaustiveCheck } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('IxStateT', () => {
  function runTests<F>(
    [effectName, F]: [string, Monad<F>],
    mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    checkAll(
      `MonadState<StateT<MiniInt, ${effectName}, *>, MiniInt>`,
      MonadStateSuite(StateT.MonadState<MiniInt, F>(F)).monadState(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        <X>(X: Arbitrary<X>): Arbitrary<StateT<MiniInt, F, X>> =>
          A.fp4tsIxStateT(
            fc.func<[MiniInt], Kind<F, [[X, MiniInt]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt())),
            ),
          ),
        <X>(X: Eq<X>): Eq<StateT<MiniInt, F, X>> =>
          eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(X, MiniInt.Eq))),
      ),
    );

    checkAll(
      `Monad<StateT<MiniInt, ${effectName}, *>>`,
      MonadSuite(StateT.Monad<MiniInt, F>(F)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>): Arbitrary<StateT<MiniInt, F, X>> =>
          A.fp4tsIxStateT(
            fc.func<[MiniInt], Kind<F, [[X, MiniInt]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt())),
            ),
          ),
        <X>(X: Eq<X>): Eq<StateT<MiniInt, F, X>> =>
          eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(X, MiniInt.Eq))),
      ),
    );
  }

  describe('stack safety', () => {
    it('right-associative flatMap with Eval', () => {
      const S = StateT.MonadState<number, EvalF>(Eval.Monad);
      const size = 50_000;
      const go: StateT<number, EvalF, void> = S.flatMap_(S.get, n =>
        n >= size ? S.unit : S.flatMap_(S.set(n + 1), () => go),
      );

      expect(StateT.runS(Eval.Monad)(0)(go).value).toBe(size);
    });
  });

  runTests(['Identity', Identity.Monad], id, id);

  runTests(['Eval', Eval.Monad], A.fp4tsEval, Eval.Eq);

  runTests(['Eval', Eval.Monad], A.fp4tsEval, Eval.Eq);

  runTests(['Option', Option.Monad], A.fp4tsOption, Option.Eq);

  checkAll(
    'MonadError<StateT<MiniInt, Either<string, *>, *>>',
    MonadErrorSuite(
      StateT.MonadError<MiniInt, $<EitherF, [string]>, string>(
        Either.MonadError<string>(),
      ),
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
      <X>(
        X: Arbitrary<X>,
      ): Arbitrary<StateT<MiniInt, $<EitherF, [string]>, X>> =>
        fc.func<[MiniInt], Either<string, [X, MiniInt]>>(
          A.fp4tsEither(fc.string(), fc.tuple(X, A.fp4tsMiniInt())),
        ),
      <X>(X: Eq<X>): Eq<StateT<MiniInt, $<EitherF, [string]>, X>> =>
        eq.fn1Eq(
          ec.miniInt(),
          Either.Eq(Eq.fromUniversalEquals(), Eq.tuple(X, MiniInt.Eq)),
        ),
    ),
  );

  checkAll(
    'Strong<IxStateT<number, *, *, Eval, number>>',
    StrongSuite(IxStateT.Strong<EvalF, number>(Eval.Monad)).strong(
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      <X, Y>(
        X: Arbitrary<X>,
        Y: Arbitrary<Y>,
      ): Arbitrary<IxStateT<X, Y, EvalF, number>> =>
        fc.func<[X], Eval<[number, Y]>>(A.fp4tsEval(fc.tuple(fc.integer(), Y))),
      <X, Y>(
        X: ExhaustiveCheck<X>,
        Y: Eq<Y>,
      ): Eq<IxStateT<X, Y, EvalF, number>> =>
        eq.fn1Eq(X, Eval.Eq(Eq.tuple(Eq.fromUniversalEquals(), Y))),
    ),
  );
});
