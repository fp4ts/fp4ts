// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Defer, Unzip } from '@fp4ts/cats-core';
import { Proxy } from '@fp4ts/cats-core/lib/data';
import { Tagged } from '@fp4ts/cats-profunctor';
import {
  ChoiceSuite,
  ClosedSuite,
  CorepresentableSuite,
} from '@fp4ts/cats-profunctor-laws';
import { BifunctorSuite, MonadSuite } from '@fp4ts/cats-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Tagged', () => {
  checkAll(
    'Corepresentable<Tagged, Proxy>',
    CorepresentableSuite(Tagged.Corepresentable).corepresentable(
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
      (_, Y) => Y,
      (_, Y) => Y,
      () => ExhaustiveCheck(Proxy<any>()),
      { ...Defer.Eval, ...Unzip.Eval },
      A.fp4tsEval,
    ),
  );

  checkAll(
    'Closed<Tagged>',
    ClosedSuite(Tagged.Closed).closed(
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
      (_, Y) => Y,
      (_, Y) => Y,
    ),
  );

  checkAll(
    'Strong<Tagged>',
    ChoiceSuite(Tagged.Choice).choice(
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
      (_, Y) => Y,
      (_, Y) => Y,
    ),
  );

  checkAll(
    'Bifunctor<Tagged>',
    BifunctorSuite(Tagged.Bifunctor).bifunctor(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      (X, Y) => Y,
      (X, Y) => Y,
    ),
  );

  checkAll(
    'Monad<Tagged>',
    MonadSuite(Tagged.Monad<any>()).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      id,
      Tagged.EqK().liftEq,
    ),
  );
});
