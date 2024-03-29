// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import {
  CoflatMap,
  Distributive,
  Monad,
  MonadFix,
  Traversable,
} from '@fp4ts/cats-core';
import {
  CoflatMapSuite,
  DistributiveSuite,
  MonadDeferSuite,
} from '@fp4ts/cats-laws';
import { checkAll, MiniInt, ExhaustiveCheck } from '@fp4ts/cats-test-kit';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Function1', () => {
  describe('fix point', () => {
    it('should replicate and sum the value', () => {
      const replicate = MonadFix.Function1<number>().fix<(n: number) => number>(
        rec => r => n => n <= 0 ? 0 : rec.value(n - 1) + r,
      );

      expect(replicate(42)(42)).toBe(42 * 42);
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
    const xs = [...new Array(1_000_000)];
    expect(
      Traversable.Array.traverse_(Monad.Function1<unknown>())(xs, x => _ => x)(
        null,
      ),
    ).toEqual(xs);
  });
});
