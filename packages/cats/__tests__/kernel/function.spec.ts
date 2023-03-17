// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval, throwError } from '@fp4ts/core';
import {
  CommutativeMonoid,
  Eq,
  Monoid,
  Ord,
  Semigroup,
} from '@fp4ts/cats-kernel';
import {
  CommutativeMonoidSuite,
  MonoidSuite,
  OrdSuite,
} from '@fp4ts/cats-kernel-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Function0 instances', () => {
  checkAll(
    'Ord<() => number>',
    OrdSuite(Ord.Function0(Ord.fromUniversalCompare<number>())).ord(
      fc.integer().map(x => () => x),
    ),
  );

  checkAll(
    'Ord<() => string>',
    OrdSuite(Ord.Function0(Ord.fromUniversalCompare<string>())).ord(
      fc.string().map(x => () => x),
    ),
  );

  checkAll(
    'Monoid<() => string>',
    MonoidSuite(Monoid.Function0(Monoid.string)).monoid(
      fc.string().map(x => () => x),
      Eq.Function0(Eq.fromUniversalEquals()),
    ),
  );

  checkAll(
    'CommutativeMonoid<() => string>',
    CommutativeMonoidSuite(
      CommutativeMonoid.Function0(CommutativeMonoid.addition),
    ).commutativeMonoid(
      fc.integer().map(x => () => x),
      Eq.Function0(Eq.fromUniversalEquals()),
    ),
  );

  test('Semigroup short-circuits on combineEval_', () => {
    const f = () => true;
    const g = () => throwError(new Error());
    expect(
      Semigroup.Function0(CommutativeMonoid.disjunction)
        .combineEval_(f, Eval.now(g))
        .value(),
    ).toBe(true);
  });
});

describe('Function1 instances', () => {
  checkAll(
    'Monoid<MiniInt => string>',
    MonoidSuite(Monoid.Function1<MiniInt, string>(Monoid.string)).monoid(
      fc.func(fc.string()),
      eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.fromUniversalEquals()),
    ),
  );

  checkAll(
    'Monoid<Endo<MiniInt>>',
    MonoidSuite(Monoid.Endo<MiniInt>()).monoid(
      fc.func(A.fp4tsMiniInt()),
      eq.fn1Eq(ExhaustiveCheck.miniInt(), MiniInt.Eq),
    ),
  );

  checkAll(
    'CommutativeMonoid<MiniInt => number>',
    CommutativeMonoidSuite(
      CommutativeMonoid.Function1<MiniInt, number>(CommutativeMonoid.addition),
    ).commutativeMonoid(
      fc.func(fc.integer()),
      eq.fn1Eq(ExhaustiveCheck.miniInt(), Eq.fromUniversalEquals()),
    ),
  );

  test('Endo stack safe combine', () => {
    const size = 100_000;
    const M = Monoid.Endo<number>();
    let f = M.empty;
    for (let i = 0; i < size; i++) {
      f = M.combine_(f, x => x + 1);
    }
    expect(f(0)).toBe(size);
  });

  test('Endo stack safe combine', () => {
    const size = 100_000;
    const M = Monoid.Endo<number>();
    let f = M.empty;
    for (let i = 0; i < size; i++) {
      f = M.combine_(x => x + 1, f);
    }
    expect(f(0)).toBe(size);
  });

  test('Semigroup short-circuits on combineEval_', () => {
    const f = (_: unknown) => true;
    const g = (_: unknown) => throwError(new Error());
    expect(
      Semigroup.Function1(CommutativeMonoid.disjunction)
        .combineEval_(f, Eval.now(g))
        .value(null),
    ).toBe(true);
  });
});
