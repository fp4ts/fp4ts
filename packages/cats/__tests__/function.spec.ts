// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Function1 } from '@fp4ts/cats-core/lib/data';
import { Eq } from '@fp4ts/cats-kernel';
import {
  ArrowApplySuite,
  ArrowChoiceSuite,
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
      const fact = Function1.Defer<number>().fix<number>(
        rec => n => n <= 1 ? 1 : n * rec(n - 1),
      );
      expect(fact(5)).toBe(120);
    });
  });

  checkAll(
    'Defer<Function1<MiniInt, *>',
    DeferSuite(Function1.Defer<MiniInt>()).defer(
      fc.integer(),
      Eq.fromUniversalEquals(),
      fc.func,
      EqX => eq.fn1Eq(ec.miniInt(), EqX),
    ),
  );

  checkAll(
    'Distributive<Function1<number, *>>',
    DistributiveSuite(Function1.Distributive<MiniInt>()).distributive(
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
    'Monad<Function1<number, *>>',
    MonadSuite(Function1.Monad<MiniInt>()).monad(
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
    ArrowApplySuite(Function1.ArrowApply).arrowApply(
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
    ArrowChoiceSuite(Function1.ArrowChoice).arrowChoice(
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
});
