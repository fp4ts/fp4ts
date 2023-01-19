// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, CommutativeMonoid } from '@fp4ts/cats-kernel';
import { Array } from '@fp4ts/cats-core/lib/data/collections/array';
import {
  AlignSuite,
  AlternativeSuite,
  CoflatMapSuite,
  FunctorFilterSuite,
  MonadSuite,
  TraversableFilterSuite,
  TraversableWithIndexSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { Monad } from '@fp4ts/cats-core';

describe('Array laws', () => {
  const alignTests = AlignSuite(Array.Align());
  checkAll(
    'Align<Array>',
    alignTests.align(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
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
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
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
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
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
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
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
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
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
      CommutativeMonoid.addition,
      CommutativeMonoid.addition,
      Array.FunctorWithIndex(),
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      fc.array,
      Array.Eq,
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );

  checkAll(
    'TraversableFilter<Array, number>',
    TraversableFilterSuite(Array.TraversableFilter()).traversableFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      CommutativeMonoid.addition,
      CommutativeMonoid.addition,
      Array.FunctorFilter(),
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      fc.array,
      Array.Eq,
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );
});
