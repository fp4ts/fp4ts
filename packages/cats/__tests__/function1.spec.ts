// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import {
  ArrowApply,
  ArrowChoice,
  CoflatMap,
  Defer,
  Distributive,
  Monad,
} from '@fp4ts/cats-core';
import { List } from '@fp4ts/cats-core/lib/data';
import {
  ArrowApplySuite,
  ArrowChoiceSuite,
  CoflatMapSuite,
  DeferSuite,
  DistributiveSuite,
  MonadSuite,
} from '@fp4ts/cats-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
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
    'Defer<Function1<MiniInt, *>',
    DeferSuite(Defer.Function1<MiniInt>()).defer(
      fc.integer(),
      Eq.fromUniversalEquals(),
      fc.func,
      EqX => eq.fn1Eq(ec.miniInt(), EqX),
    ),
  );

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
      <X>(EqX: Eq<X>) => eq.fn1Eq(ec.miniInt(), EqX),
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
      <X>(EqX: Eq<X>) => eq.fn1Eq(ec.miniInt(), EqX),
    ),
  );

  checkAll(
    'Monad<Function1<MiniInt, *>>',
    MonadSuite(Monad.Function1<MiniInt>()).monad(
      fc.string(),
      fc.string(),
      fc.string(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(arbX: Arbitrary<X>) => fc.func<[MiniInt], X>(arbX),
      <X>(EqX: Eq<X>) => eq.fn1Eq(ec.miniInt(), EqX),
    ),
  );

  checkAll(
    'ArrowApply<Function1>',
    ArrowApplySuite(ArrowApply.Function1).arrowApply(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      <X, Y>(ecx: ExhaustiveCheck<X>, ecy: ExhaustiveCheck<Y>) =>
        ec.instance(ecy.allValues.map(y => (x: X) => y)),
    ),
  );

  checkAll(
    'ArrowChoice<Function1>',
    ArrowChoiceSuite(ArrowChoice.Function1).arrowChoice(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
    ),
  );

  it('should be stack safe on traverse', () => {
    const xs = List.range(0, 1_000_000);
    expect(
      xs.traverse(Monad.Function1<unknown>(), x => _ => x)(null).toArray,
    ).toEqual(xs.toArray);
  });
});
