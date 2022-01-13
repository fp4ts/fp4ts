// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id } from '@fp4ts/core';
import { Monoid, Eq, Eval } from '@fp4ts/cats-core';
import { Identity } from '@fp4ts/cats-core/lib/data';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { MonadSuite, TraversableSuite } from '@fp4ts/cats-laws';

describe('Identity Laws', () => {
  const monadTests = MonadSuite(Identity.Monad);
  checkAll(
    'Monad<Identity>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
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
      Monoid.addition,
      Monoid.addition,
      Identity.Functor,
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      id,
      id,
      A.fp4tsEval,
      Eval.Eq,
      A.fp4tsEval,
      Eval.Eq,
    ),
  );
});
