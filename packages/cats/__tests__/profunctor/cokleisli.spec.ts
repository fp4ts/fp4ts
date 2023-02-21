// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats-core';
import { Closed, Cochoice, Corepresentable } from '@fp4ts/cats-profunctor';
import {
  ClosedSuite,
  CochoiceSuite,
  CorepresentableSuite,
} from '@fp4ts/cats-profunctor-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

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
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      (X, Y) => eq.fn1Eq(ec.instance(X.allValues.map(Eval.now)), Y),
      X => ec.instance(X.allValues.map(Eval.now)),
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
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      (X, Y) => eq.fn1Eq(ec.instance(X.allValues.map(Eval.now)), Y),
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
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      ec.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[Eval<X>], Y>(Y),
      (X, Y) => eq.fn1Eq(ec.instance(X.allValues.map(Eval.now)), Y),
    ),
  );
});
