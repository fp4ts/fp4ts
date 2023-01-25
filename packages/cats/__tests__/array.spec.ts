// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, CommutativeMonoid } from '@fp4ts/cats-kernel';
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
import {
  Align,
  Alternative,
  CoflatMap,
  FunctorFilter,
  FunctorWithIndex,
  Monad,
  TraversableFilter,
  TraversableWithIndex,
} from '@fp4ts/cats-core';

describe('Array laws', () => {
  const alignTests = AlignSuite(Align.Array);
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
      Eq.Array,
    ),
  );

  const functorFilterTests = FunctorFilterSuite(FunctorFilter.Array);
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
      Eq.Array,
    ),
  );

  const alternativeTests = AlternativeSuite(Alternative.Array);
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
      Eq.Array,
    ),
  );

  const coflatMapTests = CoflatMapSuite(CoflatMap.Array);
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
      Eq.Array,
    ),
  );

  const monadTests = MonadSuite(Monad.Array);
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
      Eq.Array,
    ),
  );

  checkAll(
    'TraversableWithIndex<Array, number>',
    TraversableWithIndexSuite(TraversableWithIndex.Array).traversableWithIndex(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      CommutativeMonoid.addition,
      CommutativeMonoid.addition,
      FunctorWithIndex.Array,
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      fc.array,
      Eq.Array,
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );

  checkAll(
    'TraversableFilter<Array>',
    TraversableFilterSuite(TraversableFilter.Array).traversableFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      CommutativeMonoid.addition,
      CommutativeMonoid.addition,
      FunctorFilter.Array,
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      fc.array,
      Eq.Array,
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );
});
