// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Monoid, CommutativeMonoid, Eq } from '@fp4ts/cats-kernel';
import { Eval } from '@fp4ts/cats-core';
import { Const } from '@fp4ts/cats-core/lib/data';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import {
  TraversableSuite,
  ApplicativeSuite,
  FunctorFilterSuite,
  ContravariantSuite,
} from '@fp4ts/cats-laws';

describe('Const Laws', () => {
  const functorFilterTests = FunctorFilterSuite(Const.FunctorFilter<number>());
  checkAll(
    'FunctorFilter<Const<number, *>>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => x.map(Const.pure(Monoid.addition)),
      () => Eq.fromUniversalEquals(),
    ),
  );

  const contravariantTests = ContravariantSuite(Const.Contravariant<number>());
  checkAll(
    'Contravariant<Const<number, *>>',
    contravariantTests.contravariant(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ec.miniInt(),
      ec.miniInt(),
      x => x.map(Const.pure(Monoid.addition)),
      () => Eq.fromUniversalEquals(),
    ),
  );

  const applicativeTests = ApplicativeSuite(Const.Applicative(Monoid.addition));
  checkAll(
    'Monad<Const>',
    applicativeTests.applicative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => x.map(Const.pure(Monoid.addition)),
      () => Eq.fromUniversalEquals(),
    ),
  );

  const traversableTests = TraversableSuite(Const.Traversable<number>());
  checkAll(
    'Traversable<Const<number, *>>',
    traversableTests.traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      CommutativeMonoid.addition,
      CommutativeMonoid.addition,
      Const.Functor(),
      Eval.Applicative,
      Eval.Applicative,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => x.map(Const.pure(Monoid.addition)),
      () => Eq.fromUniversalEquals(),
      A.fp4tsEval,
      Eval.Eq,
      A.fp4tsEval,
      Eval.Eq,
    ),
  );
});
