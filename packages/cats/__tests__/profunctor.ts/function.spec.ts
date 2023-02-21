// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { id } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Identity } from '@fp4ts/cats-core/lib/data';
import { Cochoice, Corepresentable, Mapping } from '@fp4ts/cats-profunctor';
import {
  CochoiceSuite,
  CorepresentableSuite,
  MappingSuite,
} from '@fp4ts/cats-profunctor-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Function1', () => {
  checkAll(
    'Mapping<* => *>',
    MappingSuite(Mapping.Function1).mapping(
      A.fp4tsMiniInt(),
      fc.integer(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.integer(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      Identity.Traversable,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      id,
      id,
    ),
  );

  checkAll(
    'Corepresentable<* => *>',
    CorepresentableSuite(Corepresentable.Function1).corepresentable(
      A.fp4tsMiniInt(),
      fc.integer(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.integer(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      id,
    ),
  );

  checkAll(
    'Cochoice<* => *>',
    CochoiceSuite(Cochoice.Function1).cochoice(
      A.fp4tsMiniInt(),
      fc.integer(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.integer(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
    ),
  );
});
