// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Kind, tupled } from '@fp4ts/core';
import { Eq, Eval, EvalF, Identity, IdentityF } from '@fp4ts/cats';
import { IxRWSF, IxStateTF, RWS, StateTF } from '@fp4ts/cats-mtl';
import { forAll, IsEq } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import { RWSC, StateC } from '@fp4ts/fused-std';
import { Algebra } from '@fp4ts/fused-kernel';
import { State, StateF } from '@fp4ts/fused-core';

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

  describe('IxStateT<number, number, Identity, *>', () => {
    tests<number, IdentityF, $<IxStateTF, [number, number, IdentityF]>, number>(
      StateC.IxStateT(Algebra.Id),
      (fa, s) => fa(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.func(fc.tuple(X, fc.integer())),
      X => X,
    );
  });

  describe('IxStateT<number, number, Eval, *>', () => {
    tests<number, EvalF, $<IxStateTF, [number, number, EvalF]>, number>(
      StateC.IxStateT(Algebra.Eval),
      (fa, s) => fa(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.func(A.fp4tsEval(fc.tuple(X, fc.integer()))),
      Eval.Eq,
    );
  });

  describe('StateT<number, Identity, *>', () => {
    tests<number, IdentityF, $<StateTF, [number, IdentityF]>, number>(
      StateC.StateT(Algebra.Id),
      (fa, s) => fa(a => s => tupled(a, s))(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => A.fp4tsStateT(Identity.Monad, fc.func(fc.tuple(X, fc.integer()))),
      X => X,
    );
  });

  describe('StateT<number, Eval, *>', () => {
    tests<number, EvalF, $<StateTF, [number, EvalF]>, number>(
      StateC.StateT(Algebra.Eval),
      (fa, s) => fa(a => s => Eval.now(tupled(a, s)))(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X =>
        A.fp4tsStateT(
          Eval.Monad,
          fc.func(A.fp4tsEval(fc.tuple(X, fc.integer()))),
        ),
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
      RWSC.Algebra<unknown, number>(),
      (fa, s) => fa.runState(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.func(fc.tuple(X, fc.integer())).map(RWS.state),
      X => X,
    );
  });
});
