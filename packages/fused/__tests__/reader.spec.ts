// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Kind } from '@fp4ts/core';
import {
  CommutativeMonoid,
  Eq,
  Eval,
  EvalF,
  Function1F,
  Identity,
  IdentityF,
  KleisliF,
} from '@fp4ts/cats';
import { IxRWSF, RWST, RWSTF } from '@fp4ts/cats-mtl';
import { MonadReaderSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

import { ReaderC, RWSC, RWSTC } from '@fp4ts/fused-std';
import { Algebra } from '@fp4ts/fused-kernel';
import { Reader, ReaderF } from '@fp4ts/fused-core';

describe('Reader Effect', () => {
  function runTests<F, R>(
    nameF: string,
    F: Algebra<{ reader: $<ReaderF, [R]> }, F>,
    [arbR, EqR, nameR]: [Arbitrary<R>, Eq<R>, string],
    mkArbF: <X>(A: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    mkEqF: <X>(A: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    const M = Reader.MonadReader(F);
    describe(nameF, () => {
      checkAll(
        `Local<${nameF}, ${nameR}>`,
        MonadReaderSuite(M).local(
          fc.integer(),
          fc.integer(),
          arbR,
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          EqR,
          mkArbF,
          mkEqF,
        ),
      );

      checkAll(
        `Monad<${nameF}>`,
        MonadReaderSuite(M).monad(
          fc.integer(),
          fc.integer(),
          fc.integer(),
          fc.integer(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          mkArbF,
          mkEqF,
        ),
      );
    });
  }

  runTests<$<Function1F, [MiniInt]>, MiniInt>(
    'Function1F<MiniInt, *>',
    ReaderC.Function1(),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X => fc.func(X),
    X => eq.fn1Eq(ec.miniInt(), X),
  );

  runTests<$<KleisliF, [IdentityF, MiniInt]>, MiniInt>(
    'Kleisli<Identity, MiniInt, *>',
    ReaderC.Kleisli(Algebra.Id),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X => A.fp4tsKleisli(X),
    X => eq.fn1Eq(ec.miniInt(), X),
  );

  runTests<$<KleisliF, [EvalF, MiniInt]>, MiniInt>(
    'Kleisli<Eval, MiniInt, *>',
    ReaderC.Kleisli(Algebra.Eval),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X => A.fp4tsKleisli(A.fp4tsEval(X)),
    X => eq.fn1Eq(ec.miniInt(), Eval.Eq(X)),
  );

  runTests<$<IxRWSF, [MiniInt, void, void, void]>, MiniInt>(
    'RWS<MiniInt, void, void, *>',
    RWSC.Algebra(CommutativeMonoid.void),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X =>
      A.fp4tsRWS(
        fc.func(fc.tuple(X, fc.constant(undefined), fc.constant(undefined))),
      ),
    X =>
      Eq.by(
        eq.fn1Eq(ec.miniInt(), X),
        rws => r => rws.runAll(r, undefined, CommutativeMonoid.void)[0],
      ),
  );

  runTests<$<RWSTF, [MiniInt, void, void, IdentityF]>, MiniInt>(
    'RWS<MiniInt, void, void, *>',
    RWSTC.Algebra(Algebra.Id, CommutativeMonoid.void),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X =>
      A.fp4tsRWST(
        Identity.Monad,
        fc.func(fc.tuple(X, fc.constant(undefined), fc.constant(undefined))),
      ),
    X =>
      Eq.by(
        eq.fn1Eq(
          ec.miniInt(),
          Eq.tuple(
            X,
            Eq.fromUniversalEquals<void>(),
            Eq.fromUniversalEquals<void>(),
          ),
        ),
        rwsfa => r =>
          RWST.runASW(Identity.Monad, CommutativeMonoid.void)(rwsfa)(
            r,
            undefined,
          ),
      ),
  );

  runTests<$<RWSTF, [MiniInt, void, void, IdentityF]>, MiniInt>(
    'RWST<MiniInt, void, void, Identity, *>',
    RWSTC.Algebra(Algebra.Id, CommutativeMonoid.void),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X =>
      A.fp4tsRWST(
        Identity.Monad,
        fc.func(fc.tuple(X, fc.constant(undefined), fc.constant(undefined))),
      ),
    X =>
      Eq.by(
        eq.fn1Eq(
          ec.miniInt(),
          Eq.tuple(
            X,
            Eq.fromUniversalEquals<void>(),
            Eq.fromUniversalEquals<void>(),
          ),
        ),
        rwsfa => r =>
          RWST.runASW(Identity.Monad, CommutativeMonoid.void)(rwsfa)(
            r,
            undefined,
          ),
      ),
  );

  runTests<$<RWSTF, [MiniInt, void, void, EvalF]>, MiniInt>(
    'RWST<MiniInt, void, void, Eval, *>',
    RWSTC.Algebra(Algebra.Eval, CommutativeMonoid.void),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X =>
      A.fp4tsRWST(
        Eval.Monad,
        fc.func(
          A.fp4tsEval(
            fc.tuple(
              X,
              fc.constant(undefined as void),
              fc.constant(undefined as void),
            ),
          ),
        ),
      ),
    X =>
      Eq.by(
        eq.fn1Eq(
          ec.miniInt(),
          Eval.Eq(
            Eq.tuple(
              X,
              Eq.fromUniversalEquals<void>(),
              Eq.fromUniversalEquals<void>(),
            ),
          ),
        ),
        rwsfa => r =>
          RWST.runASW(Eval.Monad, CommutativeMonoid.void)(rwsfa)(r, undefined),
      ),
  );
});
