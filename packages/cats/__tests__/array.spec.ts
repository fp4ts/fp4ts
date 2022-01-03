// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import '@fp4ts/cats-core/lib/data/collections/array/array';
import { Eq, Eval, EvalK, AdditionMonoid } from '@fp4ts/cats-core';
import {
  AlignSuite,
  AlternativeSuite,
  FunctorFilterSuite,
  MonadSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Array laws', () => {
  const alignTests = AlignSuite(Array.Align);
  checkAll(
    'Align<Vector>',
    alignTests.align(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
    ),
  );

  const functorFilterTests = FunctorFilterSuite(Array.FunctorFilter);
  checkAll(
    'FunctorFilter<Vector>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
    ),
  );

  const alternativeTests = AlternativeSuite(Array.Alternative);
  checkAll(
    'Alternative<Vector>',
    alternativeTests.alternative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
    ),
  );

  const monadTests = MonadSuite(Array.Monad);
  checkAll(
    'Monad<Vector>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
    ),
  );

  const traversableTests = TraversableSuite(Array.Traversable);
  checkAll(
    'Traversable<Vector>',
    traversableTests.traversable<number, number, number, EvalK, EvalK>(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      Array.Functor,
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
      A.fp4tsEval,
      Eval.Eq,
      A.fp4tsEval,
      Eval.Eq,
    ),
  );
});
