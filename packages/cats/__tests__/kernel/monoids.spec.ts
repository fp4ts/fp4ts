// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { CommutativeMonoid, Eq, Monoid } from '@fp4ts/cats-kernel';
import { CommutativeMonoidSuite, MonoidSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Monoids', () => {
  describe('String', () => {
    test('empty to be an empty string', () => {
      expect(Monoid.string.empty).toBe('');
    });

    test.each`
      lhs       | rhs       | result
      ${'a'}    | ${'b'}    | ${'ab'}
      ${'cd'}   | ${'ab'}   | ${'cdab'}
      ${'abcd'} | ${'e'}    | ${'abcde'}
      ${'e'}    | ${'abcd'} | ${'eabcd'}
    `('combine $lhs and $rhs to be $result', ({ lhs, rhs, result }) => {
      expect(Monoid.string.combine_(lhs, () => rhs)).toBe(result);
    });

    checkAll(
      'Monoid<string>',
      MonoidSuite(Monoid.string).monoid(fc.string(), Eq.primitive),
    );
  });
});

describe('CommutativeMonoids', () => {
  describe('conjunction', () => {
    test('empty to be true', () => {
      expect(Monoid.conjunction.empty).toBe(true);
    });

    test.each`
      lhs      | rhs      | result
      ${true}  | ${true}  | ${true}
      ${true}  | ${false} | ${false}
      ${false} | ${true}  | ${false}
      ${false} | ${false} | ${false}
    `('combine $lhs and $rhs to be $result', ({ lhs, rhs, result }) => {
      expect(CommutativeMonoid.conjunction.combine_(lhs, () => rhs)).toBe(
        result,
      );
    });

    checkAll(
      'CommutativeMonoid<boolean>',
      CommutativeMonoidSuite(CommutativeMonoid.conjunction).commutativeMonoid(
        fc.boolean(),
        Eq.primitive,
      ),
    );
  });

  describe('Disjunction', () => {
    test('empty to be false', () => {
      expect(Monoid.disjunction.empty).toBe(false);
    });

    test.each`
      lhs      | rhs      | result
      ${true}  | ${true}  | ${true}
      ${true}  | ${false} | ${true}
      ${false} | ${true}  | ${true}
      ${false} | ${false} | ${false}
    `('combine $lhs and $rhs to be $result', ({ lhs, rhs, result }) => {
      expect(CommutativeMonoid.disjunction.combine_(lhs, () => rhs)).toBe(
        result,
      );
    });

    checkAll(
      'CommutativeMonoid<boolean>',
      CommutativeMonoidSuite(CommutativeMonoid.disjunction).commutativeMonoid(
        fc.boolean(),
        Eq.primitive,
      ),
    );
  });

  describe('Addition', () => {
    test('empty to be zero', () => {
      expect(CommutativeMonoid.addition.empty).toBe(0);
    });

    test.each`
      lhs    | rhs   | result
      ${2}   | ${3}  | ${5}
      ${-10} | ${10} | ${0}
      ${-15} | ${10} | ${-5}
      ${-10} | ${15} | ${5}
    `('combine $lhs and $rhs to be $result', ({ lhs, rhs, result }) => {
      expect(CommutativeMonoid.addition.combine_(lhs, () => rhs)).toBe(result);
    });

    checkAll(
      'CommutativeMonoid<number>',
      CommutativeMonoidSuite(CommutativeMonoid.addition).commutativeMonoid(
        fc.integer(),
        Eq.primitive,
      ),
    );
  });

  describe('Product', () => {
    test('empty to be one', () => {
      expect(Monoid.product.empty).toBe(1);
    });

    test.each`
      lhs    | rhs   | result
      ${2}   | ${3}  | ${6}
      ${-10} | ${10} | ${-100}
      ${-15} | ${10} | ${-150}
      ${-10} | ${15} | ${-150}
    `('combine $lhs and $rhs to be $result', ({ lhs, rhs, result }) => {
      expect(Monoid.product.combine_(lhs, () => rhs)).toBe(result);
    });

    checkAll(
      'CommutativeMonoid<number>',
      CommutativeMonoidSuite(CommutativeMonoid.product).commutativeMonoid(
        // to keep the values within the integer range
        fc.integer({ min: -10_000, max: 10_000 }),
        Eq.primitive,
      ),
    );
  });

  checkAll(
    'CommutativeMonoid<void>',
    CommutativeMonoidSuite(CommutativeMonoid.void).commutativeMonoid(
      fc.constant(undefined as void),
      Eq.fromUniversalEquals<void>(),
    ),
  );
});
