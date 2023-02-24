// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, EvalF } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Kleisli } from '@fp4ts/cats-core/lib/data';
import { ArrowApply, ArrowChoice, ArrowLoop } from '@fp4ts/cats-arrow';
import {
  ArrowApplySuite,
  ArrowChoiceSuite,
  ArrowLoopSuite,
} from '@fp4ts/cats-arrow-laws';
import { Comonad, Defer, Monad, MonadDefer, Unzip } from '@fp4ts/cats-core';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Kleisli', () => {
  const eqKleisli = <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) =>
    eq.fn1Eq(X, Eq.Eval(Y));

  checkAll(
    'ArrowApply<Kleisli<Eval, *, *>>',
    ArrowApplySuite(ArrowApply.Kleisli(Monad.Eval)).arrowApply(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
        A.fp4tsKleisli<EvalF, X, Y>(A.fp4tsEval(Y)),
      eqKleisli,
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: ec.ExhaustiveCheck<Y>) =>
        ec.instance<Kleisli<EvalF, X, Y>>(
          Y.allValues.map(y => Kleisli((x: X) => Eval.now(y))),
        ),
    ),
  );

  checkAll(
    'ArrowChoice<Kleisli<Eval, *, *>>',
    ArrowChoiceSuite(ArrowChoice.Kleisli(Monad.Eval)).arrowChoice(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
        A.fp4tsKleisli<EvalF, X, Y>(A.fp4tsEval(Y)),
      eqKleisli,
    ),
  );

  checkAll(
    'ArrowLoop<Kleisli<Eval, *, *>>',
    ArrowLoopSuite(
      ArrowLoop.Kleisli({ ...MonadDefer.Eval, ...Comonad.Eval }),
    ).arrowLoop(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
        fc.func<[X], Eval<Y>>(A.fp4tsEval(Y)),
      eqKleisli,
      { ...Defer.Eval, ...Unzip.Eval },
      A.fp4tsEval,
    ),
  );
});
