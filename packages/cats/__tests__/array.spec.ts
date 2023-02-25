// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, CommutativeMonoid } from '@fp4ts/cats-kernel';
import {
  CoflatMap,
  FunctorFilter,
  FunctorWithIndex,
  Monad,
  MonadPlus,
  TraversableFilter,
  TraversableWithIndex,
  Unalign,
  Unzip,
} from '@fp4ts/cats-core';
import {
  CoflatMapSuite,
  MonadPlusSuite,
  TraversableFilterSuite,
  TraversableWithIndexSuite,
  UnalignSuite,
  UnzipSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Array laws', () => {
  checkAll(
    'Unalign<Array>',
    UnalignSuite(Unalign.Array).unalign(
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
    'Unzip<Array>',
    UnzipSuite(Unzip.Array).unzip(
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
    'CoflatMap<Array>',
    CoflatMapSuite(CoflatMap.Array).coflatMap(
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
    'MonadPlus<Array>',
    MonadPlusSuite(MonadPlus.Array).monadPlus(
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
