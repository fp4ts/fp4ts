// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Tagged } from '@fp4ts/cats-core/lib/data';
import { Eq } from '@fp4ts/cats-kernel';
import { BifunctorSuite, MonadSuite, ProfunctorSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Tagged', () => {
  checkAll(
    'Monad<Tagged<unknown, *>>',
    MonadSuite(Tagged.Monad()).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => X.map(Tagged),
      Tagged.EqK().liftEq,
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
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => Y.map(Tagged<X, Y>),
      <X, Y>(X: Eq<X>, Y: Eq<Y>) => Tagged.EqK<X>().liftEq(Y),
    ),
  );

  checkAll(
    'Profunctor<Tagged>',
    ProfunctorSuite(Tagged.Profunctor).profunctor(
      A.fp4tsMiniInt(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => Y.map(Tagged<X, Y>),
      <X, Y>(X: ec.ExhaustiveCheck<X>, Y: Eq<Y>) => Tagged.EqK<X>().liftEq(Y),
    ),
  );
});
