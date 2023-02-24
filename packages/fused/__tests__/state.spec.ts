// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, EvalF, Kind } from '@fp4ts/core';
import { CommutativeMonoid, Eq, Identity, IdentityF, Monad } from '@fp4ts/cats';
import {
  IxRWSF,
  IxStateTF,
  RWS,
  RWST,
  RWSTF,
  StateT,
  StateTF,
} from '@fp4ts/cats-mtl';
import { MonadStateSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

import { RWSC, RWSTC, StateC } from '@fp4ts/fused-std';
import { Algebra } from '@fp4ts/fused-kernel';
import { State, StateF } from '@fp4ts/fused-core';

describe('State Effect', () => {
  function runTests<F, S>(
    nameF: string,
    F: Algebra<{ state: $<StateF, [S]> }, F>,
    [arbS, EqS, nameS]: [Arbitrary<S>, Eq<S>, string],
    mkArbF: <X>(A: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    mkEqF: <X>(A: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    const M = State.MonadState(F);
    describe(nameF, () => {
      checkAll(
        `MonadState<${nameF}, ${nameS}>`,
        MonadStateSuite(M).monadState(arbS, EqS, mkArbF, mkEqF),
      );

      checkAll(
        `Monad<${nameF}>`,
        MonadStateSuite(M).monad(
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

  runTests<$<IxStateTF, [MiniInt, MiniInt, IdentityF]>, MiniInt>(
    'IxStateT<MiniInt, MiniInt, Identity, *>',
    StateC.IxStateT(Algebra.Id),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X => A.fp4tsIxStateT(fc.func(fc.tuple(X, A.fp4tsMiniInt()))),
    X => eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.tuple(X, MiniInt.Eq)),
  );

  runTests<$<IxStateTF, [MiniInt, MiniInt, EvalF]>, MiniInt>(
    'IxStateT<MiniInt, MiniInt, Eval, *>',
    StateC.IxStateT(Algebra.Eval),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X => A.fp4tsIxStateT(fc.func(A.fp4tsEval(fc.tuple(X, A.fp4tsMiniInt())))),
    X => eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.Eval(Eq.tuple(X, MiniInt.Eq))),
  );

  runTests<$<StateTF, [MiniInt, IdentityF]>, MiniInt>(
    'StateT<MiniInt, MiniInt, Identity, *>',
    StateC.StateT(Algebra.Id),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X => A.fp4tsStateT(Identity.Monad, fc.func(fc.tuple(X, A.fp4tsMiniInt()))),
    X =>
      Eq.by(
        eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.tuple(X, MiniInt.Eq)),
        StateT.runAS(Identity.Monad),
      ),
  );

  runTests<$<StateTF, [MiniInt, EvalF]>, MiniInt>(
    'StateT<MiniInt, MiniInt, Eval, *>',
    StateC.StateT(Algebra.Eval),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X =>
      A.fp4tsStateT(
        Monad.Eval,
        fc.func(A.fp4tsEval(fc.tuple(X, A.fp4tsMiniInt()))),
      ),
    X =>
      Eq.by(
        eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.Eval(Eq.tuple(X, MiniInt.Eq))),
        StateT.runAS(Monad.Eval),
      ),
  );

  runTests<$<IxRWSF, [unknown, void, MiniInt, MiniInt]>, MiniInt>(
    'RWS<unknown, void, MiniInt, *>',
    RWSC.Algebra(CommutativeMonoid.void),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X =>
      A.fp4tsRWS(
        fc.func(fc.tuple(X, A.fp4tsMiniInt(), fc.constant(undefined as void))),
      ),
    X =>
      Eq.by(
        eq.fn1Eq(
          ExhaustiveCheck.miniInt(),
          Eq.tuple(X, MiniInt.Eq, Eq.fromUniversalEquals()),
        ),
        rws => s => rws.runAll(null, s, CommutativeMonoid.void),
      ),
  );

  runTests<$<RWSTF, [unknown, void, MiniInt, IdentityF]>, MiniInt>(
    'RWST<unknown, void, MiniInt, Identity, *>',
    RWSTC.Algebra(Algebra.Id, CommutativeMonoid.void),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X =>
      A.fp4tsRWST(
        Identity.Monad,
        fc.func(fc.tuple(X, A.fp4tsMiniInt(), fc.constant(undefined as void))),
      ),
    X =>
      Eq.by(
        eq.fn1Eq(
          ExhaustiveCheck.miniInt(),
          Eq.tuple(X, MiniInt.Eq, Eq.fromUniversalEquals()),
        ),
        rwsfa => s =>
          RWST.runASW(Identity.Monad, CommutativeMonoid.void)(rwsfa)(null, s),
      ),
  );

  runTests<$<RWSTF, [unknown, void, MiniInt, EvalF]>, MiniInt>(
    'RWST<unknown, void, MiniInt, Eval, *>',
    RWSTC.Algebra(Algebra.Eval, CommutativeMonoid.void),
    [A.fp4tsMiniInt(), MiniInt.Eq, 'MiniInt'],
    X =>
      A.fp4tsRWST(
        Monad.Eval,
        fc.func(
          A.fp4tsEval(
            fc.tuple(X, A.fp4tsMiniInt(), fc.constant(undefined as void)),
          ),
        ),
      ),
    X =>
      Eq.by(
        eq.fn1Eq(
          ExhaustiveCheck.miniInt(),
          Eq.Eval(Eq.tuple(X, MiniInt.Eq, Eq.fromUniversalEquals())),
        ),
        rwsfa => s =>
          RWST.runASW(Monad.Eval, CommutativeMonoid.void)(rwsfa)(null, s),
      ),
  );
});
