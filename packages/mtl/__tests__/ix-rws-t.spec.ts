// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Eval, EvalF, id, Kind } from '@fp4ts/core';
import {
  CommutativeMonoid,
  Eq,
  Monoid,
  Identity,
  Option,
  EitherF,
  Either,
  Monad,
} from '@fp4ts/cats';
import { IxRWST } from '@fp4ts/mtl-core';
import {
  MonadReaderSuite,
  MonadStateSuite,
  MonadWriterSuite,
} from '@fp4ts/mtl-laws';
import { MonadErrorSuite, MonadSuite } from '@fp4ts/cats-laws';
import { StrongSuite } from '@fp4ts/cats-profunctor-laws';
import { checkAll, MiniInt, ExhaustiveCheck } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as MA from '@fp4ts/mtl-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('IxRWST', () => {
  function runTests<F, W>(
    [effectName, F]: [string, Monad<F>],
    [W, WM, arbW, eqW]: [string, Monoid<W>, Arbitrary<W>, Eq<W>],
    mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    checkAll(
      `MonadState<IxRWST<unknown, ${W}, MiniInt, ${effectName}, *>, MiniInt>`,
      MonadStateSuite(
        IxRWST.MonadState<unknown, W, MiniInt, F>(WM, F),
      ).monadState(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<IxRWST<unknown, W, MiniInt, MiniInt, F, X>> =>
          MA.fp4tsIxRWST(
            fc.func<[unknown, MiniInt], Kind<F, [[X, MiniInt, W]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt(), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<IxRWST<unknown, W, MiniInt, MiniInt, F, X>> =>
          Eq.by(
            eq.fn1Eq(ExhaustiveCheck.miniInt(), mkEqF(Eq.tuple(X, MiniInt.Eq))),
            fa => x => IxRWST.runAS(F)(null, x)(fa),
          ),
      ),
    );

    checkAll(
      `Censor<IxRWST<unknown, ${W}, unknown, ${effectName}, *>, ${W}>`,
      MonadWriterSuite(
        IxRWST.MonadWriter<unknown, W, unknown, F>(WM, F),
      ).censor(
        fc.integer(),
        arbW,
        Eq.fromUniversalEquals(),
        eqW,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<IxRWST<unknown, W, unknown, unknown, F, X>> =>
          MA.fp4tsIxRWST(
            fc.func<[unknown, unknown], Kind<F, [[X, unknown, W]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt(), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<IxRWST<unknown, W, unknown, unknown, F, X>> =>
          Eq.by(mkEqF(Eq.tuple(X, eqW)), fa => IxRWST.runAW(F)(null, null)(fa)),
      ),
    );

    checkAll(
      `Local<RWST<MiniInt, ${W}, unknown, ${effectName}, *>, MiniInt>`,
      MonadReaderSuite(IxRWST.MonadReader<MiniInt, W, unknown, F>(WM, F)).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        MiniInt.Eq,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<IxRWST<MiniInt, W, unknown, unknown, F, X>> =>
          MA.fp4tsIxRWST(
            fc.func<[MiniInt, unknown], Kind<F, [[X, unknown, W]]>>(
              mkArbF(fc.tuple(X, fc.constant(undefined), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<IxRWST<MiniInt, W, unknown, unknown, F, X>> =>
          Eq.by(
            eq.fn1Eq(ExhaustiveCheck.miniInt(), mkEqF(X)),
            fa => r => IxRWST.runA(F)(r, null)(fa),
          ),
      ),
    );

    checkAll(
      `Monad<RWST<MiniInt, ${W}, MiniInt, ${effectName}, *>>`,
      MonadSuite(IxRWST.Monad<MiniInt, W, MiniInt, F>(WM, F)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<IxRWST<MiniInt, W, MiniInt, MiniInt, F, X>> =>
          MA.fp4tsIxRWST(
            fc.func<[MiniInt, MiniInt], Kind<F, [[X, MiniInt, W]]>>(
              mkArbF(fc.tuple(X, A.fp4tsMiniInt(), arbW)),
            ),
          ),
        <X>(X: Eq<X>): Eq<IxRWST<MiniInt, W, MiniInt, MiniInt, F, X>> =>
          Eq.by(
            eq.fn1Eq(
              ExhaustiveCheck.miniInt(),
              mkEqF(Eq.tuple(X, MiniInt.Eq, eqW)),
            ),
            fa => s => fa(s, s),
          ),
      ),
    );
  }

  describe('stack safety', () => {
    it('right-associative flatMap with Eval', () => {
      const S = IxRWST.MonadState<unknown, void, number, EvalF>(
        CommutativeMonoid.void,
        Monad.Eval,
      );
      const size = 50_000;
      const go: IxRWST<unknown, void, number, number, EvalF, void> = S.flatMap_(
        S.get,
        n => (n >= size ? S.unit : S.flatMap_(S.set(n + 1), () => go)),
      );

      expect(IxRWST.runS(Monad.Eval)(undefined, 0)(go).value).toBe(size);
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
      IxRWST.MonadError<MiniInt, number, MiniInt, $<EitherF, [string]>, string>(
        CommutativeMonoid.addition,
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
      ): Arbitrary<
        IxRWST<MiniInt, number, MiniInt, MiniInt, $<EitherF, [string]>, X>
      > =>
        fc.func<[MiniInt, MiniInt], Either<string, [X, MiniInt, number]>>(
          A.fp4tsEither(
            fc.string(),
            fc.tuple(X, A.fp4tsMiniInt(), fc.integer()),
          ),
        ),
      <X>(
        X: Eq<X>,
      ): Eq<
        IxRWST<MiniInt, number, MiniInt, MiniInt, $<EitherF, [string]>, X>
      > =>
        Eq.by(
          eq.fn1Eq(
            ExhaustiveCheck.miniInt(),
            Either.Eq(
              Eq.fromUniversalEquals(),
              Eq.tuple(X, MiniInt.Eq, Eq.fromUniversalEquals()),
            ),
          ),
          fa => s => fa(s, s),
        ),
    ),
  );

  checkAll(
    'Strong<IxRWST<boolean, number, *, *, Eval, number>>',
    StrongSuite(
      IxRWST.Strong<boolean, number, EvalF, number>(Monad.Eval),
    ).strong(
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ExhaustiveCheck.miniInt(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
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
            ExhaustiveCheck.boolean().product(X),
            Eq.Eval(
              Eq.tuple(Eq.fromUniversalEquals(), Y, Eq.fromUniversalEquals()),
            ),
          ),
          fa =>
            ([r, s]) =>
              fa(r, s),
        ),
    ),
  );
});
