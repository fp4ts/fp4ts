// Copyright (c) 2021-2023 Peter Matta
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
import {
  ComonadSuite,
  MonadSuite,
  TraversableSuite,
  UnzipSuite,
} from '@fp4ts/cats-laws';

describe('Identity Laws', () => {
  checkAll(
    'Comonad<Identity>',
    ComonadSuite(Identity.Comonad).comonad(
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

  checkAll(
    'Monad<Identity>',
    MonadSuite(Identity.Monad).monad(
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

  checkAll(
    'Unzip<Identity>',
    UnzipSuite(Identity.Unzip).unzip(
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

  checkAll(
    'Traversable<Identity>',
    TraversableSuite(Identity.Traversable).traversable(
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
