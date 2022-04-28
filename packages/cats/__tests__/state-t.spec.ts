// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Identity, IdentityF, StateT } from '@fp4ts/cats-core/lib/data';
import { MonadState } from '@fp4ts/cats-mtl';
import { MonadSuite } from '@fp4ts/cats-laws';
import { MonadStateSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import { Eq } from '@fp4ts/cats-kernel';
import { Eval, EvalF } from '@fp4ts/cats-core';

describe('StateT', () => {
  checkAll(
    'MonadState<StateT<Identity, MiniInt, *>, MiniInt>',
    MonadStateSuite(
      MonadState.StateT<IdentityF, MiniInt>(Identity.Monad),
    ).monadState(
      A.fp4tsMiniInt(),
      MiniInt.Eq,
      <X>(X: Arbitrary<X>): Arbitrary<StateT<IdentityF, MiniInt, X>> =>
        A.fp4tsStateT(
          Identity.Applicative,
          fc.func<[MiniInt], [MiniInt, X]>(fc.tuple(A.fp4tsMiniInt(), X)),
        ),
      <X>(X: Eq<X>): Eq<StateT<IdentityF, MiniInt, X>> =>
        Eq.by(eq.fn1Eq(ec.miniInt(), Eq.tuple(MiniInt.Eq, X)), fa =>
          fa.runStateT(Identity.Monad),
        ),
    ),
  );

  checkAll(
    'Monad<StateT<Identity, MiniInt, *>>',
    MonadSuite(StateT.Monad<IdentityF, MiniInt>(Identity.Monad)).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      <X>(X: Arbitrary<X>): Arbitrary<StateT<IdentityF, MiniInt, X>> =>
        A.fp4tsStateT(
          Identity.Applicative,
          fc.func<[MiniInt], [MiniInt, X]>(fc.tuple(A.fp4tsMiniInt(), X)),
        ),
      <X>(X: Eq<X>): Eq<StateT<IdentityF, MiniInt, X>> =>
        Eq.by(eq.fn1Eq(ec.miniInt(), Eq.tuple(MiniInt.Eq, X)), fa =>
          fa.runStateT(Identity.Monad),
        ),
    ),
  );

  checkAll(
    'Monad<StateT<Eval, MiniInt, *>>',
    MonadSuite(StateT.Monad<EvalF, MiniInt>(Eval.Monad)).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      <X>(X: Arbitrary<X>): Arbitrary<StateT<EvalF, MiniInt, X>> =>
        A.fp4tsStateT(
          Eval.Applicative,
          fc.func<[MiniInt], Eval<[MiniInt, X]>>(
            A.fp4tsEval(fc.tuple(A.fp4tsMiniInt(), X)),
          ),
        ),
      <X>(X: Eq<X>): Eq<StateT<EvalF, MiniInt, X>> =>
        Eq.by(eq.fn1Eq(ec.miniInt(), Eval.Eq(Eq.tuple(MiniInt.Eq, X))), fa =>
          fa.runStateT(Eval.Monad),
        ),
    ),
  );
});
