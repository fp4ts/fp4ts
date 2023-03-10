// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, EvalF, fst, id, snd } from '@fp4ts/core';
import {
  CommutativeMonoid,
  Eq,
  Monad,
  Monoid,
  MonoidK,
  Option,
  Ord,
  Some,
  None,
  Identity,
  Const,
  Iter,
} from '@fp4ts/cats';
import { List, OrdMap } from '@fp4ts/collections';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as CA from '@fp4ts/collections-test-kit/lib/arbitraries';

import {
  MonoidKSuite,
  TraversableWithIndexSuite,
  TraversableFilterSuite,
  UnzipSuite,
  AlignSuite,
} from '@fp4ts/cats-laws';
import { isValid } from '@fp4ts/collections-core/lib/ord-map';

describe('Map', () => {
  describe('types', () => {
    it('should be covariant', () => {
      const m: OrdMap<number, number> = OrdMap.empty;
    });

    it('should disallow type expansion for unrelated types', () => {
      const m: OrdMap<number, string> = OrdMap([1, '2'], [2, '3']);
      // @ts-expect-error
      m.lookup('some-string-key');
    });
  });

  describe('constructors', () => {
    test('empty map to be empty', () => {
      expect(OrdMap.empty.isEmpty).toBe(true);
      expect(OrdMap.empty.nonEmpty).toBe(false);
    });

    test('map with value not to be empty', () => {
      expect(OrdMap([1, 2]).nonEmpty).toBe(true);
      expect(OrdMap([1, 2]).isEmpty).toBe(false);
    });

    it('should create an ordered map from an unordered array', () => {
      const xs = [5, 1, 7, 8, 10, -5].map(x => [x, x] as [number, number]);
      const m = OrdMap(...xs);
      expect(isValid(m)).toBe(true);
      expect(m.toArray).toEqual([
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
      const m = OrdMap.fromList(xs);
      expect(isValid(m)).toBe(true);
      expect(m.toArray).toEqual([
        [-5, -5],
        [1, 1],
        [5, 5],
        [7, 7],
        [8, 8],
        [10, 10],
      ]);
    });

    it('should create an ordered map from an ordered List', () => {
      const xs = List(5, 1, 7, 8, 10, -5)
        .sort()
        .map(x => [x, x] as [number, number]);
      const m = OrdMap.fromList(xs);
      expect(isValid(m)).toBe(true);
      expect(m.toArray).toEqual([
        [-5, -5],
        [1, 1],
        [5, 5],
        [7, 7],
        [8, 8],
        [10, 10],
      ]);
    });

    it(
      'should create an ordered map from an ordered List',
      forAll(CA.fp4tsList(fc.tuple(fc.integer(), fc.integer())), xs => {
        const m = OrdMap.fromDistinctAscList(
          xs
            .sortBy(([l], [r]) => Ord.fromUniversalCompare().compare(l, r))
            .distinctBy(([l], [r]) => l === r),
        );
        expect(isValid(m)).toBe(true);
        expect(m.toList).toEqual(
          xs
            .sortBy(([l], [r]) => Ord.fromUniversalCompare().compare(l, r))
            .distinctBy(([l], [r]) => l === r),
        );
      }),
    );

    it('should create an ordered map from a sorted array', () => {
      const xs = [-5, 1, 5, 7, 8, 10].map(x => [x, x] as [number, number]);
      const m = OrdMap.fromDistinctAscArray(xs);
      expect(isValid(m)).toBe(true);
      expect(m.toArray).toEqual([
        [-5, -5],
        [1, 1],
        [5, 5],
        [7, 7],
        [8, 8],
        [10, 10],
      ]);
    });

    it('should create an ordered map from a reversly sorted array', () => {
      const xs = [-5, 1, 5, 7, 8, 10]
        .map(x => [x, x] as [number, number])
        .reverse();
      const m = OrdMap.fromDistinctDescArray(xs);
      expect(isValid(m)).toBe(true);
      expect(m.toArray).toEqual([
        [-5, -5],
        [1, 1],
        [5, 5],
        [7, 7],
        [8, 8],
        [10, 10],
      ]);
    });

    it(
      'fromList is foldLeft insert',
      forAll(CA.fp4tsList(fc.tuple(fc.integer(), fc.integer())), xs => {
        const m1 = OrdMap.fromList(xs);
        const m2 = xs.foldLeft(
          OrdMap.empty as OrdMap<number, number>,
          (kv, [k, v]) => kv.insert(k, v),
        );
        expect(m1.toArray).toEqual(m2.toArray);
        expect(isValid(m1)).toBe(true);
      }),
    );

    it(
      'fromArray is reduce insert',
      forAll(fc.array(fc.tuple(fc.integer(), fc.integer())), xs => {
        const m1 = OrdMap.fromArray(xs);
        const m2 = xs.reduce(
          (kv, [k, v]) => kv.insert(k, v),
          OrdMap.empty as OrdMap<number, number>,
        );
        expect(m1.toArray).toEqual(m2.toArray);
        expect(isValid(m1)).toBe(true);
      }),
    );

    test('fromArrayWith', () => {
      expect(
        OrdMap.fromArrayWith(
          [
            [5, 'a'],
            [3, 'b'],
            [5, 'c'],
          ],
          (y, x) => x + y,
        ).toArray,
      ).toEqual([
        [3, 'b'],
        [5, 'ac'],
      ]);
    });

    test('fromListWith', () => {
      expect(
        OrdMap.fromListWith(List([5, 'a'], [3, 'b'], [5, 'c']), (y, x) => x + y)
          .toArray,
      ).toEqual([
        [3, 'b'],
        [5, 'ac'],
      ]);
    });
  });

  test(
    'view.toArray to be toArray',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), xs =>
      expect(xs.view.toArray).toEqual(xs.toArray),
    ),
  );

  test(
    'iterator.toArray to be toArray',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), xs =>
      expect(Iter.toArray(xs.iterator)).toEqual(xs.toArray),
    ),
  );

  test(
    'reverseIterator.toArray to be toArray.reverse()',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), xs =>
      expect(Iter.toArray(xs.reverseIterator)).toEqual(xs.toArray.reverse()),
    ),
  );

  test(
    'keys to be toArray.map(fst)',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), xs =>
      expect(xs.keys).toEqual(xs.toArray.map(fst)),
    ),
  );

  test(
    'keysView.toArray to be toArray.map(fst)',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), xs =>
      expect(xs.keysView.toArray).toEqual(xs.toArray.map(fst)),
    ),
  );

  test(
    'keysIterator.toArray to be toArray.map(fst)',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), xs =>
      expect(Iter.toArray(xs.keysIterator)).toEqual(xs.toArray.map(fst)),
    ),
  );

  test(
    'values to be toArray.map(snd)',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), xs =>
      expect(xs.values).toEqual(xs.toArray.map(snd)),
    ),
  );

  test(
    'valuesView.toArray to be toArray.map(snd)',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), xs =>
      expect(xs.valuesView.toArray).toEqual(xs.toArray.map(snd)),
    ),
  );

  test(
    'valuesIterator.toArray to be toArray.map(snd)',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), xs =>
      expect(Iter.toArray(xs.valuesIterator)).toEqual(xs.toArray.map(snd)),
    ),
  );

  describe('min', () => {
    it('should throw when map is empty', () => {
      expect(() => OrdMap.empty.min).toThrow();
    });

    it('should return first elements of the map', () => {
      expect(OrdMap([1, 2], [-1, 4]).min).toBe(4);
    });
  });

  describe('minOption', () => {
    it('should return None when empty', () => {
      expect(OrdMap.empty.minOption).toEqual(None);
    });

    it('should return first elements of the map', () => {
      expect(OrdMap([1, 2], [-1, 4]).minOption).toEqual(Some(4));
    });
  });

  describe('removeMin', () => {
    it('should return empty map when empty', () => {
      expect(OrdMap.empty.removeMin).toEqual(OrdMap.empty);
    });

    it('should remove element of the map', () => {
      expect(OrdMap([1, 2], [-1, 4]).removeMin).toEqual(OrdMap([1, 2]));
    });

    it(
      'should remain valid',
      forAll(CA.fp4tsOrdMap(fc.integer(), fc.string()), xs =>
        isValid(xs.removeMin),
      ),
    );
  });

  describe('removeMax', () => {
    it('should return empty map when empty', () => {
      expect(OrdMap.empty.removeMax).toEqual(OrdMap.empty);
    });

    it('should remove last element of the map', () => {
      expect(OrdMap([1, 2], [-1, 4]).removeMax).toEqual(OrdMap([-1, 4]));
    });

    it(
      'should remain valid',
      forAll(CA.fp4tsOrdMap(fc.integer(), fc.string()), xs =>
        isValid(xs.removeMax),
      ),
    );
  });

  describe('minOption', () => {
    it('should throw when map is empty', () => {
      expect(OrdMap.empty.minOption).toEqual(None);
    });

    it('should return first elements of the map', () => {
      expect(OrdMap([1, 2], [-1, 4]).minOption).toEqual(Some(4));
    });
  });

  describe('max', () => {
    it('should throw when map is empty', () => {
      expect(() => OrdMap.empty.max).toThrow();
    });

    it('should return max elements of the map', () => {
      expect(OrdMap([1, 2], [-1, 4]).max).toBe(2);
    });
  });

  describe('maxOption', () => {
    it('should return None when empty', () => {
      expect(OrdMap.empty.maxOption).toEqual(None);
    });

    it('should return last elements of the map', () => {
      expect(OrdMap([1, 2], [-1, 4]).maxOption).toEqual(Some(2));
    });
  });

  describe('minWithKey', () => {
    it('should return None when empty', () => {
      expect(() => OrdMap.empty.minWithKey).toThrow();
    });

    it('should return value with minimum key', () => {
      expect(OrdMap([1, 2], [-5, 10]).minWithKey).toEqual([-5, 10]);
    });
  });

  describe('minWithKeyOption', () => {
    it('should return None when empty', () => {
      expect(OrdMap.empty.minWithKeyOption).toEqual(None);
    });

    it('should return value with minimum key', () => {
      expect(OrdMap([1, 2], [-5, 10]).minWithKeyOption).toEqual(Some([-5, 10]));
    });
  });

  describe('maxWithKey', () => {
    it('should throw when empty', () => {
      expect(() => OrdMap.empty.maxWithKey).toThrow();
    });

    it('should return value with maximum key', () => {
      expect(OrdMap([1, 2], [-5, 10]).maxWithKey).toEqual([1, 2]);
    });
  });

  describe('maxWithKeyOption', () => {
    it('should return None when empty', () => {
      expect(OrdMap.empty.maxWithKeyOption).toEqual(None);
    });

    it('should return value with maximum key', () => {
      expect(OrdMap([1, 2], [-5, 10]).maxWithKeyOption).toEqual(Some([1, 2]));
    });
  });

  describe('popMin', () => {
    const abort = () => {
      throw new Error();
    };

    it('should return None when map is empty', () => {
      expect(OrdMap.empty.popMin).toEqual(None);
    });

    it('should return value with minimal key and rest of the map', () => {
      const [v, m] = OrdMap([1, 2], [2, 3], [4, 5]).popMin.fold(abort, id);

      expect(v).toBe(2);
      expect(m.toArray).toEqual([
        [2, 3],
        [4, 5],
      ]);
    });

    it(
      'should remain valid',
      forAll(CA.fp4tsOrdMap(fc.integer(), fc.string()), xs =>
        xs.popMin.fold(
          () => true,
          ([, xs]) => isValid(xs),
        ),
      ),
    );
  });

  describe('popMinWithKey', () => {
    const abort = () => {
      throw new Error();
    };

    it('should return None when map is empty', () => {
      expect(OrdMap.empty.popMinWithKey).toEqual(None);
    });

    it('should return value with minimal key and rest of the map', () => {
      const [kv, m] = OrdMap([1, 2], [2, 3], [4, 5]).popMinWithKey.fold(
        abort,
        id,
      );

      expect(kv).toEqual([1, 2]);
      expect(m.toArray).toEqual([
        [2, 3],
        [4, 5],
      ]);
    });

    it(
      'should remain valid',
      forAll(CA.fp4tsOrdMap(fc.integer(), fc.string()), xs =>
        xs.popMinWithKey.fold(
          () => true,
          ([, xs]) => isValid(xs),
        ),
      ),
    );
  });

  describe('popMax', () => {
    const abort = () => {
      throw new Error();
    };

    it('should return None when map is empty', () => {
      expect(OrdMap.empty.popMax).toEqual(None);
    });

    it('should return value with minimal key and rest of the map', () => {
      const [v, m] = OrdMap([1, 2], [2, 3], [4, 5]).popMax.fold(abort, id);

      expect(v).toBe(5);
      expect(m.toArray).toEqual([
        [1, 2],
        [2, 3],
      ]);
    });

    it(
      'should remain valid',
      forAll(CA.fp4tsOrdMap(fc.integer(), fc.string()), xs =>
        xs.popMax.fold(
          () => true,
          ([, xs]) => isValid(xs),
        ),
      ),
    );
  });

  describe('popMaxWithKey', () => {
    const abort = () => {
      throw new Error();
    };

    it('should return None when map is empty', () => {
      expect(OrdMap.empty.popMaxWithKey).toEqual(None);
    });

    it('should return value with minimal key and rest of the map', () => {
      const [kv, m] = OrdMap([1, 2], [2, 3], [4, 5]).popMaxWithKey.fold(
        abort,
        id,
      );

      expect(kv).toEqual([4, 5]);
      expect(m.toArray).toEqual([
        [1, 2],
        [2, 3],
      ]);
    });

    it(
      'should remain valid',
      forAll(CA.fp4tsOrdMap(fc.integer(), fc.string()), xs =>
        xs.popMaxWithKey.fold(
          () => true,
          ([, xs]) => isValid(xs),
        ),
      ),
    );
  });

  describe('contains', () => {
    const m = OrdMap([1, 2], [2, 3]);

    it('should be true when the key exists', () => {
      expect(m.contains(1)).toBe(true);
      expect(m.contains(2)).toBe(true);
    });

    it('should be false when the key does not exists', () => {
      expect(m.contains(-1)).toBe(false);
      expect(OrdMap.empty.contains('another missing key')).toBe(false);
    });

    test(
      'contains === lookup.nonEmpty',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.integer()),
        fc.integer(),
        (xs, k) => expect(xs.contains(k)).toBe(xs.lookup(k).nonEmpty),
      ),
    );
  });

  describe('lookup', () => {
    it('should return None when the map is empty', () => {
      expect(OrdMap.empty.lookup(1)).toEqual(None);
    });

    it('should return None when the key does not exist', () => {
      expect(OrdMap([1, 1]).lookup(42)).toEqual(None);
    });

    it('should return keyed value when the key exists', () => {
      expect(OrdMap([42, 1])['!?'](42)).toEqual(Some(1));
    });

    it(
      'should be toList.lookup',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.integer()),
        fc.integer(),
        (xs, k) => expect(xs.lookup(k)).toEqual(xs.toList.lookup(k)),
      ),
    );

    it(
      'should be get or throw',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.integer()),
        fc.integer(),
        (xs, k) =>
          xs.lookup(k).fold(
            () => expect(() => xs.get(k)).toThrow(),
            v => expect(xs['!!'](k)).toBe(v),
          ),
      ),
    );
  });

  test(
    'lookupLT to be split[0].max',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, k) =>
      xs.lookupLT(k).fold(
        () => expect(() => xs.split(k)[0].max).toThrow(),
        v => expect(xs.split(k)[0].maxWithKey).toEqual(v),
      ),
    ),
  );

  test(
    'lookupGT to be split[1].min',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, k) =>
      xs.lookupGT(k).fold(
        () => expect(() => xs.split(k)[1].min).toThrow(),
        v => expect(xs.split(k)[1].minWithKey).toEqual(v),
      ),
    ),
  );

  test(
    'lookupLE to be splitLookup[1] orElse _.max',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, k) =>
      xs.lookupLE(k).fold(
        () => expect(() => xs.splitLookup(k)[0].max).toThrow(),
        kv => {
          const [l, m] = xs.splitLookup(k);
          return expect(
            m.fold(
              () => l.maxWithKey,
              v => [kv[0], v],
            ),
          ).toEqual(kv);
        },
      ),
    ),
  );

  test(
    'lookupGE to be splitLookup[1] orElse _.min',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, k) =>
      xs.lookupGE(k).fold(
        () => expect(() => xs.splitLookup(k)[2].min).toThrow(),
        kv => {
          const [, m, r] = xs.splitLookup(k);
          return expect(
            m.fold(
              () => r.minWithKey,
              v => [kv[0], v],
            ),
          ).toEqual(kv);
        },
      ),
    ),
  );

  describe('insert', () => {
    it('should insert a value to an empty map', () => {
      expect(OrdMap.empty.insert(1, 1).toArray).toEqual([[1, 1]]);
    });

    it('should two values to existing map', () => {
      expect(OrdMap([5, 5]).insert(1, 1).insert(10, 10).toArray).toEqual([
        [1, 1],
        [5, 5],
        [10, 10],
      ]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()].reverse();
      let m: OrdMap<number, number> = OrdMap.empty;

      for (let i = 0; i < 10_000; i++) {
        m = m.insert(xs[i], xs[i]);
      }

      expect(m.toArray).toEqual;
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        fc.integer(),
        fc.string(),
        (xs, k, v) => isValid(xs.insert(k, v)),
      ),
    );
  });

  describe('insertWith', () => {
    it('should insert a value in an empty map', () => {
      expect(OrdMap.empty.insertWith(1, 1, () => 999)).toEqual(OrdMap([1, 1]));
    });

    it('should not override a value when the key does not exist', () => {
      expect(OrdMap([2, 2]).insertWith(1, 1, () => 999).toArray).toEqual([
        [1, 1],
        [2, 2],
      ]);
    });

    it('should override a value when it already exists', () => {
      expect(
        OrdMap([1, 1], [2, 2]).insertWith(1, 1, () => 999).toArray,
      ).toEqual([
        [1, 999],
        [2, 2],
      ]);
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        fc.integer(),
        fc.string(),
        (xs, k, v) => isValid(xs.insertWith(k, v, id)),
      ),
    );
  });

  describe('remove', () => {
    it('should do nothing when map is empty', () => {
      expect(OrdMap.empty.remove(2)).toEqual(OrdMap.empty);
    });

    it('should do nothing when key does not exist in the map', () => {
      expect(OrdMap([1, 2]).remove(2)).toEqual(OrdMap([1, 2]));
    });

    it('should remove existing key from the map', () => {
      expect(OrdMap([1, 2], [2, 3]).remove(2)).toEqual(OrdMap([1, 2]));
    });

    it(
      'should remain valid',
      forAll(CA.fp4tsOrdMap(fc.integer(), fc.string()), fc.integer(), (xs, k) =>
        isValid(xs.remove(k)),
      ),
    );
  });

  describe('adjust', () => {
    it('should do nothing when map is empty', () => {
      expect(OrdMap.empty.adjust(42, () => 999)).toEqual(OrdMap.empty);
    });

    it('should do nothing when the key does not exist', () => {
      expect(OrdMap([1, 2]).adjust(42, () => 999)).toEqual(OrdMap([1, 2]));
    });

    it('should adjust existing key', () => {
      expect(OrdMap([1, 2], [42, 2]).adjust(42, () => 999)).toEqual(
        OrdMap([1, 2], [42, 999]),
      );
    });
  });

  describe('update', () => {
    test(
      '_ => None is remove',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.integer()),
        fc.integer(),
        (xs, k) => {
          expect(xs.update(k, _ => None).toArray).toEqual(xs.remove(k).toArray);
          expect(isValid(xs.update(k, _ => None))).toBe(true);
        },
      ),
    );

    test(
      'x => Some(f(x)) is adjust',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.integer()),
        fc.integer(),
        fc.func(fc.integer()),
        (xs, k, f) => {
          expect(xs.update(k, x => Some(f(x))).toArray).toEqual(
            xs.adjust(k, x => f(x)).toArray,
          );
          expect(isValid(xs.update(k, x => Some(f(x))))).toBe(true);
        },
      ),
    );
  });

  test(
    'alter is combination of lookup and insert/remove',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.integer(),
      fc.func(A.fp4tsOption(fc.integer())),
      (xs, k, f) => {
        expect(xs.alter(k, x => f(x)).toArray).toEqual(
          f(xs.lookup(k)).fold(
            () => xs.remove(k),
            x => xs.insert(k, x),
          ).toArray,
        );
        expect(isValid(xs.alter(k, x => f(x)))).toBe(true);
      },
    ),
  );

  test(
    'alterF Identity is alter',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.integer(),
      fc.func(A.fp4tsOption(fc.integer())),
      (xs, k, f) => {
        expect(xs.alterF(Identity.Monad, k, x => f(x)).toArray).toEqual(
          xs.alter(k, x => f(x)).toArray,
        );
        expect(isValid(xs.alterF(Identity.Monad, k, x => f(x)))).toBe(true);
      },
    ),
  );

  test(
    'alterF Const is f(lookup(k))',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.integer(),
      fc.func(fc.string()),
      (xs, k, f) =>
        expect(xs.alterF(Const.Functor<string>(), k, x => f(x))).toEqual(
          f(xs.lookup(k)),
        ),
    ),
  );

  test(
    'alterF Eval is alter',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.integer(),
      fc.func(A.fp4tsOption(fc.integer())),
      (xs, k, f) => {
        expect(
          xs.alterF(Monad.Eval, k, x => Eval.now(f(x))).value.toArray,
        ).toEqual(xs.alter(k, x => f(x)).toArray);
        expect(
          isValid(xs.alterF(Monad.Eval, k, x => Eval.now(f(x))).value),
        ).toBe(true);
      },
    ),
  );

  describe('union', () => {
    test('union of two empty maps to be empty', () => {
      expect(OrdMap.empty.union(OrdMap.empty)).toEqual(OrdMap.empty);
    });

    it('should return map on union with empty on lhs', () => {
      expect(OrdMap([1, 2], [3, 4]).union(OrdMap.empty).toArray).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('should return map on union with empty on rhs', () => {
      expect(OrdMap.empty.union(OrdMap([1, 2], [3, 4])).toArray).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('should create a union two maps with disjointed keys', () => {
      expect(
        OrdMap([1, 2], [3, 4]).union(OrdMap([5, 6], [7, 8])).toArray,
      ).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
      ]);
    });

    it('should be left-bias when merging maps with intersecting keys', () => {
      expect(
        OrdMap([1, 2], [3, 4]).union(OrdMap([3, 9999], [5, 6])).toArray,
      ).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it('should make no changes when merging two identical maps', () => {
      expect(
        OrdMap([1, 2], [3, 4]).union(OrdMap([1, 2], [3, 4])).toArray,
      ).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()].map(x => [x, x]);
      const ys = [...new Array(10_000).keys()].map(x => [x + 10_000, x]);
      const mx = OrdMap(...(xs as [number, number][]));
      const my = OrdMap(...(ys as [number, number][]));

      const rs = mx.union(my).toArray;

      expect(rs).toEqual([...xs, ...ys]);
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        (xs, ys) => isValid(xs.union(ys)),
      ),
    );
  });

  describe('unionWith', () => {
    it('should not invoke callback when no intersection is found', () => {
      const cb = (): number => -1;
      expect(
        OrdMap([1, 2], [3, 4]).unionWith(OrdMap([5, 6], [7, 8]), cb).toArray,
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
        OrdMap([1, 2], [3, 4]).unionWith(OrdMap([3, 9999], [5, 6]), cb).toArray,
      ).toEqual([
        [1, 2],
        [3, 9999],
        [5, 6],
      ]);
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        (xs, ys) => isValid(xs.unionWith(ys, id)),
      ),
    );
  });

  describe('intersect', () => {
    it('should product an empty intersection when both empty', () => {
      expect(OrdMap.empty.intersect(OrdMap.empty)).toEqual(OrdMap.empty);
    });

    it('should product an empty intersection when lhs empty', () => {
      expect(OrdMap.empty.intersect(OrdMap([2, 3]))).toEqual(OrdMap.empty);
    });

    it('should product an empty intersection when rhs empty', () => {
      expect(OrdMap([1, 2]).intersect(OrdMap.empty)).toEqual(OrdMap.empty);
    });

    it('should product an empty intersection when no keys shared', () => {
      expect(OrdMap([1, 2]).intersect(OrdMap([2, 3]))).toEqual(OrdMap.empty);
    });

    it('should create a left-bias singleton intersection', () => {
      expect(
        OrdMap([1, 2], [2, 3]).intersect(OrdMap([2, 999], [3, 4])).toArray,
      ).toEqual([[2, 3]]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()].map(x => [x, x]);
      const ys = [...new Array(10_000).keys()].map(x => [x + 5_000, x]);
      const mx = OrdMap(...(xs as [number, number][]));
      const my = OrdMap(...(ys as [number, number][]));

      const rs = mx.intersect(my).toArray;

      expect(rs).toEqual(xs.slice(5_000));
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        (xs, ys) => isValid(xs.intersect(ys)),
      ),
    );
  });

  describe('intersectWith', () => {
    it('should return an empty map when no keys match', () => {
      expect(
        OrdMap([1, 2], [3, 4]).intersectWith(
          OrdMap([4, 5], [6, 7]),
          (x, y) => x + y,
        ).toArray,
      ).toEqual([]);
    });

    it('should sum values with matching keys', () => {
      expect(
        OrdMap([1, 2], [3, 4]).intersectWith(
          OrdMap([3, 5], [6, 7]),
          (x, y) => x + y,
        ).toArray,
      ).toEqual([[3, 9]]);
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        (xs, ys) => isValid(xs.intersectWith(ys, id)),
      ),
    );
  });

  describe('difference', () => {
    it('should return id when difference with empty map', () => {
      expect(OrdMap([1, 2], [2, 3])['\\'](OrdMap.empty).toArray).toEqual([
        [1, 2],
        [2, 3],
      ]);
    });

    it('should remove shared keys', () => {
      expect(
        OrdMap([1, 2], [2, 3])['\\'](OrdMap([2, 3], [3, 4])).toArray,
      ).toEqual([[1, 2]]);
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        (xs, ys) => isValid(xs['\\'](ys)),
      ),
    );

    test('differenceWith', () => {
      const f = (x: string, y: string) =>
        x === 'b' ? None : Some(x + ':' + y);
      expect(
        OrdMap([3, 'a'], [5, 'b']).differenceWith(
          OrdMap([3, 'A'], [5, 'B'], [7, 'C']),
          f,
        ).toArray,
      ).toEqual([[3, 'a:A']]);
    });
  });

  describe('symmetricDifference', () => {
    it('should return id when difference with empty map', () => {
      expect(OrdMap([1, 2], [2, 3])['\\//'](OrdMap.empty).toArray).toEqual([
        [1, 2],
        [2, 3],
      ]);
    });

    it('should yield union of differences', () => {
      expect(
        OrdMap([1, 2], [2, 3])['\\//'](OrdMap([2, 3], [3, 4])).toArray,
      ).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        (xs, ys) => isValid(xs['\\//'](ys)),
      ),
    );
  });

  test(
    'marge preserving and dropping to be union',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      (xs, ys) =>
        expect(
          xs.merge(
            ys,
            {
              missingKey: (k, x) => Some(x),
              missingSubtree: id,
            },
            {
              missingKey: (k, x) => Some(x),
              missingSubtree: id,
            },
            (k, x, y) => Some(x),
          ).toArray,
        ).toEqual(xs.union(ys).toArray),
    ),
  );

  test(
    'margeA Eval preserving and dropping to be union',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      (xs, ys) =>
        expect(
          xs.mergeA(
            Monad.Eval,
            ys,
            {
              missingKey: (k, x) => Eval.now(Some(x)),
              missingSubtree: Eval.now,
            },
            {
              missingKey: (k, x) => Eval.now(Some(x)),
              missingSubtree: Eval.now,
            },
            (k, x, y) => Eval.now(Some(x)),
          ).value.toArray,
        ).toEqual(xs.union(ys).toArray),
    ),
  );

  test(
    'margeA Identity to be merge',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      (xs, ys) =>
        expect(
          xs.mergeA(
            Identity.Applicative,
            ys,
            {
              missingKey: (k, x) => Some(x),
              missingSubtree: id,
            },
            {
              missingKey: (k, x) => Some(x),
              missingSubtree: id,
            },
            (k, x, y) => Some(x),
          ).toArray,
        ).toEqual(
          xs.merge(
            ys,
            {
              missingKey: (k, x) => Some(x),
              missingSubtree: id,
            },
            {
              missingKey: (k, x) => Some(x),
              missingSubtree: id,
            },
            (k, x, y) => Some(x),
          ).toArray,
        ),
    ),
  );

  test(
    'disjoint === x.intersect(y).isEmpty',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.string()),
      CA.fp4tsOrdMap(fc.integer(), fc.string()),
      (xs, ys) => expect(xs.disjoint(ys)).toBe(xs.intersect(ys).isEmpty),
    ),
  );

  test(
    'split',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.integer(),
      (xs, k) => {
        const [lt, gt] = xs.split(k);
        expect(lt.toArray.every(kv => kv[0] < k));
        expect(gt.toArray.every(kv => kv[0] > k));
      },
    ),
  );

  test(
    'splitContains',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.integer(),
      (xs, k) => {
        const [lt, found, gt] = xs.splitContains(k);
        expect(found).toBe(xs.contains(k));
        expect(lt.toArray.every(kv => kv[0] < k));
        expect(gt.toArray.every(kv => kv[0] > k));
      },
    ),
  );

  test(
    'splitLookup',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.integer(),
      (xs, k) => {
        const [lt, found, gt] = xs.splitLookup(k);
        expect(found).toEqual(xs.lookup(k));
        expect(lt.toArray.every(kv => kv[0] < k));
        expect(gt.toArray.every(kv => kv[0] > k));
      },
    ),
  );

  describe('filter', () => {
    it('should return empty map when empty initially', () => {
      expect(OrdMap.empty.filter(() => false)).toEqual(OrdMap.empty);
    });

    it('should filter out even values', () => {
      expect(
        OrdMap([1, 1], [2, 2], [3, 3]).filter(x => x % 2 !== 0).toArray,
      ).toEqual([
        [1, 1],
        [3, 3],
      ]);
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        fc.func<[string, number], boolean>(fc.boolean()),
        (xs, f) => isValid(xs.filter(f)),
      ),
    );
  });

  describe('map', () => {
    it('should return empty map when empty initially', () => {
      expect(OrdMap.empty.map(x => x * 2)).toEqual(OrdMap.empty);
    });

    it('should double all values', () => {
      expect(OrdMap([1, 2], [3, 4]).map(x => x * 2)).toEqual(
        OrdMap([1, 4], [3, 8]),
      );
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        fc.func<[string, number], number>(fc.integer()),
        (xs, f) => isValid(xs.map(f)),
      ),
    );
  });

  describe('collect', () => {
    it('should return empty map when empty initially', () => {
      expect(OrdMap.empty.collect(Some)).toEqual(OrdMap.empty);
    });

    it('should collect even numbers', () => {
      expect(
        OrdMap([1, 2], [2, 3], [3, 4], [4, 5]).collect(x =>
          x % 2 === 0 ? Some(x) : None,
        ).toArray,
      ).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it(
      'should remain valid',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.string()),
        fc.func<[string, number], Option<number>>(A.fp4tsOption(fc.integer())),
        (xs, f) => isValid(xs.collect(f)),
      ),
    );
  });

  test(
    'partition to be toList.partition',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.func(fc.boolean()),
      (xs, f) =>
        expect(xs.partition((v, k) => f(k, v)).map(xs => xs.toList)).toEqual(
          xs.toList.partition(([k, v]) => f(k, v)),
        ),
    ),
  );

  test(
    'partitionMap to be toList.partitionWith',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.func(A.fp4tsEither(fc.boolean(), fc.string())),
      (xs, f) =>
        expect(xs.partitionMap((v, k) => f(k, v)).map(xs => xs.toList)).toEqual(
          xs.toList.partitionWith(([k, v]) =>
            f(k, v).bimap(
              v => [k, v],
              v => [k, v],
            ),
          ),
        ),
    ),
  );

  test(
    'mapAccumL is foldLeft and map',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.func(fc.integer()),
      fc.func(fc.string()),
      fc.string(),
      (xs, f, g, z) => {
        const [m, r] = xs.mapAccumL(z, (b, v) => [f(v), g(b, v)]);
        expect([m.toArray, r]).toEqual([
          xs.map(v => f(v)).toArray,
          xs.foldLeft(z, (b, v) => g(b, v)),
        ]);
        expect(isValid(m)).toBe(true);
      },
    ),
  );

  test(
    'mapAccumR is foldLeft and map',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.func(fc.integer()),
      fc.func(fc.string()),
      fc.string(),
      (xs, f, g, z) => {
        const [m, r] = xs.mapAccumR(z, (b, v) => [f(v), g(b, v)]);
        expect([m.toArray, r]).toEqual([
          xs.map(v => f(v)).toArray,
          xs.foldRight_(z, (v, b) => g(b, v)),
        ]);
        expect(isValid(m)).toBe(true);
      },
    ),
  );

  test(
    'mapKeys to be toArray.map.fromArray',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.func(fc.integer()),
      (xs, f) =>
        expect(xs.mapKeys(k => f(k)).toArray).toEqual(
          OrdMap.fromArray(xs.toArray.map(([k, v]) => [f(k), v])).toArray,
        ),
    ),
  );
  test(
    'mapKeys to be toArray.map.fromArrayWith',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.func(fc.integer()),
      fc.func(fc.integer()),
      (xs, f, c) =>
        expect(xs.mapKeysWith(k => f(k), c).toArray).toEqual(
          OrdMap.fromArrayWith(
            xs.toArray.map(([k, v]) => [f(k), v]),
            c,
          ).toArray,
        ),
    ),
  );

  test(
    'take.toList to be toList.take',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.take(n).toList).toEqual(xs.toList.take(n)),
    ),
  );
  test(
    'drop.toList to be toList.drop',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.drop(n).toList).toEqual(xs.toList.drop(n)),
    ),
  );
  test(
    'takeRight.toList to be toList.takeRight',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.takeRight(n).toList).toEqual(xs.toList.takeRight(n)),
    ),
  );
  test(
    'dropRight.toList to be toList.dropRight',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.dropRight(n).toList).toEqual(xs.toList.dropRight(n)),
    ),
  );

  test(
    'splitAt.toList to be toList.splitAt',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.splitAt(n).map(xs => xs.toList)).toEqual(xs.toList.splitAt(n)),
    ),
  );

  test(
    'modifyAt.toList to be toList.modifyAt',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.integer(),
      fc.func(fc.integer()),
      (xs, n, f) =>
        n < 0 || n >= xs.size
          ? expect(() => xs.modifyAt(n, (v, k) => f(k, v))).toThrow()
          : expect(xs.modifyAt(n, (v, k) => f(k, v)).toList).toEqual(
              xs.toList.modifyAt(
                n,
                ([k, v]) => [k, f(k, v)] as [number, number],
              ),
            ),
    ),
  );

  test(
    'updateAt.toList to be toList.get and replaceAt/removeAt',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.integer(),
      fc.func(A.fp4tsOption(fc.integer())),
      (xs, n, f) =>
        n < 0 || n >= xs.size
          ? expect(() => xs.updateAt(n, (v, k) => f(k, v))).toThrow()
          : expect(xs.updateAt(n, (v, k) => f(k, v)).toList).toEqual(
              f(...xs.toList.get(n)).fold(
                () => xs.toList.removeAt(n),
                x => xs.toList.replaceAt(n, [xs.toList.get(n)[0], x]),
              ),
            ),
    ),
  );

  test(
    'removeAt.toList to be toList.removeAt',
    forAll(CA.fp4tsOrdMap(fc.integer(), fc.integer()), fc.integer(), (xs, n) =>
      n < 0 || n >= xs.size
        ? expect(() => xs.removeAt(n)).toThrow()
        : expect(xs.removeAt(n).toList).toEqual(xs.toList.removeAt(n)),
    ),
  );

  test(
    'findIndex.toList to be toList.findIndex',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      fc.func(fc.boolean()),
      (xs, f) =>
        expect(xs.findIndex(v => f(v))).toEqual(
          xs.toList.findIndex(([k, v]) => f(v)),
        ),
    ),
  );

  describe('foldLeft', () => {
    it('should return initial value when empty', () => {
      expect(OrdMap.empty.foldLeft(0, (x, y) => x + y)).toBe(0);
    });

    it('should sum all values', () => {
      expect(OrdMap([1, 2], [3, 4]).foldLeft(0, (x, y) => x + y)).toBe(6);
    });

    it('should be left-associate', () => {
      expect(
        OrdMap([1, 2], [2, 3], [4, 5]).foldLeft(
          '',
          (s, v, k) => `(${s}) + (${k} + ${v})`,
        ),
      ).toBe('((() + (1 + 2)) + (2 + 3)) + (4 + 5)');
    });

    test(
      'foldLeft to be toList.foldLeft',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.integer()),
        fc.string(),
        fc.func(fc.string()),
        (xs, z, f) =>
          expect(xs.foldLeft(z, (b, v, k) => f(b, k, v))).toEqual(
            xs.toList.foldLeft(z, (b, [k, v]) => f(b, k, v)),
          ),
      ),
    );
  });

  test(
    'foldRight to be toList.foldRight',
    forAll(
      CA.fp4tsOrdMap(fc.integer(), fc.integer()),
      A.fp4tsEval(fc.string()),
      fc.func(A.fp4tsEval(fc.string())),
      (xs, z, f) =>
        expect(xs.foldRight(z, (v, b, k) => f(k, v, b)).value).toEqual(
          xs.toList.foldRight(z, ([k, v], b) => f(k, v, b)).value,
        ),
    ),
  );

  describe('foldRight_', () => {
    it('should return initial value when empty', () => {
      expect(OrdMap.empty.foldRight_(0, (y, x) => x + y)).toBe(0);
    });

    it('should sum all values', () => {
      expect(OrdMap([1, 2], [3, 4]).foldRight_(0, (y, x) => x + y)).toBe(6);
    });

    it('should be right-associate', () => {
      expect(
        OrdMap([1, 2], [2, 3], [4, 5]).foldRight_(
          '',
          (v, s, k) => `(${k} + ${v}) + (${s})`,
        ),
      ).toBe('(1 + 2) + ((2 + 3) + ((4 + 5) + ()))');
    });

    test(
      'foldRight_ to be toList.foldRight_',
      forAll(
        CA.fp4tsOrdMap(fc.integer(), fc.integer()),
        fc.string(),
        fc.func(fc.string()),
        (xs, z, f) =>
          expect(xs.foldRight_(z, (v, b, k) => f(k, v, b))).toEqual(
            xs.toList.foldRight_(z, ([k, v], b) => f(k, v, b)),
          ),
      ),
    );
  });

  describe('foldMap', () => {
    it('should fold empty map into list', () => {
      expect(
        OrdMap.empty.foldMap(List.MonoidK.algebra(), x => List(x)),
      ).toEqual(List.empty);
    });

    it('should fold map into array of its values', () => {
      expect(
        OrdMap([1, 2], [3, 4]).foldMap(Monoid.Array<number>(), x => [x]),
      ).toEqual([2, 4]);
    });
  });

  describe('foldMapK', () => {
    it('should fold empty map into list', () => {
      expect(OrdMap.empty.foldMapK(List.MonoidK, x => List(x))).toEqual(
        List.empty,
      );
    });

    it('should fold map into array of its values', () => {
      expect(OrdMap([1, 2], [3, 4]).foldMapK(MonoidK.Array, x => [x])).toEqual([
        2, 4,
      ]);
    });
  });

  describe('traverse', () => {
    it('should produce some when map contains only even values', () => {
      expect(
        OrdMap([1, 2], [3, 4]).traverse(Option.Monad, v =>
          v % 2 === 0 ? Some(v) : None,
        ),
      ).toEqual(Some(OrdMap([1, 2], [3, 4])));
    });

    it('should produce none when contains odd values', () => {
      expect(
        OrdMap([1, 2], [3, 5]).traverse(Option.Monad, v =>
          v % 2 === 0 ? Some(v) : None,
        ),
      ).toEqual(None);
    });
  });

  describe('show', () => {
    it('should show an empty map', () => {
      expect(OrdMap.empty.toString()).toBe('OrdMap()');
    });

    it('should print out values', () => {
      expect(OrdMap([1, 2], [2, 3]).toString()).toBe('OrdMap([1, 2], [2, 3])');
    });
  });

  describe('Tree validity', () => {
    type Action<K, V> =
      | { type: 'insert'; k: K; v: V }
      | { type: 'remove'; k: K }
      | { type: 'update'; k: K; f: (v: V) => Option<V> }
      | { type: 'alter'; k: K; f: (v: Option<V>) => Option<V> }
      | { type: 'intersect'; that: OrdMap<K, V> }
      | { type: 'union'; that: OrdMap<K, V> }
      | { type: 'difference'; that: OrdMap<K, V> };

    const actionArbitrary = <K, V>(
      arbK: Arbitrary<K>,
      arbV: Arbitrary<V>,
      O: Ord<K>,
    ): Arbitrary<Action<K, V>> =>
      fc.oneof(
        { depthSize: 'small' },
        fc
          .tuple(arbK, arbV)
          .map(([k, v]) => ({ type: 'insert' as const, k, v })),
        arbK.map(k => ({ type: 'remove' as const, k })),
        fc
          .tuple(arbK, fc.func(A.fp4tsOption(arbV)))
          .map(([k, f]) => ({ type: 'update' as const, k, f })),
        fc
          .tuple(arbK, fc.func(A.fp4tsOption(arbV)))
          .map(([k, f]) => ({ type: 'alter' as const, k, f })),
        fc
          .array(fc.tuple(arbK, arbV), { maxLength: 100 })
          .map(xs => OrdMap.fromArray(xs, O))
          .map(that => ({
            type: 'intersect' as const,
            that,
          })),
        fc
          .array(fc.tuple(arbK, arbV), { maxLength: 100 })
          .map(xs => OrdMap.fromArray(xs, O))
          .map(that => ({
            type: 'union' as const,
            that,
          })),
        fc
          .array(fc.tuple(arbK, arbV), { maxLength: 100 })
          .map(xs => OrdMap.fromArray(xs, O))
          .map(that => ({
            type: 'difference' as const,
            that,
          })),
      );

    const executeAction =
      <K>(O: Ord<K>) =>
      <V>(s: OrdMap<K, V>, a: Action<K, V>): OrdMap<K, V> => {
        switch (a.type) {
          case 'insert':
            return s.insert(a.k, a.v, O);
          case 'remove':
            return s.remove(a.k, O);
          case 'update':
            return s.update(a.k, v => a.f(v), O);
          case 'alter':
            return s.alter(a.k, v => a.f(v), O);
          case 'intersect':
            return s.intersect(a.that, O);
          case 'union':
            return s.union(a.that, O);
          case 'difference':
            return s.difference(a.that, O);
        }
      };

    it('should remain valid after running a sequence of actions', () => {
      fc.assert(
        fc.property(
          fc
            .array(fc.tuple(fc.integer(), fc.integer()), { maxLength: 250 })
            .map(OrdMap.fromArray),
          fc.array(
            actionArbitrary(
              fc.integer(),
              fc.integer(),
              Ord.fromUniversalCompare(),
            ),
            { minLength: 100 },
          ),
          (s, as) =>
            expect(
              isValid(
                as.reduce(executeAction(Ord.fromUniversalCompare())<number>, s),
              ),
            ).toBe(true),
        ),
        { numRuns: 10000 },
      );
    });
  });

  describe('Laws', () => {
    checkAll(
      'MonoidK<OrdMap<PrimitiveType, *>>',
      MonoidKSuite(OrdMap.MonoidK(Ord.fromUniversalCompare())).monoidK(
        fc.integer(),
        Eq.fromUniversalEquals(),
        x => CA.fp4tsOrdMap(fc.integer(), x),
        E => OrdMap.Eq(Eq.fromUniversalEquals(), E),
      ),
    );

    checkAll(
      'TraversableWithIndex<OrdMap<number, *>, number>',
      TraversableWithIndexSuite(
        OrdMap.TraversableWithIndex<number>(),
      ).traversableWithIndex<number, number, number, EvalF, EvalF>(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        OrdMap.FunctorWithIndex(),
        Monad.Eval,
        Monad.Eval,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        x => CA.fp4tsOrdMap(fc.integer(), x),
        E => OrdMap.Eq(Eq.fromUniversalEquals(), E),
        A.fp4tsEval,
        Eq.Eval,
        A.fp4tsEval,
        Eq.Eval,
      ),
    );

    checkAll(
      'TraversableFilter<OrdMap<number, *>, number>',
      TraversableFilterSuite(
        OrdMap.TraversableFilter<number>(),
      ).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        OrdMap.FunctorFilter(),
        Monad.Eval,
        Monad.Eval,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        x => CA.fp4tsOrdMap(fc.integer(), x),
        E => OrdMap.Eq(Eq.fromUniversalEquals(), E),
        A.fp4tsEval,
        Eq.Eval,
        A.fp4tsEval,
        Eq.Eval,
      ),
    );

    checkAll(
      'Align<OrdMap<number, *>, number>',
      AlignSuite(OrdMap.Align<number>(Ord.fromUniversalCompare())).align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        x => CA.fp4tsOrdMap(fc.integer(), x),
        E => OrdMap.Eq(Eq.fromUniversalEquals(), E),
      ),
    );

    checkAll(
      'Unzip<OrdMap<number, *>, number>',
      UnzipSuite(OrdMap.Unzip<number>()).unzip(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        x => CA.fp4tsOrdMap(fc.integer(), x),
        E => OrdMap.Eq(Eq.fromUniversalEquals(), E),
      ),
    );
  });
});
