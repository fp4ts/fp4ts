// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval } from '@fp4ts/core';
import { Comonad, Defer, Monad, Unzip } from '@fp4ts/cats-core';
import {
  Closed,
  Cochoice,
  Corepresentable,
  Strong,
} from '@fp4ts/cats-profunctor';
import {
  ClosedSuite,
  CochoiceSuite,
  CorepresentableSuite,
  StrongSuite,
} from '@fp4ts/cats-profunctor-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Cokleisli', () => {
  checkAll(
    'Corepresentable<Eval<*> => *>',
    CorepresentableSuite(Corepresentable.Cokleisli(Monad.Eval)).corepresentable(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      (X, Y) => eq.fn1Eq(X.map(Eval.now), Y),
      X => X.map(Eval.now),
      { ...Defer.Eval, ...Unzip.Eval },
      A.fp4tsEval,
    ),
  );

  checkAll(
    'Cochoice<Eval<*> => *>',
    CochoiceSuite(Cochoice.Cokleisli(Monad.Eval)).cochoice(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      (X, Y) => eq.fn1Eq(X.map(Eval.now), Y),
    ),
  );

  checkAll(
    'Closed<Eval<*> => *>',
    ClosedSuite(Closed.Cokleisli(Monad.Eval)).closed(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      (X, Y) => eq.fn1Eq(X.map(Eval.now), Y),
    ),
  );

  checkAll(
    'Strong<* => Eval<*>>',
    StrongSuite(Strong.Cokleisli(Comonad.Eval)).strong(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      (X, Y) => eq.fn1Eq(X.map(Eval.now), Y),
    ),
  );
});
