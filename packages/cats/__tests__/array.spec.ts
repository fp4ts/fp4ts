// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Array } from '@fp4ts/cats-core/lib/data/collections/array';
import { Eval } from '@fp4ts/cats-core';
import {
  AlignSuite,
  AlternativeSuite,
  CoflatMapSuite,
  FunctorFilterSuite,
  MonadSuite,
  TraversableWithIndexSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Array laws', () => {
  const alignTests = AlignSuite(Array.Align());
  checkAll(
    'Align<Array>',
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

  const functorFilterTests = FunctorFilterSuite(Array.FunctorFilter());
  checkAll(
    'FunctorFilter<Array>',
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

  const alternativeTests = AlternativeSuite(Array.Alternative());
  checkAll(
    'Alternative<Array>',
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

  const coflatMapTests = CoflatMapSuite(Array.CoflatMap());
  checkAll(
    'CoflatMap<Array>',
    coflatMapTests.coflatMap(
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

  const monadTests = MonadSuite(Array.Monad());
  checkAll(
    'Monad<Array>',
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

  checkAll(
    'TraversableWithIndex<Array, number>',
    TraversableWithIndexSuite(
      Array.TraversableWithIndex(),
    ).traversableWithIndex(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      Array.FunctorWithIndex(),
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
