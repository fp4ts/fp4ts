// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import {
  CommutativeMonoid,
  CommutativeSemigroup,
  Eq,
  Monoid,
  Semigroup,
} from '@fp4ts/cats-kernel';
import {
  CommutativeMonoidSuite,
  CommutativeSemigroupSuite,
  EqSuite,
  MonoidSuite,
  SemigroupSuite,
} from '@fp4ts/cats-kernel-laws';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Record instances', () => {
  const recordArb = <K extends string | number | symbol, A>(
    arbK: Arbitrary<K>,
    arbA: Arbitrary<A>,
  ): Arbitrary<Record<K, A>> =>
    fc.array(fc.tuple(arbK, arbA)).map(Object.fromEntries);

  checkAll(
    'Eq<Record<string, number>>',
    EqSuite(Eq.Record(Eq.fromUniversalEquals<number>())).eq(
      fc.dictionary(fc.string(), fc.integer()),
    ),
  );

  checkAll(
    'Semigroup<Record<string, string>>',
    SemigroupSuite(Semigroup.Record(Semigroup.string)).semigroup(
      recordArb(fc.string(), fc.string()),
      Eq.Record(Eq.fromUniversalEquals<string>()),
    ),
  );

  checkAll(
    'CommutativeSemigroup<Record<string, string>>',
    CommutativeSemigroupSuite(
      CommutativeSemigroup.Record(CommutativeSemigroup.addition),
    ).semigroup(
      fc.dictionary(fc.string(), fc.integer()),
      Eq.Record(Eq.fromUniversalEquals<number>()),
    ),
  );

  checkAll(
    'Monoid<Record<string, string>>',
    MonoidSuite(Monoid.Record(Monoid.string)).monoid(
      recordArb(fc.string(), fc.string()),
      Eq.Record(Eq.fromUniversalEquals<string>()),
    ),
  );

  checkAll(
    'CommutativeMonoid<Record<string, number>>',
    CommutativeMonoidSuite(
      CommutativeMonoid.Record(CommutativeMonoid.addition),
    ).monoid(
      fc.dictionary(fc.string(), fc.integer()),
      Eq.Record(Eq.fromUniversalEquals<number>()),
    ),
  );
});
