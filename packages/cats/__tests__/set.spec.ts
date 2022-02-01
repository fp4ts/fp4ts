// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id } from '@fp4ts/core';
import { Ord, Eq, Monoid } from '@fp4ts/cats-core';
import { Set, List, Some, None } from '@fp4ts/cats-core/lib/data';
import { isValid } from '@fp4ts/cats-core/lib/data/collections/set/operators';
import { FoldableSuite } from '@fp4ts/cats-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('set', () => {
  describe('types', () => {
    it('should be covariant', () => {
      const s: Set<number> = Set.empty;
    });

    it('should disallow type expansion for unrelated types', () => {
      const s: Set<number> = Set(42);

      // @ts-expect-error
      s.insert('my-string');
    });
  });

  describe('constructors', () => {
    test('empty set to be empty', () => {
      expect(Set.empty.isEmpty).toBe(true);
    });

    test('singleton list not to be empty', () => {
      expect(Set(42).nonEmpty).toBe(true);
    });

    it('should create an ordered set from an unordered array', () => {
      const s = Set.fromArray([3, 4, 8, 4, 1, 99]);
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([1, 3, 4, 8, 99]);
    });

    it('should create an ordered set from an ordered array', () => {
      const s = Set.fromArray([1, 2, 3, 4, 5]);
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3, 4, 5]);
    });

    it('should create an ordered set from an unordered List', () => {
      const s = Set.fromList(List(3, 4, 8, 4, 1, 99));
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toList).toEqual(List(1, 3, 4, 8, 99));
    });

    it('should create an ordered set from an ordered List', () => {
      const s = Set.fromList(List(1, 2, 3, 4, 5));
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toList).toEqual(List(1, 2, 3, 4, 5));
    });
  });

  describe('head', () => {
    it('should throw when the set is empty', () => {
      expect(() => Set.empty.head).toThrow();
    });

    it('should return value of the singleton set', () => {
      expect(Set(42).head).toBe(42);
    });

    it('should return minimum value of the set', () => {
      expect(Set(5, 4, 3, 2, 1).head).toBe(1);
    });
  });

  describe('headOption', () => {
    it('should return None when empty', () => {
      expect(Set.empty.headOption).toEqual(None);
    });

    it('should return value of the singleton set', () => {
      expect(Set(42).headOption).toEqual(Some(42));
    });

    it('should return minimum value of the set', () => {
      expect(Set(5, 4, 3, 2, 1).headOption).toEqual(Some(1));
    });
  });

  describe('tail', () => {
    it('should return empty set when empty', () => {
      expect(Set.empty.tail).toEqual(Set.empty);
    });

    it('should return empty set when singleton', () => {
      expect(Set(42).tail).toEqual(Set.empty);
    });

    it('should return set without the min value', () => {
      expect(Set(5, 4, 3, 2, 1).tail.toArray).toEqual([2, 3, 4, 5]);
    });
  });

  describe('last', () => {
    it('should throw when the set is empty', () => {
      expect(() => Set.empty.last).toThrow();
    });

    it('should return value of the singleton set', () => {
      expect(Set(42).last).toBe(42);
    });

    it('should return maximum value of the set', () => {
      expect(Set(5, 4, 3, 2, 1).last).toBe(5);
    });
  });

  describe('lastOption', () => {
    it('should return None when empty', () => {
      expect(Set.empty.lastOption).toEqual(None);
    });

    it('should return value of the singleton set', () => {
      expect(Set(42).lastOption).toEqual(Some(42));
    });

    it('should return maximum value of the set', () => {
      expect(Set(5, 4, 3, 2, 1).lastOption).toEqual(Some(5));
    });
  });

  describe('init', () => {
    it('should return empty set when empty', () => {
      expect(Set.empty.init).toEqual(Set.empty);
    });

    it('should return empty set when singleton', () => {
      expect(Set(42).init).toEqual(Set.empty);
    });

    it('should return set without the max value', () => {
      expect(Set(5, 4, 3, 2, 1).init.toArray).toEqual([1, 2, 3, 4]);
    });
  });

  describe('min', () => {
    it('should return None when empty', () => {
      expect(Set.empty.min).toEqual(None);
    });

    it('should return value of the singleton set', () => {
      expect(Set(42).min).toEqual(Some(42));
    });

    it('should return minimum value of the set', () => {
      expect(Set(5, 4, 3, 2, 1).min).toEqual(Some(1));
    });
  });

  describe('popMin', () => {
    it('should return None when empty', () => {
      expect(Set.empty.popMin).toEqual(None);
    });

    it('should return value of the singleton set', () => {
      expect(Set(42).popMin).toEqual(Some([42, Set.empty]));
    });

    it('should return minimum value of the set', () => {
      const [x, s] = Set(5, 4, 3, 2, 1).popMin.get;
      expect([x, s.toArray]).toEqual([1, [2, 3, 4, 5]]);
    });
  });

  describe('popMax', () => {
    it('should return None when empty', () => {
      expect(Set.empty.popMax).toEqual(None);
    });

    it('should return value of the singleton set', () => {
      expect(Set(42).popMax).toEqual(Some([42, Set.empty]));
    });

    it('should remove maximum value from the set', () => {
      const [x, s] = Set(5, 4, 3, 2, 1).popMax.get;
      expect([x, s.toArray]).toEqual([5, [1, 2, 3, 4]]);
    });
  });

  describe('contains', () => {
    it('should return false when the set is empty', () => {
      expect(Set.empty.contains(42)).toBe(false);
    });

    it(
      'should return false when the value is not in the set',
      forAll(
        fc
          .integer()
          .chain(x =>
            fc
              .array(fc.integer().filter(y => y !== x))
              .map(xs => [x, xs] as const),
          ),
        ([x, xs]) => !Set(...xs).contains(x),
      ),
    );

    it(
      'should return true when the value is not in the set',
      forAll(
        fc
          .array(fc.integer())
          .chain(xs =>
            fc
              .integer({ min: 0, max: xs.length })
              .map(idx => [idx, xs] as const),
          ),
        ([idx, xs]) => {
          xs[idx] = 42;
          return Set(...xs).contains(42);
        },
      ),
    );
  });

  describe('insert', () => {
    it('should insert a value to an empty set', () => {
      expect(Set.empty.insert(42)).toEqual(Set(42));
    });

    it('should not duplicate values', () => {
      expect(Set(42).insert(42)).toEqual(Set(42));
    });

    it('should insert a value to an existing set', () => {
      const s = Set(1, 2, 4, 5).insert(3);
      expect(isValid(Ord.primitive, s));
      expect(s.toArray).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('remove', () => {
    it('should not remove anything from an empty set', () => {
      expect(Set.empty.remove(42)).toEqual(Set.empty);
    });

    it('should element from a singleton set', () => {
      expect(Set(42).remove(42)).toEqual(Set.empty);
    });

    it('should remove a value from a set', () => {
      const s = Set(1, 2, 3, 4, 5).remove(3);
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 4, 5]);
    });
  });

  describe('union', () => {
    it('should return an empty set when union of two empty sets', () => {
      expect(Set.empty.union(Set.empty)).toEqual(Set.empty);
    });

    it('should create a union with lhs empty', () => {
      const s = Set(1, 2, 3).union(Set.empty);
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3]);
    });

    it('should create a union with rhs empty', () => {
      const s = Set.empty.union(Set(4, 5, 6));
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([4, 5, 6]);
    });

    it('should create a union of two disjoint sets', () => {
      const s = Set(1, 2, 3).union(Set(4, 5, 6));
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should create a union of two sets sharing elements', () => {
      const s = Set(1, 2, 3, 4, 5).union(Set(2, 3, 4, 5, 6));
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test(
      'merge on self is identity',
      forAll(A.fp4tsSet(fc.integer(), Ord.primitive), s => {
        const r = s.union(s);
        return isValid(Ord.primitive, r) && s.equals(Eq.primitive)(r);
      }),
    );

    it('should be stack safe', () => {
      const xs = [...new Array(50_000).keys()].map((_, i) => i);
      const s1 = Set.fromArray(xs);
      const s2 = Set.fromArray(xs);

      const s = s1.union(s2);
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual(xs);
    });
  });

  describe('intersect', () => {
    it('should return an empty set when intersect of two empty sets', () => {
      expect(Set.empty.intersect(Set.empty)).toEqual(Set.empty);
    });

    it('should return an empty set when lhs empty', () => {
      expect(Set(1, 2, 3).intersect(Set.empty)).toEqual(Set.empty);
    });

    it('should return an empty set when rhs empty', () => {
      expect(Set.empty.intersect(Set(4, 5, 6))).toEqual(Set.empty);
    });

    it('should return an empty set as intersection of two disjoint sets', () => {
      expect(Set(1, 2, 3).intersect(Set(4, 5, 6))).toEqual(Set.empty);
    });

    it('should return intersection of two sets', () => {
      const s = Set(1, 2, 3, 4, 5).intersect(Set(2, 3, 4, 5, 6));
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([2, 3, 4, 5]);
    });

    test(
      'intersection on self is identity',
      forAll(A.fp4tsSet(fc.integer(), Ord.primitive), s => {
        const r = s.intersect(s);
        return isValid(Ord.primitive, r) && s.equals(Eq.primitive)(r);
      }),
    );

    it('should result in identity when two same sets are intersected', () => {
      const s = Set(1, 2, 3, 4, 5).intersect(Set(1, 2, 3, 4, 5));
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3, 4, 5]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(50_000).keys()].map((_, i) => i);
      const s1 = Set.fromArray(xs);
      const s2 = Set.fromArray(xs);

      const s = s1.intersect(s2);
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual(xs);
    });
  });

  describe('difference', () => {
    it('should diff of empty set is empty set', () => {
      expect(Set.empty['\\'](Set(1, 2, 3))).toEqual(Set.empty);
    });

    it('should return identity when rhs empty', () => {
      expect(Set(1, 2, 3).difference(Set.empty).toArray).toEqual([1, 2, 3]);
    });

    it('should not remove any elements when sets are disjoint', () => {
      const s = Set(1, 2, 3)['\\'](Set(4, 5, 6));
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3]);
    });

    it('should remove common elements of the set', () => {
      const s = Set(1, 2, 3, 4)['\\'](Set(3, 4, 5, 6));
      expect(isValid(Ord.primitive, s));
      expect(s.toArray).toEqual([1, 2]);
    });

    it('should return an empty set when difference with itself', () => {
      expect(Set(1, 2, 3)['\\'](Set(1, 2, 3))).toEqual(Set.empty);
    });
  });

  describe('symmetric difference', () => {
    it('should return rhs when rhs is empty', () => {
      expect(Set.empty['\\//'](Set(1, 2, 3)).toArray).toEqual([1, 2, 3]);
    });

    it('should return lhs when rhs is empty', () => {
      expect(Set(1, 2, 3).symmetricDifference(Set.empty).toArray).toEqual([
        1, 2, 3,
      ]);
    });

    it('should return disjoint union of sets', () => {
      const s = Set(1, 2, 3)['\\//'](Set(4, 5, 6));
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should return disjoint union of sets', () => {
      const s = Set(1, 2, 3, 4)['\\//'](Set(3, 4, 5, 6));
      expect(isValid(Ord.primitive, s));
      expect(s.toArray).toEqual([1, 2, 5, 6]);
    });

    it('should return an empty set when difference with itself', () => {
      expect(Set(1, 2, 3)['\\//'](Set(1, 2, 3))).toEqual(Set.empty);
    });
  });

  describe('filter', () => {
    it('should not filter anything when empty', () => {
      expect(Set.empty.filter(() => true)).toEqual(Set.empty);
    });

    it('should filter out all elements', () => {
      expect(Set(1, 2, 3, 4, 5, 6).filter(() => false)).toEqual(Set.empty);
    });

    it('should keep all elements', () => {
      const s = Set(1, 2, 3, 4, 5, 6).filter(() => true);
      expect(isValid(Ord.primitive, s));
      expect(s.toArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should filter out even elements', () => {
      const s = Set(1, 2, 3, 4, 5, 6).filter(x => x % 2 !== 0);
      expect(isValid(Ord.primitive, s));
      expect(s.toArray).toEqual([1, 3, 5]);
    });

    it(
      'should remain valid tree',
      forAll(
        A.fp4tsSet(fc.integer(), Ord.primitive),
        fc.func<[number], boolean>(fc.boolean()),
        (s, p) => isValid(Ord.primitive, s.filter(p)),
      ),
    );
  });

  describe('map', () => {
    it('should map over empty set', () => {
      expect(Set.empty.map(x => x * 2)).toEqual(Set.empty);
    });

    it('should double all of the values', () => {
      const s = Set(1, 2, 3, 4, 5, 6).map(x => x * 2);
      expect(isValid(Ord.primitive, s)).toBe(true);
      expect(s.toArray).toEqual([2, 4, 6, 8, 10, 12]);
    });

    it(
      'should remain a valid tree',
      forAll(
        A.fp4tsSet(fc.integer(), Ord.primitive),
        fc.func<[number], string>(fc.string()),
        (s, f) => isValid(Ord.primitive, s.map(f)),
      ),
    );
  });

  describe('forEach', () => {
    it('should not be called when the set is empty', () => {
      let called = false;
      Set.empty.forEach(() => (called = true));
      expect(called).toBe(false);
    });

    it('should be called with all elements in order', () => {
      const acc = [] as number[];
      Set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10).forEach(x => acc.push(x));
      expect(acc).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe('partition', () => {
    it('should return two empty sets when empty', () => {
      expect(Set.empty.partition(() => false)).toEqual([Set.empty, Set.empty]);
    });

    it('should return only left set', () => {
      const [l, r] = Set(1, 2, 3).partition(() => false);
      expect(isValid(Ord.primitive, l)).toBe(true);
      expect(isValid(Ord.primitive, r)).toBe(true);
      expect(l.toArray).toEqual([1, 2, 3]);
      expect(r.toArray).toEqual([]);
    });

    it('should return only right set', () => {
      const [l, r] = Set(1, 2, 3).partition(() => true);
      expect(isValid(Ord.primitive, l)).toBe(true);
      expect(isValid(Ord.primitive, r)).toBe(true);
      expect(l.toArray).toEqual([]);
      expect(r.toArray).toEqual([1, 2, 3]);
    });

    it('should partition even and odd elements', () => {
      const [l, r] = Set(1, 2, 3, 4, 5, 6).partition(x => x % 2 === 0);
      expect(isValid(Ord.primitive, l)).toBe(true);
      expect(isValid(Ord.primitive, r)).toBe(true);
      expect(l.toArray).toEqual([1, 3, 5]);
      expect(r.toArray).toEqual([2, 4, 6]);
    });
  });

  describe('foldLeft', () => {
    it('should return initial value when empty', () => {
      expect(Set.empty.foldLeft(42, () => -1)).toBe(42);
    });

    it('should sum all of the values', () => {
      expect(Set(1, 2, 3, 4, 5).foldLeft(0, (x, y) => x + y)).toBe(15);
    });

    it('should be left associative', () => {
      expect(Set(1, 2, 3).foldLeft('0', (s, x) => `(${s} + ${x})`)).toBe(
        '(((0 + 1) + 2) + 3)',
      );
    });
  });

  describe('foldLeft1', () => {
    it('should throw when empty', () => {
      expect(() => Set.empty.foldLeft1(() => -1)).toThrow();
    });

    it('should sum all of the values', () => {
      expect(Set(1, 2, 3, 4, 5).foldLeft1<number>((x, y) => x + y)).toBe(15);
    });

    it('should be left associative', () => {
      expect(
        Set('1', '2', '3').foldLeft1<string>((s, x) => `(${s} + ${x})`),
      ).toBe('((1 + 2) + 3)');
    });
  });

  describe('foldRight', () => {
    it('should return initial value when empty', () => {
      expect(Set.empty.foldRight(42, () => -1)).toBe(42);
    });

    it('should sum all of the values', () => {
      expect(Set(1, 2, 3, 4, 5).foldRight(0, (x, y) => x + y)).toBe(15);
    });

    it('should be right associative', () => {
      expect(Set(1, 2, 3).foldRight('0', (s, x) => `(${s} + ${x})`)).toBe(
        '(1 + (2 + (3 + 0)))',
      );
    });
  });

  describe('foldRight1', () => {
    it('should throw when empty', () => {
      expect(() => Set.empty.foldRight1(() => -1)).toThrow();
    });

    it('should sum all of the values', () => {
      expect(Set(1, 2, 3, 4, 5).foldRight1<number>((x, y) => x + y)).toBe(15);
    });

    it('should be right associative', () => {
      expect(
        Set('1', '2', '3').foldRight1<string>((s, x) => `(${s} + ${x})`),
      ).toBe('(1 + (2 + 3))');
    });
  });

  describe('foldMap', () => {
    it('should return an initial result when empty', () => {
      expect(Set.empty.foldMap(Monoid.addition)(id)).toBe(0);
      expect(Set.empty.foldMap(Monoid.product)(id)).toBe(1);
    });

    it('should combine values of the set', () => {
      expect(Set(1, 2, 3, 4).foldMap(Monoid.addition)(id)).toBe(10);
      expect(Set(1, 2, 3, 4).foldMap(Monoid.product)(id)).toBe(24);
    });
  });

  describe('should be eqvivalent to global.Set', () => {
    test('number', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 0, maxLength: 1_000 }),
          xs =>
            expect(Set.fromArray(xs).toArray).toEqual(
              [...new global.Set(xs)].sort((x, y) => x - y),
            ),
        ),
      );
    });

    test('string', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 1_000 }),
          xs =>
            expect(Set.fromArray(xs).toArray).toEqual(
              [...new global.Set(xs)].sort((x, y) =>
                x < y ? -1 : x > y ? 1 : 0,
              ),
            ),
        ),
      );
    });
  });

  describe('Laws', () => {
    const foldableSuite = FoldableSuite(Set.Foldable);

    checkAll(
      'Foldable<SetK>',
      foldableSuite.foldable(
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        Eq.primitive,
        Eq.primitive,
        x => A.fp4tsSet(x, Ord.primitive as Ord<any>),
      ),
    );
  });
});
