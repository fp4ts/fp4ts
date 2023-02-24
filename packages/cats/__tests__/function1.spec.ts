// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { CoflatMap, Defer, Distributive, Monad } from '@fp4ts/cats-core';
import { List } from '@fp4ts/cats-core/lib/data';
import {
  CoflatMapSuite,
  DistributiveSuite,
  MonadDeferSuite,
} from '@fp4ts/cats-laws';
import { checkAll, MiniInt, ExhaustiveCheck } from '@fp4ts/cats-test-kit';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Function1', () => {
  describe('fix point', () => {
    it('should calculate factorial', () => {
      const fact = Defer.Function1<number>().fix<number>(
        rec => n => n <= 1 ? 1 : n * rec(n - 1),
      );
      expect(fact(5)).toBe(120);
    });
  });

  checkAll(
    'Distributive<Function1<MiniInt, *>>',
    DistributiveSuite(Distributive.Function1<MiniInt>()).distributive(
      fc.string(),
      fc.string(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(arbX: Arbitrary<X>) => fc.func<[MiniInt], X>(arbX),
      <X>(EqX: Eq<X>) => eq.fn1Eq(ExhaustiveCheck.miniInt(), EqX),
    ),
  );

  checkAll(
    'CoflatMap<Function1<MiniInt, *>>',
    CoflatMapSuite(CoflatMap.Function1<MiniInt>()).coflatMap(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(arbX: Arbitrary<X>) => fc.func<[MiniInt], X>(arbX),
      <X>(EqX: Eq<X>) => eq.fn1Eq(ExhaustiveCheck.miniInt(), EqX),
    ),
  );

  checkAll(
    'MonadDefer<Function1<MiniInt, *>>',
    MonadDeferSuite(Monad.Function1<MiniInt>()).monadDefer(
      fc.string(),
      fc.string(),
      fc.string(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(arbX: Arbitrary<X>) => fc.func<[MiniInt], X>(arbX),
      <X>(EqX: Eq<X>) => eq.fn1Eq(ExhaustiveCheck.miniInt(), EqX),
    ),
  );

  it('should be stack safe on traverse', () => {
    const xs = List.range(0, 1_000_000);
    expect(
      xs.traverse(Monad.Function1<unknown>(), x => _ => x)(null).toArray,
    ).toEqual(xs.toArray);
  });
});
