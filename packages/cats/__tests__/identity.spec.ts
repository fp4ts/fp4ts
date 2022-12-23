// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id } from '@fp4ts/core';
import { CommutativeMonoid, Eq } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { Identity } from '@fp4ts/cats-core/lib/data';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { ComonadSuite, MonadSuite, TraversableSuite } from '@fp4ts/cats-laws';

describe('Identity Laws', () => {
  const comonadTests = ComonadSuite(Identity.Comonad);
  checkAll(
    'Comonad<Identity>',
    comonadTests.comonad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      id,
      id,
    ),
  );

  const monadTests = MonadSuite(Identity.Monad);
  checkAll(
    'Monad<Identity>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      id,
      id,
    ),
  );

  const traversableTests = TraversableSuite(Identity.Traversable);
  checkAll(
    'Traversable<Identity>',
    traversableTests.traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      CommutativeMonoid.addition,
      CommutativeMonoid.addition,
      Identity.Functor,
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      id,
      id,
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );
});
