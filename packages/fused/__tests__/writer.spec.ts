// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, EvalF, Kind } from '@fp4ts/core';
import { Eq, IdentityF, Monoid, Identity, Monad } from '@fp4ts/cats';
import { IxRWSF, RWST, RWSTF, WriterTF } from '@fp4ts/cats-mtl';
import { MonadWriterSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import { Writer, WriterF } from '@fp4ts/fused-core';
import { Algebra } from '@fp4ts/fused-kernel';
import { RWSC, RWSTC, WriterC } from '@fp4ts/fused-std';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Writer Effect', () => {
  function runTests<F, W>(
    nameF: string,
    F: Algebra<{ writer: $<WriterF, [W]> }, F>,
    [arbW, EqW, WM, nameW]: [Arbitrary<W>, Eq<W>, Monoid<W>, string],
    mkArbF: <X>(A: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
    mkEqF: <X>(A: Eq<X>) => Eq<Kind<F, [X]>>,
  ) {
    const M = Writer.MonadWriter(F, WM);
    describe(nameF, () => {
      checkAll(
        `MonadState<${nameF}, ${nameW}>`,
        MonadWriterSuite(M).censor(
          fc.integer(),
          arbW,
          Eq.fromUniversalEquals(),
          EqW,
          mkArbF,
          mkEqF,
        ),
      );

      checkAll(
        `Monad<${nameF}>`,
        MonadWriterSuite(M).monad(
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

  runTests<$<WriterTF, [IdentityF, string]>, string>(
    'WriterT<string, Identity, *>',
    WriterC.WriterT(Algebra.Id, Monoid.string),
    [fc.string(), Eq.fromUniversalEquals(), Monoid.string, 'string'],
    X => fc.tuple(X, fc.string()),
    X => Eq.tuple(X, Eq.fromUniversalEquals()),
  );

  runTests<$<WriterTF, [EvalF, string]>, string>(
    'WriterT<string, Eval, *>',
    WriterC.WriterT(Algebra.Eval, Monoid.string),
    [fc.string(), Eq.fromUniversalEquals(), Monoid.string, 'string'],
    X => A.fp4tsEval(fc.tuple(X, fc.string())),
    X => Eq.Eval(Eq.tuple(X, Eq.fromUniversalEquals())),
  );

  runTests<$<IxRWSF, [unknown, string, void, void]>, string>(
    'RWS<unknown, string, void, *>',
    RWSC.Algebra(Monoid.string),
    [fc.string(), Eq.fromUniversalEquals(), Monoid.string, 'string'],
    X =>
      A.fp4tsRWS(
        fc.func(fc.tuple(X, fc.constant(undefined as void), fc.string())),
      ),
    X =>
      Eq.by(Eq.tuple(X, Eq.fromUniversalEquals()), rws =>
        rws.runAW(null, undefined, Monoid.string),
      ),
  );

  runTests<$<RWSTF, [unknown, string, void, IdentityF]>, string>(
    'RWST<unknown, string, void, Identity, *>',
    RWSTC.Algebra(Algebra.Id, Monoid.string),
    [fc.string(), Eq.fromUniversalEquals(), Monoid.string, 'string'],
    X =>
      A.fp4tsRWST(
        Identity.Monad,
        fc.func(fc.tuple(X, fc.constant(undefined as void), fc.string())),
      ),
    X =>
      Eq.by(
        Eq.tuple(X, Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
        rwsfa =>
          RWST.runASW(Identity.Monad, Monoid.string)(rwsfa)(null, undefined),
      ),
  );

  runTests<$<RWSTF, [unknown, string, void, EvalF]>, string>(
    'RWST<unknown, string, void, Eval, *>',
    RWSTC.Algebra(Algebra.Eval, Monoid.string),
    [fc.string(), Eq.fromUniversalEquals(), Monoid.string, 'string'],
    X =>
      A.fp4tsRWST(
        Monad.Eval,
        fc.func(
          A.fp4tsEval(fc.tuple(X, fc.constant(undefined as void), fc.string())),
        ),
      ),
    X =>
      Eq.by(
        Eq.Eval(
          Eq.tuple(X, Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
        ),
        rwsfa => RWST.runASW(Monad.Eval, Monoid.string)(rwsfa)(null, undefined),
      ),
  );
});
