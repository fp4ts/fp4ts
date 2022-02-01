// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id } from '@fp4ts/core';
import { Monoid, Eq, Eval, EvalK, Ord } from '@fp4ts/cats-core';
import { List, Option, Some, None, Map } from '@fp4ts/cats-core/lib/data';
import { arrayMonoidK } from '@fp4ts/cats-core/lib/data/collections/array/instances';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import {
  MonoidKSuite,
  FunctorFilterSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';

describe('Map', () => {
  describe('types', () => {
    it('should be covariant', () => {
      const m: Map<number, number> = Map.empty;
    });

    it('should disallow type expansion for unrelated types', () => {
      const m: Map<number, string> = Map([1, '2'], [2, '3']);
      // @ts-expect-error
      m.lookup(Ord.primitive, 'some-string-key');
    });
  });

  describe('constructors', () => {
    test('empty map to be empty', () => {
      expect(Map.empty.isEmpty).toBe(true);
    });

    test('map with value not to be empty', () => {
      expect(Map([1, 2]).nonEmpty).toBe(true);
    });

    it('should create an ordered map from an unordered array', () => {
      const xs = [5, 1, 7, 8, 10, -5].map(x => [x, x] as [number, number]);
      expect(Map(...xs).toArray).toEqual([
        [-5, -5],
        [1, 1],
        [5, 5],
        [7, 7],
        [8, 8],
        [10, 10],
      ]);
    });

    it('should create an ordered map from an unordered List', () => {
      const xs = List(5, 1, 7, 8, 10, -5).map(x => [x, x] as [number, number]);
      expect(Map.fromList(Ord.primitive)(xs).toArray).toEqual([
        [-5, -5],
        [1, 1],
        [5, 5],
        [7, 7],
        [8, 8],
        [10, 10],
      ]);
    });

    it('should create an ordered map from a sorted array', () => {
      const xs = [-5, 1, 5, 7, 8, 10].map(x => [x, x] as [number, number]);
      expect(Map.fromSortedArray(xs).toArray).toEqual([
        [-5, -5],
        [1, 1],
        [5, 5],
        [7, 7],
        [8, 8],
        [10, 10],
      ]);
    });
  });

  describe('head', () => {
    it('should throw when map is empty', () => {
      expect(() => Map.empty.head).toThrow();
    });

    it('should return first elements of the map', () => {
      expect(Map([1, 2], [-1, 4]).head).toBe(4);
    });
  });

  describe('headOption', () => {
    it('should return None when empty', () => {
      expect(Map.empty.headOption).toEqual(None);
    });

    it('should return first elements of the map', () => {
      expect(Map([1, 2], [-1, 4]).headOption).toEqual(Some(4));
    });
  });

  describe('tail', () => {
    it('should return empty map when empty', () => {
      expect(Map.empty.tail).toEqual(Map.empty);
    });

    it('should remove element of the map', () => {
      expect(Map([1, 2], [-1, 4]).tail).toEqual(Map([1, 2]));
    });
  });

  describe('init', () => {
    it('should return empty map when empty', () => {
      expect(Map.empty.init).toEqual(Map.empty);
    });

    it('should remove last element of the map', () => {
      expect(Map([1, 2], [-1, 4]).init).toEqual(Map([-1, 4]));
    });
  });

  describe('headOption', () => {
    it('should throw when map is empty', () => {
      expect(Map.empty.headOption).toEqual(None);
    });

    it('should return first elements of the map', () => {
      expect(Map([1, 2], [-1, 4]).headOption).toEqual(Some(4));
    });
  });

  describe('last', () => {
    it('should throw when map is empty', () => {
      expect(() => Map.empty.last).toThrow();
    });

    it('should return last elements of the map', () => {
      expect(Map([1, 2], [-1, 4]).last).toBe(2);
    });
  });

  describe('lastOption', () => {
    it('should return None when empty', () => {
      expect(Map.empty.lastOption).toEqual(None);
    });

    it('should return last elements of the map', () => {
      expect(Map([1, 2], [-1, 4]).lastOption).toEqual(Some(2));
    });
  });

  describe('all', () => {
    it('should return true when empty', () => {
      expect(Map.empty.all(() => false)).toBe(true);
    });

    it('should true when all values are even', () => {
      expect(Map([1, 2], [2, 4]).all(v => v % 2 === 0)).toBe(true);
    });

    it('should false when all values odd', () => {
      expect(Map([1, 2], [2, 3]).all(v => v % 2 === 0)).toBe(false);
    });
  });

  describe('any', () => {
    it('should return false when empty', () => {
      expect(Map.empty.any(() => false)).toBe(false);
    });

    it('should true when all values are odd', () => {
      expect(Map([1, 3], [2, 5]).any(v => v % 2 === 0)).toBe(false);
    });

    it('should false when one value even', () => {
      expect(Map([1, 2], [2, 3]).any(v => v % 2 === 0)).toBe(true);
    });
  });

  describe('count', () => {
    it('should return zero when map is empty', () => {
      expect(Map.empty.count(() => true)).toBe(0);
    });

    it('should count even numbers', () => {
      expect(Map([1, 2], [2, 3]).count(v => v % 2 === 0)).toBe(1);
    });
  });

  describe('min', () => {
    it('should return None when empty', () => {
      expect(Map.empty.min).toEqual(None);
    });

    it('should return value with minimum key', () => {
      expect(Map([1, 2], [-5, 10]).min).toEqual(Some(10));
    });
  });

  describe('minWihKey', () => {
    it('should return None when empty', () => {
      expect(Map.empty.minWithKey).toEqual(None);
    });

    it('should return value with minimum key', () => {
      expect(Map([1, 2], [-5, 10]).minWithKey).toEqual(Some([-5, 10]));
    });
  });

  describe('max', () => {
    it('should return None when empty', () => {
      expect(Map.empty.max).toEqual(None);
    });

    it('should return value with maximum key', () => {
      expect(Map([1, 2], [-5, 10]).max).toEqual(Some(2));
    });
  });

  describe('maxWihKey', () => {
    it('should return None when empty', () => {
      expect(Map.empty.maxWithKey).toEqual(None);
    });

    it('should return value with maximum key', () => {
      expect(Map([1, 2], [-5, 10]).maxWithKey).toEqual(Some([1, 2]));
    });
  });

  describe('popMin', () => {
    const abort = () => {
      throw new Error();
    };

    it('should return None when map is empty', () => {
      expect(Map.empty.popMin).toEqual(None);
    });

    it('should return value with minimal key and rest of the map', () => {
      const [v, m] = Map([1, 2], [2, 3], [4, 5]).popMin.fold(abort, id);

      expect(v).toBe(2);
      expect(m.toArray).toEqual([
        [2, 3],
        [4, 5],
      ]);
    });
  });

  describe('popMinWithKey', () => {
    const abort = () => {
      throw new Error();
    };

    it('should return None when map is empty', () => {
      expect(Map.empty.popMinWithKey).toEqual(None);
    });

    it('should return value with minimal key and rest of the map', () => {
      const [kv, m] = Map([1, 2], [2, 3], [4, 5]).popMinWithKey.fold(abort, id);

      expect(kv).toEqual([1, 2]);
      expect(m.toArray).toEqual([
        [2, 3],
        [4, 5],
      ]);
    });
  });

  describe('popMax', () => {
    const abort = () => {
      throw new Error();
    };

    it('should return None when map is empty', () => {
      expect(Map.empty.popMax).toEqual(None);
    });

    it('should return value with minimal key and rest of the map', () => {
      const [v, m] = Map([1, 2], [2, 3], [4, 5]).popMax.fold(abort, id);

      expect(v).toBe(5);
      expect(m.toArray).toEqual([
        [1, 2],
        [2, 3],
      ]);
    });
  });

  describe('popMaxWithKey', () => {
    const abort = () => {
      throw new Error();
    };

    it('should return None when map is empty', () => {
      expect(Map.empty.popMaxWithKey).toEqual(None);
    });

    it('should return value with minimal key and rest of the map', () => {
      const [kv, m] = Map([1, 2], [2, 3], [4, 5]).popMaxWithKey.fold(abort, id);

      expect(kv).toEqual([4, 5]);
      expect(m.toArray).toEqual([
        [1, 2],
        [2, 3],
      ]);
    });
  });

  describe('contains', () => {
    const m = Map([1, 2], [2, 3]);

    it('should be true when the key exists', () => {
      expect(m.contains(Ord.primitive, 1)).toBe(true);
      expect(m.contains(Ord.primitive, 2)).toBe(true);
    });

    it('should be false when the key does not exists', () => {
      expect(m.contains(-1)).toBe(false);
      expect(Map.empty.contains('another missing key')).toBe(false);
    });
  });

  describe('lookup', () => {
    it('should return None when the map is empty', () => {
      expect(Map.empty.lookup(1)).toEqual(None);
    });

    it('should return None when the key does not exist', () => {
      expect(Map([1, 1]).lookup(42)).toEqual(None);
    });

    it('should return keyed value when the key exists', () => {
      expect(Map([42, 1]).lookup(42)).toEqual(Some(1));
    });
  });

  describe('insert', () => {
    it('should insert a value to an empty map', () => {
      expect(Map.empty.insert(1, 1).toArray).toEqual([[1, 1]]);
    });

    it('should two values to existing map', () => {
      expect(Map([5, 5]).insert(1, 1).insert(10, 10).toArray).toEqual([
        [1, 1],
        [5, 5],
        [10, 10],
      ]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()].reverse();
      let m: Map<number, number> = Map.empty;

      for (let i = 0; i < 10_000; i++) {
        m = m.insert(xs[i], xs[i]);
      }

      expect(m.toArray).toEqual;
    });
  });

  describe('insertWith', () => {
    it('should insert a value in an empty map', () => {
      expect(Map.empty.insertWith(1, 1, () => 999)).toEqual(Map([1, 1]));
    });

    it('should not override a value when the key does not exist', () => {
      expect(Map([2, 2]).insertWith(1, 1, () => 999).toArray).toEqual([
        [1, 1],
        [2, 2],
      ]);
    });

    it('should override a value when it already exists', () => {
      expect(Map([1, 1], [2, 2]).insertWith(1, 1, () => 999).toArray).toEqual([
        [1, 999],
        [2, 2],
      ]);
    });
  });

  describe('remove', () => {
    it('should do nothing when map is empty', () => {
      expect(Map.empty.remove(2)).toEqual(Map.empty);
    });

    it('should do nothing when key does not exist in the map', () => {
      expect(Map([1, 2]).remove(2)).toEqual(Map([1, 2]));
    });

    it('should remove existing key from the map', () => {
      expect(Map([1, 2], [2, 3]).remove(2)).toEqual(Map([1, 2]));
    });
  });

  describe('update', () => {
    it('should do nothing when map is empty', () => {
      expect(Map.empty.update(42, () => 999)).toEqual(Map.empty);
    });

    it('should do nothing when the key does not exist', () => {
      expect(Map([1, 2]).update(42, () => 999)).toEqual(Map([1, 2]));
    });

    it('should update existing key', () => {
      expect(Map([1, 2], [42, 2]).update(42, () => 999)).toEqual(
        Map([1, 2], [42, 999]),
      );
    });
  });

  describe('union', () => {
    test('union of two empty maps to be empty', () => {
      expect(Map.empty.union(Ord.primitive, Map.empty)).toEqual(Map.empty);
    });

    it('should return map on union with empty on lhs', () => {
      expect(Map([1, 2], [3, 4]).union(Map.empty).toArray).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('should return map on union with empty on rhs', () => {
      expect(Map.empty.union(Map([1, 2], [3, 4])).toArray).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('should merge two maps with disjointed keys', () => {
      expect(Map([1, 2], [3, 4]).union(Map([5, 6], [7, 8])).toArray).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
      ]);
    });

    it('should be left-bias when merging maps with intersecting keys', () => {
      expect(Map([1, 2], [3, 4]).union(Map([3, 9999], [5, 6])).toArray).toEqual(
        [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
      );
    });

    it('should make no changes when merging two identical maps', () => {
      expect(Map([1, 2], [3, 4]).union(Map([1, 2], [3, 4])).toArray).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()].map(x => [x, x]);
      const ys = [...new Array(10_000).keys()].map(x => [x + 10_000, x]);
      const mx = Map(...(xs as [number, number][]));
      const my = Map(...(ys as [number, number][]));

      const rs = mx['+++'](my).toArray;

      expect(rs).toEqual([...xs, ...ys]);
    });
  });

  describe('unionWith', () => {
    it('should not invoke callback when no intersection is found', () => {
      const cb = (): number => -1;
      expect(
        Map([1, 2], [3, 4]).unionWith(Map([5, 6], [7, 8]), cb).toArray,
      ).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
      ]);
    });

    it('should apply callback for intersecting keys', () => {
      const cb = (l: number, r: number): number => r;
      expect(
        Map([1, 2], [3, 4]).unionWith(Map([3, 9999], [5, 6]), cb).toArray,
      ).toEqual([
        [1, 2],
        [3, 9999],
        [5, 6],
      ]);
    });
  });

  describe('intersect', () => {
    it('should product an empty intersection when both empty', () => {
      expect(Map.empty.intersect(Map.empty)).toEqual(Map.empty);
    });

    it('should product an empty intersection when lhs empty', () => {
      expect(Map.empty.intersect(Map([2, 3]))).toEqual(Map.empty);
    });

    it('should product an empty intersection when rhs empty', () => {
      expect(Map([1, 2]).intersect(Map.empty)).toEqual(Map.empty);
    });

    it('should product an empty intersection when no keys shared', () => {
      expect(Map([1, 2]).intersect(Map([2, 3]))).toEqual(Map.empty);
    });

    it('should create a left-bias singleton intersection', () => {
      expect(
        Map([1, 2], [2, 3]).intersect(Map([2, 999], [3, 4])).toArray,
      ).toEqual([[2, 3]]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()].map(x => [x, x]);
      const ys = [...new Array(10_000).keys()].map(x => [x + 5_000, x]);
      const mx = Map(...(xs as [number, number][]));
      const my = Map(...(ys as [number, number][]));

      const rs = mx.intersect(my).toArray;

      expect(rs).toEqual(xs.slice(5_000));
    });
  });

  describe('intersectWith', () => {
    it('should return an empty map when no keys match', () => {
      expect(
        Map([1, 2], [3, 4]).intersectWith(Map([4, 5], [6, 7]), (x, y) => x + y)
          .toArray,
      ).toEqual([]);
    });

    it('should sum values with matching keys', () => {
      expect(
        Map([1, 2], [3, 4]).intersectWith(Map([3, 5], [6, 7]), (x, y) => x + y)
          .toArray,
      ).toEqual([[3, 9]]);
    });
  });

  describe('difference', () => {
    it('should return id when difference with empty map', () => {
      expect(Map([1, 2], [2, 3])['\\'](Map.empty).toArray).toEqual([
        [1, 2],
        [2, 3],
      ]);
    });

    it('should remove shared keys', () => {
      expect(Map([1, 2], [2, 3])['\\'](Map([2, 3], [3, 4])).toArray).toEqual([
        [1, 2],
      ]);
    });
  });

  describe('symmetricDifference', () => {
    it('should return id when difference with empty map', () => {
      expect(
        Map([1, 2], [2, 3])['\\//'](Ord.primitive, Map.empty).toArray,
      ).toEqual([
        [1, 2],
        [2, 3],
      ]);
    });

    it('should yield union of differences', () => {
      expect(Map([1, 2], [2, 3])['\\//'](Map([2, 3], [3, 4])).toArray).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('filter', () => {
    it('should return empty map when empty initially', () => {
      expect(Map.empty.filter(() => false)).toEqual(Map.empty);
    });

    it('should filter out even values', () => {
      expect(
        Map([1, 1], [2, 2], [3, 3]).filter(x => x % 2 !== 0).toArray,
      ).toEqual([
        [1, 1],
        [3, 3],
      ]);
    });
  });

  describe('map', () => {
    it('should return empty map when empty initially', () => {
      expect(Map.empty.map(x => x * 2)).toEqual(Map.empty);
    });

    it('should double all values', () => {
      expect(Map([1, 2], [3, 4]).map(x => x * 2)).toEqual(Map([1, 4], [3, 8]));
    });
  });

  describe('collect', () => {
    it('should return empty map when empty initially', () => {
      expect(Map.empty.collect(Some)).toEqual(Map.empty);
    });

    it('should collect even numbers', () => {
      expect(
        Map([1, 2], [2, 3], [3, 4], [4, 5]).collect(x =>
          x % 2 === 0 ? Some(x) : None,
        ).toArray,
      ).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('foldLeft', () => {
    it('should return initial value when empty', () => {
      expect(Map.empty.foldLeft(0, (x, y) => x + y)).toBe(0);
    });

    it('should sum all values', () => {
      expect(Map([1, 2], [3, 4]).foldLeft(0, (x, y) => x + y)).toBe(6);
    });

    it('should be left-associate', () => {
      expect(
        Map([1, 2], [2, 3], [4, 5]).foldLeft(
          '',
          (s, v, k) => `(${s}) + (${k} + ${v})`,
        ),
      ).toBe('((() + (1 + 2)) + (2 + 3)) + (4 + 5)');
    });
  });

  describe('foldLeft1', () => {
    it('should throw when map is empty', () => {
      expect(() => Map.empty.foldLeft1(() => null as any)).toThrow();
    });

    it('should be right-associate', () => {
      expect(
        Map([1, '2'], [3, '4'], [5, '6']).foldLeft1((r, v) => `(${r} + ${v})`),
      ).toBe('((2 + 4) + 6)');
    });
  });

  describe('foldRight', () => {
    it('should return initial value when empty', () => {
      expect(Map.empty.foldRight(0, (y, x) => x + y)).toBe(0);
    });

    it('should sum all values', () => {
      expect(Map([1, 2], [3, 4]).foldRight(0, (y, x) => x + y)).toBe(6);
    });

    it('should be right-associate', () => {
      expect(
        Map([1, 2], [2, 3], [4, 5]).foldRight(
          '',
          (v, s, k) => `(${k} + ${v}) + (${s})`,
        ),
      ).toBe('(1 + 2) + ((2 + 3) + ((4 + 5) + ()))');
    });
  });

  describe('foldRight1', () => {
    it('should throw when map is empty', () => {
      expect(() => Map.empty.foldRight1(() => null as any)).toThrow();
    });

    it('should be right-associate', () => {
      expect(
        Map([1, '2'], [3, '4'], [5, '6']).foldRight1((v, r) => `(${v} + ${r})`),
      ).toBe('(2 + (4 + 6))');
    });
  });

  describe('foldMap', () => {
    it('should fold empty map into list', () => {
      expect(Map.empty.foldMap(List.MonoidK.algebra())(x => List(x))).toEqual(
        List.empty,
      );
    });

    it('should fold map into array of its values', () => {
      expect(
        Map([1, 2], [3, 4]).foldMap(arrayMonoidK().algebra())(x => [x]),
      ).toEqual([2, 4]);
    });
  });

  describe('foldMapK', () => {
    it('should fold empty map into list', () => {
      expect(Map.empty.foldMapK(List.MonoidK)(x => List(x))).toEqual(
        List.empty,
      );
    });

    it('should fold map into array of its values', () => {
      expect(Map([1, 2], [3, 4]).foldMapK(arrayMonoidK())(x => [x])).toEqual([
        2, 4,
      ]);
    });
  });

  describe('traverse', () => {
    it('should produce some when map contains only even values', () => {
      expect(
        Map([1, 2], [3, 4]).traverse(Option.Applicative)(v =>
          v % 2 === 0 ? Some(v) : None,
        ),
      ).toEqual(Some(Map([1, 2], [3, 4])));
    });

    it('should produce none when contains odd values', () => {
      expect(
        Map([1, 2], [3, 5]).traverse(Option.Applicative)(v =>
          v % 2 === 0 ? Some(v) : None,
        ),
      ).toEqual(None);
    });
  });

  describe('show', () => {
    it('should show an empty map', () => {
      expect(Map.empty.show()).toBe('[OrderedMap entries: {}]');
    });

    it('should print out values', () => {
      expect(Map([1, 2], [2, 3]).show()).toBe(
        '[OrderedMap entries: { 1 => 2, 2 => 3 }]',
      );
    });

    it('should print out complex values', () => {
      expect(
        Map<number, [number, number]>([1, [2, 2]], [2, [3, 3]]).show({
          show: ([x, y]) => `(${x}, ${y})`,
        }),
      ).toBe('[OrderedMap entries: { 1 => (2, 2), 2 => (3, 3) }]');
    });
  });

  const monoidKTests = MonoidKSuite(Map.MonoidK(Ord.primitive));
  checkAll(
    'MonoidK<OrderedMap>',
    monoidKTests.monoidK(
      fc.integer(),
      Eq.primitive,
      x => A.fp4tsMap(fc.integer(), x, Ord.primitive),
      E => Map.Eq(Eq.primitive, E),
    ),
  );

  const functorFilterTests = FunctorFilterSuite(Map.FunctorFilter<number>());
  checkAll(
    'FunctorFilter<OrderedMap>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => A.fp4tsMap(fc.integer(), x, Ord.primitive),
      E => Map.Eq(Eq.primitive, E),
    ),
  );

  const traversableTests = TraversableSuite(Map.Traversable<number>());
  checkAll(
    'Traversable<OrderedMap>',
    traversableTests.traversable<number, number, number, EvalK, EvalK>(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      Map.Functor(),
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => A.fp4tsMap(fc.integer(), x, Ord.primitive),
      E => Map.Eq(Eq.primitive, E),
      A.fp4tsEval,
      Eval.Eq,
      A.fp4tsEval,
      Eval.Eq,
    ),
  );
});
