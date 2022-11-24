// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Kind } from '@fp4ts/core';
import { Eq, Eval, EvalF, Identity, IdentityF } from '@fp4ts/cats';
import { MonadSuite } from '@fp4ts/cats-laws';
import { checkAll, forAll, IsEq, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

import { ReaderC, ReaderCF1 } from '@fp4ts/fused-std';
import { Algebra } from '@fp4ts/fused-kernel';
import { Reader, ReaderF } from '@fp4ts/fused-core';

describe('Reader Effect', () => {
  function tests<R, F, C, A>(
    F: Algebra<{ reader: $<ReaderF, [R]> }, Kind<C, [F]>>,
    runReader: <X>(fa: Kind<Kind<C, [F]>, [X]>, s: R) => Kind<F, [X]>,
    arbR: Arbitrary<R>,
    arbA: Arbitrary<A>,
    EqA: Eq<A>,
    mkArbCF: <X>(X: Arbitrary<X>) => Arbitrary<Kind<Kind<C, [F]>, [X]>>,
    mkEqF: <X>(X: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    const S = Reader.Syntax(F);

    test(
      'ask returns the environment variable',
      forAll(
        arbR,
        fc.func<[R], Kind<Kind<C, [F]>, [A]>>(mkArbCF(arbA)),
        (r, f) =>
          new IsEq(runReader(F.flatMap_(S.ask, f), r), runReader(f(r), r)),
      )(mkEqF(EqA)),
    );

    test(
      'local updates the environment variable',
      forAll(
        arbR,
        fc.func<[R], R>(arbR),
        mkArbCF(arbA),
        (r, f, fa) =>
          new IsEq(runReader(S.local_(fa, f), r), runReader(fa, f(r))),
      )(mkEqF(EqA)),
    );
  }

  describe('ReaderC<number, Identity, *>', () => {
    tests<number, IdentityF, ReaderCF1<number>, number>(
      ReaderC.Algebra(Algebra.Id),
      (fa, s) => fa(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      X => fc.func(X),
      X => X,
    );
  });

  describe('ReaderC<number, Eval, *>', () => {
    tests<number, EvalF, ReaderCF1<number>, number>(
      ReaderC.Algebra(Algebra.Eval),
      (fa, s) => fa(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      X => fc.func(A.fp4tsEval(X)),
      Eval.Eq,
    );
  });

  describe('ReaderC', () => {
    checkAll(
      'Monad<ReaderC<MiniInt, Identity, *>>',
      MonadSuite(ReaderC.Monad<MiniInt, IdentityF>(Identity.Monad)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.func(X),
        X => eq.fn1Eq(ec.miniInt(), X),
      ),
    );

    checkAll(
      'Monad<ReaderC<MiniInt, Eval, *>>',
      MonadSuite(ReaderC.Monad<MiniInt, EvalF>(Eval.Monad)).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        X => fc.func(A.fp4tsEval(X)),
        X => eq.fn1Eq(ec.miniInt(), Eval.Eq(X)),
      ),
    );
  });
});
