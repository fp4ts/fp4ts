// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, id, Kind } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Eval, EvalF, Monad } from '@fp4ts/cats-core';
import { Identity, Option, EitherF, Either } from '@fp4ts/cats-core/lib/data';
import { IxRWST, RWST } from '@fp4ts/cats-mtl';
import {
  MonadReaderSuite,
  MonadStateSuite,
  MonadWriterSuite,
} from '@fp4ts/cats-mtl-laws';
import { MonadErrorSuite, MonadSuite, StrongSuite } from '@fp4ts/cats-laws';
import { checkAll, MiniInt, ExhaustiveCheck } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('IxRWST', () => {
  function runTests<F, W>(
    [effectName, F]: [string, Monad<F>],
    [W, WM, arbW, eqW]: [string, Monoid<W>, Arbitrary<W>, Eq<W>],
    mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    checkAll(
      `MonadState<RWST<unknown, ${W}, MiniInt, ${effectName}, *>, MiniInt>`,
      MonadStateSuite(
        RWST.MonadState<unknown, W, MiniInt, F>(WM, F),
      ).monadState(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        <X>(X: Arbitrary<X>): Arbitrary<RWST<unknown, W, MiniInt, F, X>> =>
          A.fp4tsIxRWST(
            fc.func<[unknown, MiniInt], Kind<F, [[X, MiniInt, W]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt(), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<unknown, W, MiniInt, F, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(X, MiniInt.Eq))),
            fa => x => RWST.runAS(F)(null, x)(fa),
          ),
      ),
    );

    checkAll(
      `Censor<RWST<unknown, ${W}, unknown, ${effectName}, *>, ${W}>`,
      MonadWriterSuite(RWST.MonadWriter<unknown, W, unknown, F>(WM, F)).censor(
        fc.integer(),
        arbW,
        Eq.primitive,
        eqW,
        <X>(X: Arbitrary<X>): Arbitrary<RWST<unknown, W, unknown, F, X>> =>
          A.fp4tsIxRWST(
            fc.func<[unknown, unknown], Kind<F, [[X, unknown, W]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt(), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<unknown, W, unknown, F, X>> =>
          Eq.by(mkEqF(Eq.tuple(X, eqW)), fa => RWST.runAW(F)(null, null)(fa)),
      ),
    );

    checkAll(
      `Local<RWST<MiniInt, ${W}, unknown, ${effectName}, *>, MiniInt>`,
      MonadReaderSuite(RWST.MonadReader<MiniInt, W, unknown, F>(WM, F)).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.primitive,
        Eq.primitive,
        MiniInt.Eq,
        <X>(X: Arbitrary<X>): Arbitrary<RWST<MiniInt, W, unknown, F, X>> =>
          A.fp4tsIxRWST(
            fc.func<[MiniInt, unknown], Kind<F, [[X, unknown, W]]>>(
              mkArbF(fc.tuple(X, fc.constant(undefined), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<MiniInt, W, unknown, F, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), mkEqF(X)),
            fa => r => RWST.runA(F)(r, null)(fa),
          ),
      ),
    );

    checkAll(
      `Monad<RWST<MiniInt, ${W}, MiniInt, ${effectName}, *>>`,
      MonadSuite(RWST.Monad<MiniInt, W, MiniInt, F>(WM, F)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(X: Arbitrary<X>): Arbitrary<RWST<MiniInt, W, MiniInt, F, X>> =>
          A.fp4tsIxRWST(
            fc.func<[MiniInt, MiniInt], Kind<F, [[X, MiniInt, W]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt(), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<MiniInt, W, MiniInt, F, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(X, MiniInt.Eq, eqW))),
            fa => s => fa(s, s),
          ),
      ),
    );
  }

  describe('stack safety', () => {
    it('right-associative flatMap with Eval', () => {
      const S = RWST.MonadState<unknown, void, number, EvalF>(
        Monoid.first(undefined as void),
        Eval.Monad,
      );
      const size = 50_000;
      const go: RWST<unknown, void, number, EvalF, void> = S.flatMap_(
        S.get,
        n => (n >= size ? S.unit : S.flatMap_(S.set(n + 1), () => go)),
      );

      expect(RWST.runS(Eval.Monad)(undefined, 0)(go).value).toBe(size);
    });
  });

  runTests(
    ['Identity', Identity.Monad],
    ['string', Monoid.string, fc.string(), Eq.fromUniversalEquals<string>()],
    id,
    id,
  );

  runTests(
    ['Eval', Eval.Monad],
    ['string', Monoid.string, fc.string(), Eq.fromUniversalEquals<string>()],
    A.fp4tsEval,
    Eval.Eq,
  );

  runTests(
    ['Eval', Eval.Monad],
    ['number', Monoid.addition, fc.integer(), Eq.fromUniversalEquals<number>()],
    A.fp4tsEval,
    Eval.Eq,
  );

  runTests(
    ['Option', Option.Monad],
    ['number', Monoid.addition, fc.integer(), Eq.fromUniversalEquals<number>()],
    A.fp4tsOption,
    Option.Eq,
  );

  checkAll(
    'MonadError<RWST<MiniInt, number, MiniInt, MiniInt, Either<string, *>, *>>',
    MonadErrorSuite(
      RWST.MonadError<MiniInt, number, MiniInt, $<EitherF, [string]>, string>(
        Monoid.addition,
        Either.MonadError<string>(),
      ),
    ).monadError(
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
      <X>(
        X: Arbitrary<X>,
      ): Arbitrary<RWST<MiniInt, number, MiniInt, $<EitherF, [string]>, X>> =>
        fc.func<[MiniInt, MiniInt], Either<string, [X, MiniInt, number]>>(
          A.fp4tsEither(
            fc.string(),
            fc.tuple(X, A.fp4tsMiniInt(), fc.integer()),
          ),
        ),
      <X>(
        X: Eq<X>,
      ): Eq<RWST<MiniInt, number, MiniInt, $<EitherF, [string]>, X>> =>
        Eq.by(
          eq.fn1Eq(
            ec.miniInt(),
            Either.Eq(Eq.primitive, Eq.tuple(X, MiniInt.Eq, Eq.primitive)),
          ),
          fa => s => fa(s, s),
        ),
    ),
  );

  checkAll(
    'Strong<IxRWST<boolean, number, *, *, Eval, number>>',
    StrongSuite(
      IxRWST.Strong<boolean, number, EvalF, number>(Eval.Monad),
    ).strong(
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      Eq.primitive,
      Eq.primitive,
      ec.boolean(),
      Eq.primitive,
      ec.boolean(),
      Eq.primitive,
      <X, Y>(
        X: Arbitrary<X>,
        Y: Arbitrary<Y>,
      ): Arbitrary<IxRWST<boolean, number, X, Y, EvalF, number>> =>
        fc.func<[boolean, X], Eval<[number, Y, number]>>(
          A.fp4tsEval(fc.tuple(fc.integer(), Y, fc.integer())),
        ),
      <X, Y>(
        X: ExhaustiveCheck<X>,
        Y: Eq<Y>,
      ): Eq<IxRWST<boolean, number, X, Y, EvalF, number>> =>
        Eq.by(
          eq.fn1Eq(
            ec.boolean().product(X),
            Eval.Eq(Eq.tuple(Eq.primitive, Y, Eq.primitive)),
          ),
          fa =>
            ([r, s]) =>
              fa(r, s),
        ),
    ),
  );
});
