// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { ArrowLoop } from '@fp4ts/cats-arrow';
import { ArrowLoopSuite } from '@fp4ts/cats-arrow-laws';
import { Comonad, Defer, Unzip } from '@fp4ts/cats-core';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Cokleisli', () => {
  const eqCokleisli = <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) =>
    eq.fn1Eq(ec.instance(X.allValues.map((x: X) => Eval.now(x))), Y);

  checkAll(
    'ArrowLoop<Cokleisli<Eval, *, *>>',
    ArrowLoopSuite(ArrowLoop.Cokleisli(Comonad.Eval)).arrowLoop(
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
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      eqCokleisli,
      { ...Defer.Eval, ...Unzip.Eval },
      A.fp4tsEval,
    ),
  );
});
