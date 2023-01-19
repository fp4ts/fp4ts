// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Eval, EvalF, id, Kind, tupled } from '@fp4ts/core';
import { CommutativeMonoid, Eq, Monoid } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { Identity, Option, EitherF, Either } from '@fp4ts/cats-core/lib/data';
import { RWST } from '@fp4ts/cats-mtl';
import {
  MonadReaderSuite,
  MonadStateSuite,
  MonadWriterSuite,
} from '@fp4ts/cats-mtl-laws';
import { MonadErrorSuite, MonadSuite } from '@fp4ts/cats-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('RWST', () => {
  function runTests<F, W>(
    [effectName, F]: [string, Monad<F>],
    [W, WM, arbW, eqW]: [string, Monoid<W>, Arbitrary<W>, Eq<W>],
    mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    checkAll(
      `MonadState<RWST<unknown, ${W}, MiniInt, ${effectName}, *>, MiniInt>`,
      MonadStateSuite(RWST.MonadState<unknown, W, MiniInt, F>(F)).monadState(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        <X>(X: Arbitrary<X>): Arbitrary<RWST<unknown, W, MiniInt, F, X>> =>
          A.fp4tsRWST(
            F,
            fc.func<[unknown, MiniInt, W], Kind<F, [[X, MiniInt, W]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt(), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<unknown, W, MiniInt, F, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(X, MiniInt.Eq, eqW))),
            fa => x => RWST.runASW(F, WM)(fa)(null, x),
          ),
      ),
    );

    checkAll(
      `Censor<RWST<unknown, ${W}, unknown, ${effectName}, *>, ${W}>`,
      MonadWriterSuite(RWST.MonadWriter<unknown, W, unknown, F>(F, WM)).censor(
        fc.integer(),
        arbW,
        Eq.fromUniversalEquals(),
        eqW,
        <X>(X: Arbitrary<X>): Arbitrary<RWST<unknown, W, unknown, F, X>> =>
          A.fp4tsRWST(
            F,
            fc.func<[unknown, unknown], Kind<F, [[X, unknown, W]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt(), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<unknown, W, unknown, F, X>> =>
          Eq.by(mkEqF(Eq.tuple(X, eqW)), fa =>
            F.map_(RWST.runASW(F, WM)(fa)(null, null), ([x, _, w]) =>
              tupled(x, w),
            ),
          ),
      ),
    );

    checkAll(
      `Local<RWST<MiniInt, ${W}, unknown, ${effectName}, *>, MiniInt>`,
      MonadReaderSuite(RWST.MonadReader<MiniInt, W, unknown, F>(F)).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        MiniInt.Eq,
        <X>(X: Arbitrary<X>): Arbitrary<RWST<MiniInt, W, unknown, F, X>> =>
          A.fp4tsRWST(
            F,
            fc.func<[MiniInt, unknown], Kind<F, [[X, unknown, W]]>>(
              mkArbF(fc.tuple(X, fc.constant(undefined), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<MiniInt, W, unknown, F, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), mkEqF(X)),
            fa => r => F.map_(RWST.runASW(F, WM)(fa)(r, null), ([x]) => x),
          ),
      ),
    );

    checkAll(
      `Monad<RWST<MiniInt, ${W}, MiniInt, ${effectName}, *>>`,
      MonadSuite(RWST.Monad<MiniInt, W, MiniInt, F>(F)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>): Arbitrary<RWST<MiniInt, W, MiniInt, F, X>> =>
          A.fp4tsRWST(
            F,
            fc.func<[MiniInt, MiniInt], Kind<F, [[X, MiniInt, W]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt(), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<MiniInt, W, MiniInt, F, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(X, MiniInt.Eq, eqW))),
            fa => s => RWST.runASW(F, WM)(fa)(s, s),
          ),
      ),
    );
  }

  describe('stack safety', () => {
    it('right-associative flatMap with Eval', () => {
      const S = RWST.MonadState<unknown, void, number, EvalF>(Monad.Eval);
      const size = 50_000;
      const go: RWST<unknown, void, number, EvalF, void> = S.flatMap_(
        S.get,
        n => (n >= size ? S.unit : S.flatMap_(S.set(n + 1), () => go)),
      );

      expect(
        RWST.runASW(Monad.Eval, CommutativeMonoid.void)(go)(undefined, 0).value,
      ).toEqual([undefined, size, undefined]);
    });
  });

  runTests(
    ['Identity', Identity.Monad],
    ['string', Monoid.string, fc.string(), Eq.fromUniversalEquals<string>()],
    id,
    id,
  );

  runTests(
    ['Eval', Monad.Eval],
    ['string', Monoid.string, fc.string(), Eq.fromUniversalEquals<string>()],
    A.fp4tsEval,
    Eq.Eval,
  );

  runTests(
    ['Eval', Monad.Eval],
    [
      'number',
      CommutativeMonoid.addition,
      fc.integer(),
      Eq.fromUniversalEquals<number>(),
    ],
    A.fp4tsEval,
    Eq.Eval,
  );

  runTests(
    ['Option', Option.Monad],
    [
      'number',
      CommutativeMonoid.addition,
      fc.integer(),
      Eq.fromUniversalEquals<number>(),
    ],
    A.fp4tsOption,
    Option.Eq,
  );

  checkAll(
    'MonadError<RWST<MiniInt, number, MiniInt, MiniInt, Either<string, *>, *>>',
    MonadErrorSuite(
      RWST.MonadError<MiniInt, number, MiniInt, $<EitherF, [string]>, string>(
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
      ): Arbitrary<RWST<MiniInt, number, MiniInt, $<EitherF, [string]>, X>> =>
        A.fp4tsRWST(
          Either.MonadError<string>(),
          fc.func<[MiniInt, MiniInt], Either<string, [X, MiniInt, number]>>(
            A.fp4tsEither(
              fc.string(),
              fc.tuple(X, A.fp4tsMiniInt(), fc.integer()),
            ),
          ),
        ),
      <X>(
        X: Eq<X>,
      ): Eq<RWST<MiniInt, number, MiniInt, $<EitherF, [string]>, X>> =>
        Eq.by(
          eq.fn1Eq(
            ec.miniInt(),
            Either.Eq(
              Eq.fromUniversalEquals(),
              Eq.tuple(X, MiniInt.Eq, Eq.fromUniversalEquals()),
            ),
          ),
          fa => s =>
            RWST.runASW(Either.MonadError<string>(), Monoid.addition)(fa)(s, s),
        ),
    ),
  );
});
