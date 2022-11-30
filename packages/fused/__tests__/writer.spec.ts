// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, id, Kind, tupled } from '@fp4ts/core';
import {
  Eval,
  EvalF,
  Eq,
  Functor,
  Identity,
  IdentityF,
  Monoid,
} from '@fp4ts/cats';
import { IxRWSF, RWS, WriterTF } from '@fp4ts/cats-mtl';
import { forAll, IsEq } from '@fp4ts/cats-test-kit';
import { Writer, WriterF } from '@fp4ts/fused-core';
import { Algebra } from '@fp4ts/fused-kernel';
import { RWSC, WriterC } from '@fp4ts/fused-std';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Writer Effect', () => {
  function tests<W, F, CF, A>(
    CF: Algebra<{ writer: $<WriterF, [W]> }, CF>,
    F: Functor<F>,
    W: Monoid<W>,
    runWriter: <X>(fa: Kind<CF, [X]>) => Kind<F, [[X, W]]>,
    arbA: Arbitrary<A>,
    arbW: Arbitrary<W>,
    eqA: Eq<A>,
    eqW: Eq<W>,
    mkArbCF: <X>(X: Arbitrary<X>) => Arbitrary<Kind<CF, [X]>>,
    mkEqF: <X>(X: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    const S = Writer.Syntax(CF);

    test(
      'tell appends value to the log',
      forAll(
        arbW,
        mkArbCF(arbA),
        (w, cfa) =>
          new IsEq(
            runWriter(CF.flatMap_(S.tell(w), () => cfa)),
            F.map_(runWriter(cfa), ([a, w2]) =>
              tupled(
                a,
                W.combine_(w, () => w2),
              ),
            ),
          ),
      )(mkEqF(Eq.tuple(eqA, eqW))),
    );

    test(
      'listen eavesdrops on written output',
      forAll(
        mkArbCF(arbA),
        cfa =>
          new IsEq(
            runWriter(S.listen(cfa)),
            F.map_(runWriter(cfa), ([a, w]) => tupled(tupled(a, w), w)),
          ),
      )(mkEqF(Eq.tuple(Eq.tuple(eqA, eqW), eqW))),
    );

    test(
      'censor revises written output',
      forAll(
        mkArbCF(arbA),
        fc.func(arbW),
        (cfa, f) =>
          new IsEq(
            runWriter(S.censor_(cfa, f)),
            F.map_(runWriter(cfa), ([a, w]) => tupled(a, f(w))),
          ),
      )(mkEqF(Eq.tuple(eqA, eqW))),
    );
  }

  describe('WriterT<string, Identity, *>', () => {
    tests<string, IdentityF, $<WriterTF, [IdentityF, string]>, number>(
      WriterC.WriterT(Algebra.Id, Monoid.string),
      Identity.Monad,
      Monoid.string,
      id,
      fc.integer(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.tuple(X, fc.string()),
      id,
    );
  });

  describe('WriterT<string, Eval, *>', () => {
    tests<string, EvalF, $<WriterTF, [EvalF, string]>, number>(
      WriterC.WriterT(Algebra.Eval, Monoid.string),
      Eval.Monad,
      Monoid.string,
      id,
      fc.integer(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => A.fp4tsEval(fc.tuple(X, fc.string())),
      Eval.Eq,
    );
  });

  describe('RWS<unknown, string, unknown, *>', () => {
    tests<
      string,
      IdentityF,
      $<IxRWSF, [unknown, string, unknown, unknown]>,
      number
    >(
      RWSC.Algebra(Monoid.string),
      Identity.Monad,
      Monoid.string,
      fa => fa.runWriter(Monoid.string),
      fc.integer(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.func(fc.tuple(X, fc.anything(), fc.string())).map(RWS),
      X => X,
    );
  });
});
