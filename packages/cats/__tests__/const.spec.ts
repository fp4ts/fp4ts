// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Monoid, Eq } from '@fp4ts/cats-kernel';
import { Eval } from '@fp4ts/cats-core';
import { Const } from '@fp4ts/cats-core/lib/data';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import {
  TraversableSuite,
  ApplicativeSuite,
  FunctorFilterSuite,
} from '@fp4ts/cats-laws';

describe('Const Laws', () => {
  const functorFilterTests = FunctorFilterSuite(Const.FunctorFilter<number>());
  checkAll(
    'Monad<Const>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => x.map(Const.pure(Monoid.addition)),
      () => Eq.primitive,
    ),
  );

  const applicativeTests = ApplicativeSuite(Const.Applicative(Monoid.addition));
  checkAll(
    'Monad<Const>',
    applicativeTests.applicative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => x.map(Const.pure(Monoid.addition)),
      () => Eq.primitive,
    ),
  );

  const traversableTests = TraversableSuite(Const.Traversable(Monoid.addition));
  checkAll(
    'Traversable<Const>',
    traversableTests.traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      Const.Functor(),
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => x.map(Const.pure(Monoid.addition)),
      () => Eq.primitive,
      A.fp4tsEval,
      Eval.Eq,
      A.fp4tsEval,
      Eval.Eq,
    ),
  );
});
