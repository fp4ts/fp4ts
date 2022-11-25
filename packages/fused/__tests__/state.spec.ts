// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Kind } from '@fp4ts/core';
import { Eq, Eval, EvalF, Identity, IdentityF } from '@fp4ts/cats';
import { IxRWSF, RWS } from '@fp4ts/cats-mtl';
import { MonadSuite } from '@fp4ts/cats-laws';
import { checkAll, forAll, IsEq, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

import { StateC, StateCF } from '@fp4ts/fused-std';
import { Algebra } from '@fp4ts/fused-kernel';
import { State, StateF } from '@fp4ts/fused-core';
import { RWSAlgebra } from '@fp4ts/fused-mtl';

describe('State Effect', () => {
  function tests<S, F, CF, A>(
    F: Algebra<{ state: $<StateF, [S]> }, CF>,
    runState: <X>(fa: Kind<CF, [X]>, s: S) => Kind<F, [[X, S]]>,
    arbS: Arbitrary<S>,
    arbA: Arbitrary<A>,
    EqS: Eq<S>,
    EqA: Eq<A>,
    mkArbCF: <X>(X: Arbitrary<X>) => Arbitrary<Kind<CF, [X]>>,
    mkEqF: <X>(X: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    const S = State.Syntax(F);

    test(
      'get returns the state variable',
      forAll(
        arbS,
        fc.func<[S], Kind<CF, [A]>>(mkArbCF(arbA)),
        (s, f) =>
          new IsEq(runState(F.flatMap_(S.get, f), s), runState(f(s), s)),
      )(mkEqF(Eq.tuple(EqA, EqS))),
    );

    test(
      'set updates the state variable',
      forAll(
        arbS,
        arbS,
        mkArbCF(arbA),
        (s1, s2, fa) =>
          new IsEq(
            runState(
              F.flatMap_(S.set(s2), () => fa),
              s1,
            ),
            runState(fa, s2),
          ),
      )(mkEqF(Eq.tuple(EqA, EqS))),
    );
  }

  describe('StateC<number, Identity, *>', () => {
    tests<number, IdentityF, $<StateCF, [number, IdentityF]>, number>(
      StateC.Algebra(Algebra.Id),
      (fa, s) => fa(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.func(fc.tuple(X, fc.integer())),
      X => X,
    );
  });

  describe('StateC<number, Eval, *>', () => {
    tests<number, EvalF, $<StateCF, [number, EvalF]>, number>(
      StateC.Algebra(Algebra.Eval),
      (fa, s) => fa(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.func(A.fp4tsEval(fc.tuple(X, fc.integer()))),
      Eval.Eq,
    );
  });

  describe('RWS<unknown, never, number, *>', () => {
    tests<
      number,
      IdentityF,
      $<IxRWSF, [unknown, never, number, number]>,
      number
    >(
      RWSAlgebra<unknown, never, number>(),
      (fa, s) => fa.runState(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.func(fc.tuple(X, fc.integer())).map(RWS.state),
      X => X,
    );
  });

  describe('StateC', () => {
    checkAll(
      'Monad<StateC<MiniInt, Identity, *>>',
      MonadSuite(StateC.Monad<MiniInt, IdentityF>(Identity.Monad)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.func(fc.tuple(X, A.fp4tsMiniInt())),
        X => eq.fn1Eq(ec.miniInt(), Eq.tuple(X, MiniInt.Eq)),
      ),
    );

    checkAll(
      'Monad<StateC<MiniInt, Eval, *>>',
      MonadSuite(StateC.Monad<MiniInt, EvalF>(Eval.Monad)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.func(A.fp4tsEval(fc.tuple(X, A.fp4tsMiniInt()))),
        X => eq.fn1Eq(ec.miniInt(), Eval.Eq(Eq.tuple(X, MiniInt.Eq))),
      ),
    );
  });
});
