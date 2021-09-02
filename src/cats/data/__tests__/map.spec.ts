import { List } from '../list';
import { Some, None } from '../option';
import { primitiveMD5Hashable } from '../../hashable';
import { Map } from '../map';

describe('Map', () => {
  const H = primitiveMD5Hashable();

  const pairs: [number, string][] = [
    [1, 'test'],
    [2, 'another test'],
  ];

  describe('type', () => {
    it('should be covariant', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const m: Map<number, number> = Map.empty.insert(H, 1, 1);
    });

    it('should disallow type expansion for unrelated types', () => {
      const m: Map<number, string> = Map(...pairs);
      // @ts-expect-error
      m.lookup(H, 'some-string-key');
    });
  });

  describe('constructors', () => {
    it('should create map from enumerated list of pairs', () => {
      expect(Map(...pairs).toArray).toEqual(expect.arrayContaining(pairs));
    });

    it('should create map from a list of pairs', () => {
      expect(Map.fromList(H)(List(...pairs)).toArray).toEqual(
        expect.arrayContaining(pairs),
      );
    });

    it('should create map from an array of pairs', () => {
      expect(Map.fromArray(H)(pairs).toArray).toEqual(
        expect.arrayContaining(pairs),
      );
    });
  });

  describe('empty', () => {
    test('empty map to be empty', () => {
      expect(Map.empty.isEmpty).toBe(true);
    });

    test('non-empty map not to be empty', () => {
      expect(Map(...pairs).nonEmpty).toBe(true);
    });

    test('map with all elements filtered out to be empty', () => {
      expect(Map([1, 2], [3, 4]).filter(() => false).isEmpty).toBe(true);
    });
  });

  describe('keys', () => {
    it('should have no keys when empty', () => {
      expect(Map.empty.keys).toEqual(List.empty);
    });

    it('should return list of keys', () => {
      expect(Map(...pairs).keys.toArray).toEqual(
        expect.arrayContaining(pairs.map(([k]) => k)),
      );
    });
  });

  describe('values', () => {
    it('should have no values when empty', () => {
      expect(Map.empty.values).toEqual(List.empty);
    });

    it('should return list of values', () => {
      expect(Map(...pairs).values.toArray).toEqual(
        expect.arrayContaining(pairs.map(([, v]) => v)),
      );
    });
  });

  describe('size', () => {
    it('should be zero when empty', () => {
      expect(Map.empty.size).toBe(0);
    });

    it('should be zero all entries removed', () => {
      expect(Map([1, 2], [2, 3]).filter(() => false).size).toBe(0);
    });

    it('should be three', () => {
      expect(Map([1, 2], [2, 3], [3, 4]).size).toBe(3);
    });
  });

  describe('contains', () => {
    const m = Map(...pairs);

    it('should be true when the key exists', () => {
      expect(m.contains(H, 1)).toBe(true);
      expect(m.contains(H, 2)).toBe(true);
    });

    it('should be false when the key does not exists', () => {
      expect(m.contains(-1)).toBe(false);
      expect(Map.empty.contains('another missing key')).toBe(false);
    });
  });

  describe('lookup', () => {
    const m = Map(...pairs);

    it('should return the value when the key exists', () => {
      expect(m.lookup(H, 1)).toEqual(Some('test'));
      expect(m.lookup(H, 2)).toEqual(Some('another test'));
    });

    it('should return None when the key does not exists', () => {
      expect(m.lookup(-1)).toEqual(None);
      expect(Map.empty.lookup('another missing key')).toEqual(None);
    });
  });

  describe('insert', () => {
    it('should insert a pair to an empty map', () => {
      expect(Map.empty.insert(H, 'key', 'value').toArray).toEqual([
        ['key', 'value'],
      ]);
    });

    it('should expand a map with a new entry', () => {
      expect(Map(['k', 'v']).insert('key', 'value').toArray).toEqual(
        expect.arrayContaining([
          ['key', 'value'],
          ['k', 'v'],
        ]),
      );
    });

    it('should replace a value in the map', () => {
      expect(Map(['key', 'value']).insert('key', 'new-value').toArray).toEqual([
        ['key', 'new-value'],
      ]);
    });
  });

  describe('insertWith', () => {
    const cb = () => 'updated';

    it('should insert a pair to an empty map', () => {
      expect(Map.empty.insertWith(H, 'key', 'value', cb).toArray).toEqual([
        ['key', 'value'],
      ]);
    });

    it('should expand a map with a new entry', () => {
      expect(Map(['k', 'v']).insertWith('key', 'value', cb).toArray).toEqual(
        expect.arrayContaining([
          ['key', 'value'],
          ['k', 'v'],
        ]),
      );
    });

    it('should replace a value in the map', () => {
      expect(
        Map(['key', 'value']).insertWith('key', 'new-value', (o, n) => n)
          .toArray,
      ).toEqual([['key', 'new-value']]);
    });

    it('should not invoke the update callback when there is no collision', () => {
      expect(
        Map.empty.insertWith('key', 'value', () => 'updated').toArray,
      ).toEqual([['key', 'value']]);
    });

    it('should replace use callback to replace the value', () => {
      expect(
        Map(['key', 'value']).insertWith('key', 'new-value', cb).toArray,
      ).toEqual([['key', 'updated']]);
    });
  });

  describe('remove', () => {
    it('should return original map when key does not exist', () => {
      expect(Map([1, 2], [3, 4]).remove(H, -1)).toEqual(Map([1, 2], [3, 4]));
    });

    it('should remove existing entry from the map', () => {
      expect(Map([1, 2], [3, 4]).remove(3).toArray).toEqual([[1, 2]]);
    });
  });

  describe('update', () => {
    it('should return original map when key does not exist', () => {
      expect(Map([1, 2], [3, 4]).update(H, -1, () => -1)).toEqual(
        Map([1, 2], [3, 4]),
      );
    });

    it('should remove existing entry from the map', () => {
      expect(Map([1, 2], [3, 4]).update(3, x => x + 1)).toEqual(
        Map([1, 2], [3, 5]),
      );
    });
  });

  describe('union', () => {
    test('union of two empty maps to be empty', () => {
      expect(Map.empty.union(H, Map.empty)).toEqual(Map.empty);
    });

    it('should return map on union with empty on lhs', () => {
      expect(Map([1, 2], [3, 4]).union(Map.empty).toArray).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
        ]),
      );
    });

    it('should return map on union with empty on rhs', () => {
      expect(Map.empty.union(Map([1, 2], [3, 4])).toArray).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
        ]),
      );
    });

    it('should merge two maps with disjointed keys', () => {
      expect(Map([1, 2], [3, 4]).union(Map([5, 6], [7, 8])).toArray).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
        ]),
      );
    });

    it('should be left-bias when merging maps with intersecting keys', () => {
      expect(Map([1, 2], [3, 4]).union(Map([3, 9999], [5, 6])).toArray).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
          [5, 6],
        ]),
      );
    });

    it('should make no changes when merging two identical maps', () => {
      expect(Map([1, 2], [3, 4]).union(Map([1, 2], [3, 4])).toArray).toEqual(
        expect.arrayContaining([
          [1, 2],
          [3, 4],
        ]),
      );
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()].map(x => [x, x]);
      const ys = [...new Array(10_000).keys()].map(x => [x + 10_000, x]);
      const mx = Map(...(xs as [number, number][]));
      const my = Map(...(ys as [number, number][]));

      const rm = mx['+++'](my);
      const rs = rm.toArray.sort(([a], [b]) => a - b);

      expect(rs).toEqual([...xs, ...ys]);
    });
  });

  describe('unionWith', () => {
    it('should not invoke callback when no intersection is found', () => {
      const cb = (): number => -1;
      expect(
        Map([1, 2], [3, 4]).unionWith(Map([5, 6], [7, 8]), cb).toArray,
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
        Map([1, 2], [3, 4]).unionWith(Map([3, 9999], [5, 6]), cb).toArray,
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

      const rs = mx.intersect(my).toArray.sort(([a], [b]) => a - b);

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

  describe('filter', () => {
    it('should return empty map when empty initially', () => {
      expect(Map.empty.filter(() => false)).toEqual(Map.empty);
    });

    it('should filter out even values', () => {
      expect(
        Map([1, 1], [2, 2], [3, 3]).filter(x => x % 2 !== 0).toArray,
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
      expect(Map.empty.map(x => x * 2)).toEqual(Map.empty);
    });

    it('should double all values', () => {
      expect(Map([1, 2], [3, 4]).map(x => x * 2)).toEqual(Map([1, 4], [3, 8]));
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

  describe('foldLeft', () => {
    it('should return initial value when empty', () => {
      expect(Map.empty.foldLeft(0, (x, y) => x + y)).toBe(0);
    });

    it('should sum all values', () => {
      expect(Map([1, 2], [3, 4]).foldLeft(0, (x, y) => x + y)).toBe(6);
    });
  });

  describe('foldRight', () => {
    it('should return initial value when empty', () => {
      expect(Map.empty.foldRight(0, (y, x) => x + y)).toBe(0);
    });

    it('should sum all values', () => {
      expect(Map([1, 2], [3, 4]).foldRight(0, (y, x) => x + y)).toBe(6);
    });
  });
});
