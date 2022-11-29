// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Kind } from '@fp4ts/core';
import { Eq, Eval, EvalF, IdentityF } from '@fp4ts/cats';
import { IxRWSF, Reader as MtlReader } from '@fp4ts/cats-mtl';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { forAll, IsEq } from '@fp4ts/cats-test-kit';

import { ReaderC, ReaderCF } from '@fp4ts/fused-std';
import { Algebra } from '@fp4ts/fused-kernel';
import { Reader, ReaderF } from '@fp4ts/fused-core';
import { RWSAlgebra } from '@fp4ts/fused-mtl';

describe('Reader Effect', () => {
  function tests<R, F, CF, A>(
    F: Algebra<{ reader: $<ReaderF, [R]> }, CF>,
    runReader: <X>(fa: Kind<CF, [X]>, s: R) => Kind<F, [X]>,
    arbR: Arbitrary<R>,
    arbA: Arbitrary<A>,
    EqA: Eq<A>,
    mkArbCF: <X>(X: Arbitrary<X>) => Arbitrary<Kind<CF, [X]>>,
    mkEqF: <X>(X: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    const S = Reader.Syntax(F);

    test(
      'ask returns the environment variable',
      forAll(
        arbR,
        fc.func<[R], Kind<CF, [A]>>(mkArbCF(arbA)),
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

  describe('ReaderC<MiniInt, Identity, *>', () => {
    tests<number, IdentityF, $<ReaderCF, [IdentityF, number]>, number>(
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
    tests<number, EvalF, $<ReaderCF, [EvalF, number]>, number>(
      ReaderC.Algebra(Algebra.Eval),
      (fa, s) => fa(s),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      X => fc.func(A.fp4tsEval(X)),
      Eval.Eq,
    );
  });

  describe('RWS<number, never, unknown, *>', () => {
    tests<
      number,
      IdentityF,
      $<IxRWSF, [number, never, unknown, unknown]>,
      number
    >(
      RWSAlgebra<number, unknown>(),
      (fa, r) => fa.runReader(r),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      X => fc.func(X).map(MtlReader.lift),
      X => X,
    );
  });
});
