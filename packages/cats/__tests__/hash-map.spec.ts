// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { EvalF } from '@fp4ts/core';
import { Eq, Hashable, CommutativeMonoid } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { List, Option, Some, None, HashMap } from '@fp4ts/cats-core/lib/data';
import { arrayMonoidK } from '@fp4ts/cats-core/lib/data/collections/array/instances';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import {
  MonoidKSuite,
  FunctorFilterSuite,
  UnorderedTraversableSuite,
} from '@fp4ts/cats-laws';

describe('Map', () => {
  const H = Hashable.any;

  const pairs: [number, string][] = [
    [1, 'test'],
    [2, 'another test'],
  ];

  describe('type', () => {
    it('should be covariant', () => {
      const m: HashMap<number, number> = HashMap.empty.insert(1, 1);
    });

    it('should disallow type expansion for unrelated types', () => {
      const m: HashMap<number, string> = HashMap(...pairs);
      // @ts-expect-error
      m.lookup('some-string-key');
    });
  });

  describe('constructors', () => {
    it('should create map from enumerated list of pairs', () => {
      expect(HashMap(...pairs).toArray).toEqual(expect.arrayContaining(pairs));
    });

    it('should create map from a list of pairs', () => {
      expect(HashMap.fromList(H())(List(...pairs)).toArray).toEqual(
        expect.arrayContaining(pairs),
      );
    });

    it('should create map from an array of pairs', () => {
      expect(HashMap.fromArray(H())(pairs).toArray).toEqual(
        expect.arrayContaining(pairs),
      );
    });
  });

  describe('empty', () => {
    test('empty map to be empty', () => {
      expect(HashMap.empty.isEmpty).toBe(true);
    });

    test('non-empty map not to be empty', () => {
      expect(HashMap(...pairs).nonEmpty).toBe(true);
    });

    test('map with all elements filtered out to be empty', () => {
      expect(HashMap([1, 2], [3, 4]).filter(() => false).isEmpty).toBe(true);
    });
  });

  describe('keys', () => {
    it('should have no keys when empty', () => {
      expect(HashMap.empty.keys).toEqual(List.empty);
    });

    it('should return list of keys', () => {
      expect(HashMap(...pairs).keys.toArray).toEqual(
        expect.arrayContaining(pairs.map(([k]) => k)),
      );
    });
  });

  describe('values', () => {
    it('should have no values when empty', () => {
      expect(HashMap.empty.values).toEqual(List.empty);
    });

    it('should return list of values', () => {
      expect(HashMap(...pairs).values.toArray).toEqual(
        expect.arrayContaining(pairs.map(([, v]) => v)),
      );
    });
  });

  describe('size', () => {
    it('should be zero when empty', () => {
      expect(HashMap.empty.size).toBe(0);
    });

    it('should be zero all entries removed', () => {
      expect(HashMap([1, 2], [2, 3]).filter(() => false).size).toBe(0);
    });

    it('should be three', () => {
      expect(HashMap([1, 2], [2, 3], [3, 4]).size).toBe(3);
    });
  });

  describe('all', () => {
    it('should return true when empty', () => {
      expect(HashMap.empty.all(() => false)).toBe(true);
    });

    it('should true when all values are even', () => {
      expect(HashMap([1, 2], [2, 4]).all(v => v % 2 === 0)).toBe(true);
    });

    it('should false when all values odd', () => {
      expect(HashMap([1, 2], [2, 3]).all(v => v % 2 === 0)).toBe(false);
    });
  });

  describe('any', () => {
    it('should return false when empty', () => {
      expect(HashMap.empty.any(() => false)).toBe(false);
    });

    it('should true when all values are odd', () => {
      expect(HashMap([1, 3], [2, 5]).any(v => v % 2 === 0)).toBe(false);
    });

    it('should false when one value even', () => {
      expect(HashMap([1, 2], [2, 3]).any(v => v % 2 === 0)).toBe(true);
    });
  });

  describe('count', () => {
    it('should return zero when map is empty', () => {
      expect(HashMap.empty.count(() => true)).toBe(0);
    });

    it('should count even numbers', () => {
      expect(HashMap([1, 2], [2, 3]).count(v => v % 2 === 0)).toBe(1);
    });
  });

  describe('hasKey', () => {
    const m = HashMap(...pairs);

    it('should be true when the key exists', () => {
      expect(m.hasKey(H(), 1)).toBe(true);
      expect(m.hasKey(H(), 2)).toBe(true);
    });

    it('should be false when the key does not exists', () => {
      expect(m.hasKey(-1)).toBe(false);
      expect(HashMap.empty.hasKey('another missing key')).toBe(false);
    });
  });

  describe('lookup', () => {
    const m = HashMap(...pairs);

    it('should return the value when the key exists', () => {
      expect(m.lookup(H(), 1)).toEqual(Some('test'));
      expect(m.lookup(H(), 2)).toEqual(Some('another test'));
    });

    it('should return None when the key does not exists', () => {
      expect(m.lookup(-1)).toEqual(None);
      expect(HashMap.empty.lookup('another missing key')).toEqual(None);
    });
  });

  describe('insert', () => {
    it('should insert a pair to an empty map', () => {
      expect(HashMap.empty.insert('key', 'value').toArray).toEqual([
        ['key', 'value'],
      ]);
    });

    it('should expand a map with a new entry', () => {
      expect(HashMap(['k', 'v']).insert('key', 'value').toArray).toEqual(
        expect.arrayContaining([
          ['key', 'value'],
          ['k', 'v'],
        ]),
      );
    });

    it('should replace a value in the map', () => {
      expect(
        HashMap(['key', 'value']).insert('key', 'new-value').toArray,
      ).toEqual([['key', 'new-value']]);
    });
  });

  describe('insertWith', () => {
    const cb = () => 'updated';

    it('should insert a pair to an empty map', () => {
      expect(HashMap.empty.insertWith('key', 'value', cb).toArray).toEqual([
        ['key', 'value'],
      ]);
    });

    it('should expand a map with a new entry', () => {
      expect(
        HashMap(['k', 'v']).insertWith('key', 'value', cb).toArray,
      ).toEqual(
        expect.arrayContaining([
          ['key', 'value'],
          ['k', 'v'],
        ]),
      );
    });

    it('should replace a value in the map', () => {
      expect(
        HashMap(['key', 'value']).insertWith('key', 'new-value', (o, n) => n)
          .toArray,
      ).toEqual([['key', 'new-value']]);
    });

    it('should not invoke the update callback when there is no collision', () => {
      expect(
        HashMap.empty.insertWith('key', 'value', () => 'updated').toArray,
      ).toEqual([['key', 'value']]);
    });

    it('should replace use callback to replace the value', () => {
      expect(
        HashMap(['key', 'value']).insertWith('key', 'new-value', cb).toArray,
      ).toEqual([['key', 'updated']]);
    });
  });

  describe('remove', () => {
    it('should return original map when key does not exist', () => {
      expect(HashMap([1, 2], [3, 4]).remove(-1)).toEqual(
        HashMap([1, 2], [3, 4]),
      );
    });

    it('should remove existing entry from the map', () => {
      expect(HashMap([1, 2], [3, 4]).remove(3).toArray).toEqual([[1, 2]]);
    });

    it('should remove existing entry from the map', () => {
      expect(HashMap([1, 2], [2, 3]).remove(2).toArray).toEqual([[1, 2]]);
    });
  });

  describe('update', () => {
    it('should return original map when key does not exist', () => {
      expect(HashMap([1, 2], [3, 4]).update(-1, () => -1)).toEqual(
        HashMap([1, 2], [3, 4]),
      );
    });

    it('should remove existing entry from the map', () => {
      expect(HashMap([1, 2], [3, 4]).update(3, x => x + 1)).toEqual(
        HashMap([1, 2], [3, 5]),
      );
    });
  });

  describe('union', () => {
    test('union of two empty maps to be empty', () => {
      expect(HashMap.empty.union(HashMap.empty)).toEqual(HashMap.empty);
    });

    it('should return map on union with empty on lhs', () => {
      expect(HashMap([1, 2], [3, 4]).union(HashMap.empty).toArray).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
        ]),
      );
    });

    it('should return map on union with empty on rhs', () => {
      expect(HashMap.empty.union(HashMap([1, 2], [3, 4])).toArray).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
        ]),
      );
    });

    it('should merge two maps with disjointed keys', () => {
      expect(
        HashMap([1, 2], [3, 4]).union(HashMap([5, 6], [7, 8])).toArray,
      ).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
        ]),
      );
    });

    it('should be left-bias when merging maps with intersecting keys', () => {
      expect(
        HashMap([1, 2], [3, 4]).union(HashMap([3, 9999], [5, 6])).toArray,
      ).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
          [5, 6],
        ]),
      );
    });

    it('should make no changes when merging two identical maps', () => {
      expect(
        HashMap([1, 2], [3, 4]).union(HashMap([1, 2], [3, 4])).toArray,
      ).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
        ]),
      );
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()].map(x => [x, x]);
      const ys = [...new Array(10_000).keys()].map(x => [x + 10_000, x]);
      const mx = HashMap(...(xs as [number, number][]));
      const my = HashMap(...(ys as [number, number][]));

      const rm = mx['+++'](my);
      const rs = rm.toArray.sort(([a], [b]) => a - b);

      expect(rs).toEqual([...xs, ...ys]);
    });
  });

  describe('unionWith', () => {
    it('should not invoke callback when no intersection is found', () => {
      const cb = (): number => -1;
      expect(
        HashMap([1, 2], [3, 4]).unionWith(HashMap([5, 6], [7, 8]), cb).toArray,
      ).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
        ]),
      );
    });

    it('should apply callback for intersecting keys', () => {
      const cb = (l: number, r: number): number => r;
      expect(
        HashMap([1, 2], [3, 4]).unionWith(HashMap([3, 9999], [5, 6]), cb)
          .toArray,
      ).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 9999],
          [5, 6],
        ]),
      );
    });
  });

  describe('intersect', () => {
    it('should product an empty intersection when both empty', () => {
      expect(HashMap.empty.intersect(HashMap.empty)).toEqual(HashMap.empty);
    });

    it('should product an empty intersection when lhs empty', () => {
      expect(HashMap.empty.intersect(HashMap([2, 3]))).toEqual(HashMap.empty);
    });

    it('should product an empty intersection when rhs empty', () => {
      expect(HashMap([1, 2]).intersect(HashMap.empty)).toEqual(HashMap.empty);
    });

    it('should product an empty intersection when no keys shared', () => {
      expect(HashMap([1, 2]).intersect(HashMap([2, 3]))).toEqual(HashMap.empty);
    });

    it('should create a left-bias singleton intersection', () => {
      expect(
        HashMap([1, 2], [2, 3]).intersect(HashMap([2, 999], [3, 4])).toArray,
      ).toEqual([[2, 3]]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()].map(x => [x, x]);
      const ys = [...new Array(10_000).keys()].map(x => [x + 5_000, x]);
      const mx = HashMap(...(xs as [number, number][]));
      const my = HashMap(...(ys as [number, number][]));

      const rs = mx.intersect(my).toArray.sort(([a], [b]) => a - b);

      expect(rs).toEqual(xs.slice(5_000));
    });
  });

  describe('intersectWith', () => {
    it('should return an empty map when no keys match', () => {
      expect(
        HashMap([1, 2], [3, 4]).intersectWith(
          HashMap([4, 5], [6, 7]),
          (x, y) => x + y,
        ).toArray,
      ).toEqual([]);
    });

    it('should sum values with matching keys', () => {
      expect(
        HashMap([1, 2], [3, 4]).intersectWith(
          HashMap([3, 5], [6, 7]),
          (x, y) => x + y,
        ).toArray,
      ).toEqual([[3, 9]]);
    });
  });

  describe('difference', () => {
    it('should return id when difference with empty map', () => {
      expect(HashMap([1, 2], [2, 3])['\\'](HashMap.empty)).toEqual(
        HashMap([1, 2], [2, 3]),
      );
    });

    it('should remove shared keys', () => {
      expect(
        HashMap([1, 2], [2, 3])['\\'](HashMap([2, 3], [3, 4])).toArray,
      ).toEqual([[1, 2]]);
    });
  });

  describe('symmetricDifference', () => {
    it('should return id when difference with empty map', () => {
      expect(HashMap([1, 2], [2, 3])['\\//'](HashMap.empty)).toEqual(
        HashMap([1, 2], [2, 3]),
      );
    });

    it('should yield union of differences', () => {
      expect(
        HashMap([1, 2], [2, 3])['\\//'](HashMap([2, 3], [3, 4])).toArray,
      ).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
        ]),
      );
    });
  });

  describe('filter', () => {
    it('should return empty map when empty initially', () => {
      expect(HashMap.empty.filter(() => false)).toEqual(HashMap.empty);
    });

    it('should filter out even values', () => {
      expect(
        HashMap([1, 1], [2, 2], [3, 3]).filter(x => x % 2 !== 0).toArray,
      ).toEqual(
        expect.arrayContaining([
          [1, 1],
          [3, 3],
        ]),
      );
    });
  });

  describe('map', () => {
    it('should return empty map when empty initially', () => {
      expect(HashMap.empty.map(x => x * 2)).toEqual(HashMap.empty);
    });

    it('should double all values', () => {
      expect(HashMap([1, 2], [3, 4]).map(x => x * 2)).toEqual(
        HashMap([1, 4], [3, 8]),
      );
    });
  });

  describe('collect', () => {
    it('should return empty map when empty initially', () => {
      expect(HashMap.empty.collect(Some)).toEqual(HashMap.empty);
    });

    it('should collect even values', () => {
      const m = HashMap([1, 2], [2, 3], [3, 4], [4, 5]).collect(x =>
        x % 2 === 0 ? Some(x) : None,
      ).toArray;

      expect(m).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
        ]),
      );
      expect(m).not.toEqual(
        expect.arrayContaining([
          [2, 3],
          [4, 5],
        ]),
      );
    });
  });

  describe('flatMap', () => {
    it('should flat map into singletons', () => {
      expect(
        HashMap([1, 2], [3, 4]).flatMap((v, k) => HashMap([k, v])).toArray,
      ).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
        ]),
      );
    });

    it('should flat map into maps', () => {
      expect(
        HashMap([1, 2], [3, 4]).flatMap((v, k) => HashMap([k, v], [v, k]))
          .toArray,
      ).toEqual(
        expect.arrayContaining([
          [1, 2],
          [2, 1],
          [3, 4],
          [4, 3],
        ]),
      );
    });
  });

  describe('flatten', () => {
    it('should flatten singletons', () => {
      expect(
        HashMap(
          [1, HashMap<number, number>([2, 3])],
          [3, HashMap([4, 5])],
        ).flatten().toArray,
      ).toEqual(
        expect.arrayContaining([
          [2, 3],
          [4, 5],
        ]),
      );
    });

    it('should flatten maps', () => {
      expect(
        HashMap(
          [1, HashMap<number, number>([2, 3], [3, 2])],
          [3, HashMap([4, 5], [5, 4])],
        ).flatten().toArray,
      ).toEqual(
        expect.arrayContaining([
          [2, 3],
          [3, 2],
          [4, 5],
          [5, 4],
        ]),
      );
    });
  });

  describe('foldLeft', () => {
    it('should return initial value when empty', () => {
      expect(HashMap.empty.foldLeft(0, (x, y) => x + y)).toBe(0);
    });

    it('should sum all values', () => {
      expect(HashMap([1, 2], [3, 4]).foldLeft(0, (x, y) => x + y)).toBe(6);
    });
  });

  describe('foldRight', () => {
    it('should return initial value when empty', () => {
      expect(HashMap.empty.foldRight(0, (y, x) => x + y)).toBe(0);
    });

    it('should sum all values', () => {
      expect(HashMap([1, 2], [3, 4]).foldRight(0, (y, x) => x + y)).toBe(6);
    });
  });

  describe('foldMap', () => {
    it('should fold empty map into list', () => {
      expect(
        HashMap.empty.foldMap(List.MonoidK.algebra())(x => List(x)),
      ).toEqual(List.empty);
    });

    it('should fold map into array of its values', () => {
      expect(
        HashMap([1, 2], [3, 4]).foldMap(arrayMonoidK().algebra())(x => [x]),
      ).toEqual(expect.arrayContaining([2, 4]));
    });
  });

  describe('foldMapK', () => {
    it('should fold empty map into list', () => {
      expect(HashMap.empty.foldMapK(List.MonoidK)(x => List(x))).toEqual(
        List.empty,
      );
    });

    it('should fold map into array of its values', () => {
      expect(
        HashMap([1, 2], [3, 4]).foldMapK(arrayMonoidK())(x => [x]),
      ).toEqual(expect.arrayContaining([2, 4]));
    });
  });

  describe('traverse', () => {
    it('should produce some when map contains only even values', () => {
      expect(
        HashMap([1, 2], [3, 4]).traverse(Option.Monad)(v =>
          v % 2 === 0 ? Some(v) : None,
        ),
      ).toEqual(Some(HashMap([1, 2], [3, 4])));
    });

    it('should produce none when contains odd values', () => {
      expect(
        HashMap([1, 2], [3, 5]).traverse(Option.Monad)(v =>
          v % 2 === 0 ? Some(v) : None,
        ),
      ).toEqual(None);
    });
  });

  describe('show', () => {
    it('should show an empty map', () => {
      expect(HashMap.empty.show()).toBe('[Map entries: {}]');
    });

    it('should print out values', () => {
      expect(HashMap([1, 2], [2, 3]).show()).toBe(
        '[Map entries: { 2 => 3, 1 => 2 }]',
      );
    });

    it('should print out complex values', () => {
      expect(
        HashMap<number, [number, number]>([1, [2, 2]], [2, [3, 3]]).show({
          show: ([x, y]) => `(${x}, ${y})`,
        }),
      ).toBe('[Map entries: { 2 => (3, 3), 1 => (2, 2) }]');
    });
  });

  const monoidKTests = MonoidKSuite(HashMap.MonoidK(Hashable.any()));
  checkAll(
    'MonoidK<$<HashMapK, [number]>>',
    monoidKTests.monoidK(
      fc.integer(),
      Eq.fromUniversalEquals(),
      x => A.fp4tsHashMap(fc.integer(), x, Hashable.any()),
      E => HashMap.Eq(Eq.fromUniversalEquals(), E),
    ),
  );

  const functorFilterTests = FunctorFilterSuite(
    HashMap.FunctorFilter<number>(),
  );
  checkAll(
    'FunctorFilter<$<HashMapK, [number]>>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => A.fp4tsHashMap(fc.integer(), x, Hashable.any()),
      E => HashMap.Eq(Eq.fromUniversalEquals(), E),
    ),
  );

  const unorderedTraversableTests = UnorderedTraversableSuite(
    HashMap.UnorderedTraversable<number>(),
  );
  checkAll(
    'UnorderedTraversable<$<HashMapK, [number]>>',
    unorderedTraversableTests.unorderedTraversable<
      number,
      number,
      number,
      EvalF,
      EvalF
    >(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      CommutativeMonoid.addition,
      HashMap.Functor(),
      Monad.Eval,
      Monad.Eval,
      x => A.fp4tsHashMap(fc.integer(), x, Hashable.any()),
      E => HashMap.Eq(Eq.fromUniversalEquals(), E),
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );
});
