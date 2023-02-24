// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, EvalF } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Kleisli } from '@fp4ts/cats-core/lib/data';
import { ArrowApply, ArrowChoice } from '@fp4ts/cats-arrow';
import { ArrowApplySuite, ArrowChoiceSuite } from '@fp4ts/cats-arrow-laws';
import { Monad } from '@fp4ts/cats-core';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Kleisli', () => {
  const eqKleisli = <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
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
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
        A.fp4tsKleisli<EvalF, X, Y>(A.fp4tsEval(Y)),
      eqKleisli,
      <X, Y>(X: ExhaustiveCheck<X>, Y: ExhaustiveCheck<Y>) =>
        Y.map(y => Kleisli((x: X) => Eval.now(y))),
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
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
        A.fp4tsKleisli<EvalF, X, Y>(A.fp4tsEval(Y)),
      eqKleisli,
    ),
  );
});
