// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { Defer, Unzip } from '@fp4ts/cats-core';
import { ArrowApply, ArrowChoice, ArrowLoop } from '@fp4ts/cats-arrow';
import {
  ArrowApplySuite,
  ArrowChoiceSuite,
  ArrowLoopSuite,
} from '@fp4ts/cats-arrow-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Function', () => {
  checkAll(
    'ArrowApply<Function>',
    ArrowApplySuite(ArrowApply.Function1).arrowApply(
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
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      <X, Y>(ecx: ExhaustiveCheck<X>, ecy: ExhaustiveCheck<Y>) =>
        ecy.map(y => (x: X) => y),
    ),
  );

  checkAll(
    'ArrowChoice<Function>',
    ArrowChoiceSuite(ArrowChoice.Function1).arrowChoice(
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
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
    ),
  );

  checkAll(
    'ArrowLoop<Function>',
    ArrowLoopSuite(ArrowLoop.Function1).arrowLoop(
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
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      { ...Defer.Eval, ...Unzip.Eval },
      A.fp4tsEval,
    ),
  );
});
