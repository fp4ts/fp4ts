// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, EvalF, id, Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { Identity, Option, EitherF, Either } from '@fp4ts/cats-core/lib/data';
import { StateT } from '@fp4ts/cats-mtl';
import { MonadStateSuite } from '@fp4ts/cats-mtl-laws';
import { MonadErrorSuite, MonadSuite } from '@fp4ts/cats-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
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
      `MonadState<IxStateT<MiniInt, MiniInt, ${effectName}, *>, MiniInt>`,
      MonadStateSuite(StateT.MonadState<F, MiniInt>(F)).monadState(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        <X>(X: Arbitrary<X>): Arbitrary<StateT<MiniInt, F, X>> =>
          A.fp4tsStateT(
            F,
            fc.func<[MiniInt], Kind<F, [[X, MiniInt]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt())),
            ),
          ),
        <X>(X: Eq<X>): Eq<StateT<MiniInt, F, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(X, MiniInt.Eq))),
            StateT.runAS(F),
          ),
      ),
    );

    checkAll(
      `Monad<IxStateT<MiniInt, ${effectName}, *>>`,
      MonadSuite(StateT.Monad<F, MiniInt>(F)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>): Arbitrary<StateT<MiniInt, F, X>> =>
          A.fp4tsStateT(
            F,
            fc.func<[MiniInt], Kind<F, [[X, MiniInt]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt())),
            ),
          ),
        <X>(X: Eq<X>): Eq<StateT<MiniInt, F, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(X, MiniInt.Eq))),
            StateT.runAS(F),
          ),
      ),
    );
  }

  describe('stack safety', () => {
    it('right-associative flatMap with Eval', () => {
      const S = StateT.MonadState<EvalF, number>(Monad.Eval);
      const size = 50_000;
      const go: StateT<number, EvalF, void> = S.flatMap_(S.get, n =>
        n >= size ? S.unit : S.flatMap_(S.set(n + 1), () => go),
      );

      expect(StateT.runS(Monad.Eval)(go)(0).value).toBe(size);
    });
  });

  runTests(['Identity', Identity.Monad], id, id);

  runTests(['Eval', Monad.Eval], A.fp4tsEval, Eq.Eval);

  runTests(['Eval', Monad.Eval], A.fp4tsEval, Eq.Eval);

  runTests(['Option', Option.Monad], A.fp4tsOption, Option.Eq);

  const EitherSM = Either.MonadError<string>();
  checkAll(
    'MonadError<StateT<MiniInt, Either<string, *>, *>>',
    MonadErrorSuite(
      StateT.MonadError<$<EitherF, [string]>, MiniInt, string>(EitherSM),
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
        A.fp4tsStateT(
          EitherSM,
          fc.func<[MiniInt], Either<string, [X, MiniInt]>>(
            A.fp4tsEither(fc.string(), fc.tuple(X, A.fp4tsMiniInt())),
          ),
        ),
      <X>(X: Eq<X>): Eq<StateT<MiniInt, $<EitherF, [string]>, X>> =>
        Eq.by(
          eq.fn1Eq(
            ec.miniInt(),
            Either.Eq(Eq.fromUniversalEquals(), Eq.tuple(X, MiniInt.Eq)),
          ),
          StateT.runAS(EitherSM),
        ),
    ),
  );
});
