// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, id, Kind } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Eval, EvalF, Monad } from '@fp4ts/cats-core';
import {
  Chain,
  Identity,
  Option,
  EitherF,
  Either,
} from '@fp4ts/cats-core/lib/data';
import {
  IndexedReaderWriterStateT,
  IndexedReaderWriterStateT as RWST,
} from '@fp4ts/cats-mtl';
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

describe('IndexedReaderWriterStateT', () => {
  function runTests<F, W>(
    [effectName, F]: [string, Monad<F>],
    [W, WM, arbW, eqW]: [string, Monoid<W>, Arbitrary<W>, Eq<W>],
    mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    checkAll(
      `MonadState<IndexedReaderWriterStateT<${effectName}, ${W}, MiniInt, MiniInt, unknown, *>, MiniInt>`,
      MonadStateSuite(RWST.MonadState<F, W, MiniInt, unknown>(F)).monadState(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<RWST<F, W, MiniInt, MiniInt, unknown, X>> =>
          A.fp4tsIndexedReaderWriterStateT(
            mkArbF(
              fc.func<[unknown, MiniInt], Kind<F, [[Chain<W>, MiniInt, X]]>>(
                mkArbF(fc.tuple(A.fp4tsChain(arbW), A.fp4tsMiniInt(), X)),
              ),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<F, W, MiniInt, MiniInt, unknown, X>> =>
          Eq.by(eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(MiniInt.Eq, X))), fa =>
            fa.runStateT(F),
          ),
      ),
    );

    checkAll(
      `Censor<IndexedReaderWriterStateT<${effectName}, ${W}, unknown, unknown, unknown, *>, ${W}>`,
      MonadWriterSuite(RWST.MonadWriter<F, W, unknown, unknown>(F, WM)).censor(
        fc.integer(),
        arbW,
        Eq.primitive,
        eqW,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<RWST<F, W, unknown, unknown, unknown, X>> =>
          A.fp4tsIndexedReaderWriterStateT(
            mkArbF(
              fc.func<[unknown, unknown], Kind<F, [[Chain<W>, unknown, X]]>>(
                mkArbF(fc.tuple(A.fp4tsChain(arbW), A.fp4tsMiniInt(), X)),
              ),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<F, W, unknown, unknown, unknown, X>> =>
          Eq.by(mkEqF(Eq.tuple(eqW, X)), fa => fa.runWriterT(F, WM)),
      ),
    );

    checkAll(
      `Local<IndexedReaderWriterStateT<${effectName}, ${W}, unknown, unknown, MiniInt, *>, MiniInt>`,
      MonadReaderSuite(RWST.MonadReader<F, W, unknown, MiniInt>(F)).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.primitive,
        Eq.primitive,
        MiniInt.Eq,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<RWST<F, W, unknown, unknown, MiniInt, X>> =>
          A.fp4tsIndexedReaderWriterStateT(
            mkArbF(
              fc.func<[MiniInt, unknown], Kind<F, [[Chain<W>, unknown, X]]>>(
                mkArbF(fc.tuple(A.fp4tsChain(arbW), fc.constant(undefined), X)),
              ),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<F, W, unknown, unknown, MiniInt, X>> =>
          Eq.by(eq.fn1Eq(ec.miniInt(), mkEqF(X)), fa => fa.runReaderT(F)),
      ),
    );

    checkAll(
      `Monad<IndexedReaderWriterStateT<${effectName}, ${W}, MiniInt, MiniInt, MiniInt, *>>`,
      MonadSuite(RWST.Monad<F, W, MiniInt, MiniInt>(F)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(
          X: Arbitrary<X>,
        ): Arbitrary<RWST<F, W, MiniInt, MiniInt, MiniInt, X>> =>
          A.fp4tsIndexedReaderWriterStateT(
            mkArbF(
              fc.func<[MiniInt, MiniInt], Kind<F, [[Chain<W>, MiniInt, X]]>>(
                mkArbF(fc.tuple(A.fp4tsChain(arbW), A.fp4tsMiniInt(), X)),
              ),
            ),
          ),
        <X>(X: Eq<X>): Eq<RWST<F, W, MiniInt, MiniInt, MiniInt, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), mkEqF(Eq.tuple(eqW, MiniInt.Eq, X))),
            fa => s =>
              F.map_(fa.runAll(F)(s, s), ([c, s, x]) => [c.folding(WM), s, x]),
          ),
      ),
    );
  }

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
    'MonadError<IndexedReaderWriterStateT<Either<string, *>, number, MiniInt, MiniInt, MiniInt, *>>',
    MonadErrorSuite(
      RWST.MonadError<$<EitherF, [string]>, number, MiniInt, MiniInt, string>(
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
      ): Arbitrary<
        RWST<$<EitherF, [string]>, number, MiniInt, MiniInt, MiniInt, X>
      > =>
        A.fp4tsIndexedReaderWriterStateT(
          A.fp4tsEither(
            fc.string(),
            fc.func<
              [MiniInt, MiniInt],
              Either<string, [Chain<number>, MiniInt, X]>
            >(
              A.fp4tsEither(
                fc.string(),
                fc.tuple(A.fp4tsChain(fc.integer()), A.fp4tsMiniInt(), X),
              ),
            ),
          ),
        ),
      <X>(
        X: Eq<X>,
      ): Eq<RWST<$<EitherF, [string]>, number, MiniInt, MiniInt, MiniInt, X>> =>
        Eq.by(
          eq.fn1Eq(
            ec.miniInt(),
            Either.Eq(Eq.primitive, Eq.tuple(Eq.primitive, MiniInt.Eq, X)),
          ),
          fa => s =>
            fa
              .runAll(Either.Monad())(s, s)
              .map(([c, s, x]) => [c.folding(Monoid.addition), s, x]),
        ),
    ),
  );

  checkAll(
    'Strong<IndexedStateT<Eval, number, *, *, boolean, number>>',
    StrongSuite(
      IndexedReaderWriterStateT.Strong<EvalF, number, boolean, number>(
        Eval.Monad,
      ),
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
      ): Arbitrary<RWST<EvalF, number, X, Y, boolean, number>> =>
        A.fp4tsIndexedReaderWriterStateT(
          A.fp4tsEval(
            fc.func<[boolean, X], Eval<[Chain<number>, Y, number]>>(
              A.fp4tsEval(
                fc.tuple(A.fp4tsChain(fc.integer()), Y, fc.integer()),
              ),
            ),
          ),
        ),
      <X, Y>(
        X: ExhaustiveCheck<X>,
        Y: Eq<Y>,
      ): Eq<RWST<EvalF, number, X, Y, boolean, number>> =>
        Eq.by(
          eq.fn1Eq(
            ec.boolean().product(X),
            Eval.Eq(Eq.tuple(Eq.primitive, Y, Eq.primitive)),
          ),
          fa =>
            ([r, s]) =>
              fa
                .runAll(Eval.Monad)(r, s)
                .map(([c, s, x]) => [c.folding(Monoid.addition), s, x]),
        ),
    ),
  );
});
