// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Dual } from '@fp4ts/cats-core/lib/data';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { MonadSuite, MonoidSuite, TraversableSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { Eval } from '@fp4ts/cats-core';

describe('Dual', () => {
  checkAll(
    'Monoid<Dual<number>>',
    MonoidSuite(Dual.Monoid(Monoid.addition)).monoid(
      A.fp4tsDual(fc.integer()),
      Dual.EqK.liftEq(Eq.primitive),
    ),
  );

  checkAll(
    'Monoid<Dual<string>>',
    MonoidSuite(Dual.Monoid(Monoid.string)).monoid(
      A.fp4tsDual(fc.string()),
      Dual.EqK.liftEq(Eq.primitive),
    ),
  );

  checkAll(
    'Monoid<Dual>',
    MonadSuite(Dual.Monad).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.fp4tsDual,
      Dual.EqK.liftEq,
    ),
  );

  checkAll(
    'Monoid<Dual>',
    TraversableSuite(Dual.Traversable).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      Dual.Monad,
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.fp4tsDual,
      Dual.EqK.liftEq,
      A.fp4tsEval,
      Eval.Eq,
      A.fp4tsEval,
      Eval.Eq,
    ),
  );
});
