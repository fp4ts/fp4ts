// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { MonoidSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Monoids', () => {
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
      expect(Monoid.conjunction.combine_(lhs, () => rhs)).toBe(result);
    });

    checkAll(
      'Monoid<ConjunctionMonoid>',
      MonoidSuite(Monoid.conjunction).monoid(fc.boolean(), Eq.primitive),
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
      expect(Monoid.disjunction.combine_(lhs, () => rhs)).toBe(result);
    });

    checkAll(
      'Monoid<DisjunctionMonoid>',
      MonoidSuite(Monoid.disjunction).monoid(fc.boolean(), Eq.primitive),
    );
  });

  describe('Addition', () => {
    test('empty to be zero', () => {
      expect(Monoid.addition.empty).toBe(0);
    });

    test.each`
      lhs    | rhs   | result
      ${2}   | ${3}  | ${5}
      ${-10} | ${10} | ${0}
      ${-15} | ${10} | ${-5}
      ${-10} | ${15} | ${5}
    `('combine $lhs and $rhs to be $result', ({ lhs, rhs, result }) => {
      expect(Monoid.addition.combine_(lhs, () => rhs)).toBe(result);
    });

    checkAll(
      'Monoid<AdditionMonoid> for integers',
      MonoidSuite(Monoid.addition).monoid(fc.integer(), Eq.primitive),
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
      'Monoid<ProductMonoid> for integers',
      MonoidSuite(Monoid.product).monoid(
        // to keep the values within the integer range
        fc.integer({ min: -10_000, max: 10_000 }),
        Eq.primitive,
      ),
    );
  });

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
      'Monoid<StringMonoid>',
      MonoidSuite(Monoid.string).monoid(fc.string(), Eq.primitive),
    );
  });
});
