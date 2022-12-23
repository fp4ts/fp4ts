// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Monoid, CommutativeMonoid, Eq } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { Const } from '@fp4ts/cats-core/lib/data';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import {
  ApplicativeSuite,
  ContravariantSuite,
  TraversableFilterSuite,
} from '@fp4ts/cats-laws';

describe('Const Laws', () => {
  checkAll(
    'Contravariant<Const<number, *>>',
    ContravariantSuite(Const.Contravariant<number>()).contravariant(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ec.miniInt(),
      ec.miniInt(),
      x => x.map(Const.pure(Monoid.addition)),
      () => Eq.fromUniversalEquals(),
    ),
  );

  checkAll(
    'Applicative<Const>',
    ApplicativeSuite(Const.Applicative(Monoid.addition)).applicative(
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

  checkAll(
    'TraversableFilter<Const<number, *>>',
    TraversableFilterSuite(Const.TraversableFilter<number>()).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      CommutativeMonoid.addition,
      CommutativeMonoid.addition,
      Const.Functor(),
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => x.map(Const.pure(Monoid.addition)),
      () => Eq.fromUniversalEquals(),
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );
});
