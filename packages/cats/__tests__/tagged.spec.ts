// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Tagged } from '@fp4ts/cats-core/lib/data';
import { Eq } from '@fp4ts/cats-kernel';
import { MonadSuite, ProfunctorSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Tagged', () => {
  const monadTests = MonadSuite(Tagged.Monad());
  checkAll(
    'Monad<Tagged<unknown, *>>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.fp4tsTagged(),
      Tagged.EqK().liftEq,
    ),
  );

  const profunctorTests = ProfunctorSuite(Tagged.Profunctor);

  checkAll(
    'Profunctor<Tagged>',
    profunctorTests.profunctor(
      A.fp4tsMiniInt(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      Eq.primitive,
      ec.miniInt(),
      Eq.primitive,
      (X, Y) => A.fp4tsTagged()(Y),
      (X, Y) => Tagged.EqK().liftEq(Y),
    ),
  );
});
