// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { id } from '@fp4ts/core';
import {
  Ord,
  Eq,
  Monoid,
  Some,
  None,
  CommutativeMonoid,
  Iter,
} from '@fp4ts/cats';
import { List, OrdSet } from '@fp4ts/collections-core';
import { isValid } from '@fp4ts/collections-core/lib/ord-set';
import {
  CommutativeMonoidSuite,
  CommutativeSemigroupSuite,
  FoldableSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as CA from '@fp4ts/collections-test-kit/lib/arbitraries';

describe('OrdSet', () => {
  describe('types', () => {
    it('should be covariant', () => {
      const s: OrdSet<number> = OrdSet.empty;
    });

    it('should disallow type expansion for unrelated types', () => {
      const s: OrdSet<number> = OrdSet(42);

      // @ts-expect-error
      s.insert('my-string');
    });
  });

  describe('constructors', () => {
    test('empty set to be empty', () => {
      expect(OrdSet.empty.isEmpty).toBe(true);
      expect(OrdSet.empty.nonEmpty).toBe(false);
    });

    test('singleton list not to be empty', () => {
      expect(OrdSet(42).nonEmpty).toBe(true);
      expect(OrdSet(42).isEmpty).toBe(false);
    });

    it('should create an ordered set from an unordered array', () => {
      const s = OrdSet.fromArray([3, 4, 8, 4, 1, 99]);
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([1, 3, 4, 8, 99]);
    });

    it('should create an ordered set from an ordered array', () => {
      const s = OrdSet.fromArray([1, 2, 3, 4, 5]);
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3, 4, 5]);
    });

    it('should create an ordered set from an unordered List', () => {
      const s = OrdSet.fromList(List(3, 4, 8, 4, 1, 99));
      expect(isValid(s)).toBe(true);
      expect(s.toList).toEqual(List(1, 3, 4, 8, 99));
    });

    it('should create an ordered set from an ordered List', () => {
      const s = OrdSet.fromList(List(1, 2, 3, 4, 5));
      expect(isValid(s)).toBe(true);
      expect(s.toList).toEqual(List(1, 2, 3, 4, 5));
    });

    test(
      'fromArray is reduce insert',
      forAll(fc.array(fc.integer()), xs => {
        expect(OrdSet.fromArray(xs).toArray).toEqual(
          xs.reduce((xs, x) => xs.insert(x), OrdSet.empty as OrdSet<number>)
            .toArray,
        );
        expect(isValid(OrdSet.fromArray(xs))).toBe(true);
      }),
    );

    test(
      'fromList is foldLeft insert',
      forAll(CA.fp4tsList(fc.integer()), xs => {
        expect(OrdSet.fromList(xs).toArray).toEqual(
          xs.foldLeft(OrdSet.empty as OrdSet<number>, (xs, x) => xs.insert(x))
            .toArray,
        );
        expect(isValid(OrdSet.fromList(xs))).toBe(true);
      }),
    );
  });

  test(
    'view.toArray to be toArray',
    forAll(CA.fp4tsOrdSet(fc.integer()), xs =>
      expect(xs.view.toArray).toEqual(xs.toArray),
    ),
  );

  test(
    'iterator.toArray to be toArray',
    forAll(CA.fp4tsOrdSet(fc.integer()), xs =>
      expect(Iter.toArray(xs.iterator)).toEqual(xs.toArray),
    ),
  );

  test(
    'reverseIterator.toArray to be toArray.reverse()',
    forAll(CA.fp4tsOrdSet(fc.integer()), xs =>
      expect(Iter.toArray(xs.reverseIterator)).toEqual(xs.toArray.reverse()),
    ),
  );

  describe('removeMin', () => {
    it('should return empty set when empty', () => {
      expect(OrdSet.empty.removeMin).toEqual(OrdSet.empty);
    });

    it('should return empty set when singleton', () => {
      expect(OrdSet(42).removeMin).toEqual(OrdSet.empty);
    });

    it('should return set without the min value', () => {
      expect(OrdSet(5, 4, 3, 2, 1).removeMin.toArray).toEqual([2, 3, 4, 5]);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), xs => isValid(xs.removeMin)),
    );
  });

  describe('removeMax', () => {
    it('should return empty set when empty', () => {
      expect(OrdSet.empty.removeMax).toEqual(OrdSet.empty);
    });

    it('should return empty set when singleton', () => {
      expect(OrdSet(42).removeMax).toEqual(OrdSet.empty);
    });

    it('should return set without the max value', () => {
      expect(OrdSet(5, 4, 3, 2, 1).removeMax.toArray).toEqual([1, 2, 3, 4]);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), xs => isValid(xs.removeMax)),
    );
  });

  describe('min', () => {
    it('should throw when empty', () => {
      expect(() => OrdSet.empty.min).toThrow();
    });

    it('should return value of the singleton set', () => {
      expect(OrdSet(42).min).toEqual(42);
    });

    it('should return minimum value of the set', () => {
      expect(OrdSet(5, 4, 3, 2, 1).min).toEqual(1);
    });
  });

  describe('minOption', () => {
    it('should return None when empty', () => {
      expect(OrdSet.empty.minOption).toEqual(None);
    });

    it('should return value of the singleton set', () => {
      expect(OrdSet(42).minOption).toEqual(Some(42));
    });

    it('should return minimum value of the set', () => {
      expect(OrdSet(5, 4, 3, 2, 1).minOption).toEqual(Some(1));
    });
  });

  describe('max', () => {
    it('should throw when empty', () => {
      expect(() => OrdSet.empty.max).toThrow();
    });

    it('should return value of the singleton set', () => {
      expect(OrdSet(42).max).toEqual(42);
    });

    it('should return maximum value of the set', () => {
      expect(OrdSet(5, 4, 3, 2, 1).max).toEqual(5);
    });
  });

  describe('maxOption', () => {
    it('should return None when empty', () => {
      expect(OrdSet.empty.maxOption).toEqual(None);
    });

    it('should return value of the singleton set', () => {
      expect(OrdSet(42).maxOption).toEqual(Some(42));
    });

    it('should return maximum value of the set', () => {
      expect(OrdSet(5, 4, 3, 2, 1).maxOption).toEqual(Some(5));
    });
  });

  describe('popMin', () => {
    it('should return None when empty', () => {
      expect(OrdSet.empty.popMin).toEqual(None);
    });

    it('should return value of the singleton set', () => {
      expect(OrdSet(42).popMin).toEqual(Some([42, OrdSet.empty]));
    });

    it('should return minimum value of the set', () => {
      const [x, s] = OrdSet(5, 4, 3, 2, 1).popMin.get;
      expect([x, s.toArray]).toEqual([1, [2, 3, 4, 5]]);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), xs =>
        xs.popMin.fold(
          () => true,
          ([, xs]) => isValid(xs),
        ),
      ),
    );
  });

  describe('popMax', () => {
    it('should return None when empty', () => {
      expect(OrdSet.empty.popMax).toEqual(None);
    });

    it('should return value of the singleton set', () => {
      expect(OrdSet(42).popMax).toEqual(Some([42, OrdSet.empty]));
    });

    it('should remove maximum value from the set', () => {
      const [x, s] = OrdSet(5, 4, 3, 2, 1).popMax.get;
      expect([x, s.toArray]).toEqual([5, [1, 2, 3, 4]]);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), xs =>
        xs.popMax.fold(
          () => true,
          ([, xs]) => isValid(xs),
        ),
      ),
    );
  });

  describe('contains', () => {
    it('should return false when the set is empty', () => {
      expect(OrdSet.empty.contains(42)).toBe(false);
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
        ([x, xs]) => !OrdSet(...xs).contains(x),
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
          return OrdSet(...xs).contains(42);
        },
      ),
    );
  });

  test(
    'lookupLT to be split[0].max',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, k) =>
      xs.lookupLT(k).fold(
        () => expect(() => xs.split(k)[0].max).toThrow(),
        v => expect(xs.split(k)[0].max).toEqual(v),
      ),
    ),
  );

  test(
    'lookupGT to be split[1].min',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, k) =>
      xs.lookupGT(k).fold(
        () => expect(() => xs.split(k)[1].min).toThrow(),
        v => expect(xs.split(k)[1].min).toEqual(v),
      ),
    ),
  );

  test(
    'lookupLE to be splitContains[1] orElse _.max',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, k) =>
      xs.lookupLE(k).fold(
        () => expect(() => xs.splitContains(k)[0].max).toThrow(),
        kv => {
          const [l, m] = xs.splitContains(k);
          return expect(m ? k : l.max).toEqual(kv);
        },
      ),
    ),
  );

  test(
    'lookupGE to be splitContains[1] orElse _.min',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, k) =>
      xs.lookupGE(k).fold(
        () => expect(() => xs.splitContains(k)[2].min).toThrow(),
        kv => {
          const [, m, r] = xs.splitContains(k);
          return expect(m ? k : r.min).toEqual(kv);
        },
      ),
    ),
  );

  test(
    'xs.isSubsetOf(ys) === xs.all(x => ys.contains(x))',
    forAll(
      CA.fp4tsOrdSet(fc.integer()),
      CA.fp4tsOrdSet(fc.integer()),
      (xs, ys) =>
        expect(xs.isSubsetOf(ys)).toEqual(
          OrdSet.Foldable.all_(xs, x => ys.contains(x)),
        ),
    ),
  );

  test(
    'disjoint === x.intersect(y).isEmpty',
    forAll(
      CA.fp4tsOrdSet(fc.integer()),
      CA.fp4tsOrdSet(fc.integer()),
      (xs, ys) => expect(xs.disjoint(ys)).toBe(xs.intersect(ys).isEmpty),
    ),
  );

  test(
    'split',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, k) => {
      const [lt, gt] = xs.split(k);
      expect(lt.toArray.every(kx => kx < k));
      expect(gt.toArray.every(kx => kx > k));
    }),
  );

  test(
    'splitContains',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, k) => {
      const [lt, found, gt] = xs.splitContains(k);
      expect(found).toBe(xs.contains(k));
      expect(lt.toArray.every(kx => kx < k));
      expect(gt.toArray.every(kx => kx > k));
    }),
  );

  describe('insert', () => {
    it('should insert a value to an empty set', () => {
      expect(OrdSet.empty.insert(42)).toEqual(OrdSet(42));
    });

    it('should not duplicate values', () => {
      expect(OrdSet(42).insert(42)).toEqual(OrdSet(42));
    });

    it('should insert a value to an existing set', () => {
      const s = OrdSet(1, 2, 4, 5).insert(3);
      expect(isValid(s));
      expect(s.toArray).toEqual([1, 2, 3, 4, 5]);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, ys) =>
        isValid(xs.insert(ys)),
      ),
    );
  });

  describe('remove', () => {
    it('should not remove anything from an empty set', () => {
      expect(OrdSet.empty.remove(42)).toEqual(OrdSet.empty);
    });

    it('should element from a singleton set', () => {
      expect(OrdSet(42).remove(42)).toEqual(OrdSet.empty);
    });

    it('should remove a value from a set', () => {
      const s = OrdSet(1, 2, 3, 4, 5).remove(3);
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 4, 5]);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, ys) =>
        isValid(xs.remove(ys)),
      ),
    );
  });

  describe('union', () => {
    it('should return an empty set when union of two empty sets', () => {
      expect(OrdSet.empty.union(OrdSet.empty)).toEqual(OrdSet.empty);
    });

    it('should create a union with lhs empty', () => {
      const s = OrdSet(1, 2, 3).union(OrdSet.empty);
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3]);
    });

    it('should create a union with rhs empty', () => {
      const s = OrdSet.empty.union(OrdSet(4, 5, 6));
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([4, 5, 6]);
    });

    it('should create a union of two disjoint sets', () => {
      const s = OrdSet(1, 2, 3).union(OrdSet(4, 5, 6));
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should create a union of two sets sharing elements', () => {
      const s = OrdSet(1, 2, 3, 4, 5).union(OrdSet(2, 3, 4, 5, 6));
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test(
      'merge on self is identity',
      forAll(CA.fp4tsOrdSet(fc.integer()), s => {
        const r = s.union(s);
        return isValid(r) && s.equals(r);
      }),
    );

    it('should be stack safe', () => {
      const xs = [...new Array(50_000).keys()].map((_, i) => i);
      const s1 = OrdSet.fromArray(xs);
      const s2 = OrdSet.fromArray(xs);

      const s = s1.union(s2);
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual(xs);
    });

    it(
      'should remain valid tree',
      forAll(
        CA.fp4tsOrdSet(fc.integer()),
        CA.fp4tsOrdSet(fc.integer()),
        (xs, ys) => isValid(xs.union(ys)),
      ),
    );
  });

  describe('intersect', () => {
    it('should return an empty set when intersect of two empty sets', () => {
      expect(OrdSet.empty.intersect(OrdSet.empty)).toEqual(OrdSet.empty);
    });

    it('should return an empty set when lhs empty', () => {
      expect(OrdSet(1, 2, 3).intersect(OrdSet.empty)).toEqual(OrdSet.empty);
    });

    it('should return an empty set when rhs empty', () => {
      expect(OrdSet.empty.intersect(OrdSet(4, 5, 6))).toEqual(OrdSet.empty);
    });

    it('should return an empty set as intersection of two disjoint sets', () => {
      expect(OrdSet(1, 2, 3).intersect(OrdSet(4, 5, 6))).toEqual(OrdSet.empty);
    });

    it('should return intersection of two sets', () => {
      const s = OrdSet(1, 2, 3, 4, 5).intersect(OrdSet(2, 3, 4, 5, 6));
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([2, 3, 4, 5]);
    });

    test(
      'intersection on self is identity',
      forAll(CA.fp4tsOrdSet(fc.integer()), s => {
        const r = s.intersect(s);
        return isValid(r) && s.equals(r);
      }),
    );

    it('should result in identity when two same sets are intersected', () => {
      const s = OrdSet(1, 2, 3, 4, 5).intersect(OrdSet(1, 2, 3, 4, 5));
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3, 4, 5]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(50_000).keys()].map((_, i) => i);
      const s1 = OrdSet.fromArray(xs);
      const s2 = OrdSet.fromArray(xs);

      const s = s1.intersect(s2);
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual(xs);
    });

    it(
      'should remain valid tree',
      forAll(
        CA.fp4tsOrdSet(fc.integer()),
        CA.fp4tsOrdSet(fc.integer()),
        (xs, ys) => isValid(xs.intersect(ys)),
      ),
    );
  });

  describe('difference', () => {
    it('should diff of empty set is empty set', () => {
      expect(OrdSet.empty['\\'](OrdSet(1, 2, 3))).toEqual(OrdSet.empty);
    });

    it('should return identity when rhs empty', () => {
      expect(OrdSet(1, 2, 3).difference(OrdSet.empty).toArray).toEqual([
        1, 2, 3,
      ]);
    });

    it('should not remove any elements when sets are disjoint', () => {
      const s = OrdSet(1, 2, 3)['\\'](OrdSet(4, 5, 6));
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([1, 2, 3]);
    });

    it('should remove common elements of the set', () => {
      const s = OrdSet(1, 2, 3, 4)['\\'](OrdSet(3, 4, 5, 6));
      expect(isValid(s));
      expect(s.toArray).toEqual([1, 2]);
    });

    it('should return an empty set when difference with itself', () => {
      expect(OrdSet(1, 2, 3)['\\'](OrdSet(1, 2, 3))).toEqual(OrdSet.empty);
    });

    it(
      'should remain valid tree',
      forAll(
        CA.fp4tsOrdSet(fc.integer()),
        CA.fp4tsOrdSet(fc.integer()),
        (xs, ys) => isValid(xs['\\'](ys)),
      ),
    );
  });

  describe('take', () => {
    it('should return empty set when empty', () => {
      expect(OrdSet.empty.take(42)).toEqual(OrdSet.empty);
    });

    it('should return empty set when taken zero elements', () => {
      expect(OrdSet(1, 2, 3).take(0)).toEqual(OrdSet.empty);
    });

    it('should take first single element', () => {
      expect(OrdSet(1, 2, 3).take(1)).toEqual(OrdSet(1));
    });

    it('should take some of the elements', () => {
      expect(OrdSet(1, 2, 3).take(2).toArray).toEqual([1, 2]);
    });

    it('should take all of the elements', () => {
      expect(OrdSet(1, 2, 3).take(42).toArray).toEqual([1, 2, 3]);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (s, n) =>
        isValid(s.take(n)),
      ),
    );
  });

  describe('takeRight', () => {
    it('should return empty set when empty', () => {
      expect(OrdSet.empty.takeRight(42)).toEqual(OrdSet.empty);
    });

    it('should return empty set when taken zero elements', () => {
      expect(OrdSet(1, 2, 3).takeRight(0)).toEqual(OrdSet.empty);
    });

    it('should take first single element', () => {
      expect(OrdSet(1, 2, 3).takeRight(1)).toEqual(OrdSet(3));
    });

    it('should take some of the elements', () => {
      expect(OrdSet(1, 2, 3).takeRight(2).toArray).toEqual([2, 3]);
    });

    it('should take all of the elements', () => {
      expect(OrdSet(1, 2, 3).takeRight(42).toArray).toEqual([1, 2, 3]);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (s, n) =>
        isValid(s.takeRight(n)),
      ),
    );
  });

  describe('drop', () => {
    it('should return empty set when empty', () => {
      expect(OrdSet.empty.drop(42)).toEqual(OrdSet.empty);
    });

    it('should return identity when zero elements dropped', () => {
      expect(OrdSet(1, 2, 3).drop(0)).toEqual(OrdSet(1, 2, 3));
    });

    it('should drop first single element', () => {
      expect(OrdSet(1, 2, 3).drop(1).toArray).toEqual([2, 3]);
    });

    it('should drop some of the elements', () => {
      expect(OrdSet(1, 2, 3).drop(2)).toEqual(OrdSet(3));
    });

    it('should drop all of the elements', () => {
      expect(OrdSet(1, 2, 3).drop(42)).toEqual(OrdSet.empty);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (s, n) =>
        isValid(s.drop(n)),
      ),
    );
  });

  describe('dropRight', () => {
    it('should return empty set when empty', () => {
      expect(OrdSet.empty.dropRight(42)).toEqual(OrdSet.empty);
    });

    it('should return empty set when drop zero elements', () => {
      expect(OrdSet(1, 2, 3).dropRight(0)).toEqual(OrdSet(1, 2, 3));
    });

    it('should drop last element', () => {
      expect(OrdSet(1, 2, 3).dropRight(1).toArray).toEqual([1, 2]);
    });

    it('should take some of the elements', () => {
      expect(OrdSet(1, 2, 3).dropRight(2)).toEqual(OrdSet(1));
    });

    it('should take all of the elements', () => {
      expect(OrdSet(1, 2, 3).dropRight(42)).toEqual(OrdSet.empty);
    });

    it(
      'should remain valid tree',
      forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (s, n) =>
        isValid(s.dropRight(n)),
      ),
    );
  });

  test(
    'take.toList to be toList.take',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, n) =>
      expect(isValid(xs.take(n)) && xs.take(n).toList).toEqual(
        xs.toList.take(n),
      ),
    ),
  );
  test(
    'drop.toList to be toList.drop',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, n) =>
      expect(isValid(xs.drop(n)) && xs.drop(n).toList).toEqual(
        xs.toList.drop(n),
      ),
    ),
  );
  test(
    'takeRight.toList to be toList.takeRight',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, n) =>
      expect(isValid(xs.takeRight(n)) && xs.takeRight(n).toList).toEqual(
        xs.toList.takeRight(n),
      ),
    ),
  );
  test(
    'dropRight.toList to be toList.dropRight',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, n) =>
      expect(isValid(xs.dropRight(n)) && xs.dropRight(n).toList).toEqual(
        xs.toList.dropRight(n),
      ),
    ),
  );

  test(
    'splitAt.toList to be toList.splitAt',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, n) =>
      expect(
        xs.splitAt(n).every(xs => isValid(xs)) &&
          xs.splitAt(n).map(xs => xs.toList),
      ).toEqual(xs.toList.splitAt(n)),
    ),
  );

  test(
    'get.toList to be toList.get',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, n) =>
      n < 0 || n >= xs.size
        ? expect(() => xs.get(n)).toThrow()
        : expect(xs.get(n)).toEqual(xs.toList.get(n)),
    ),
  );

  test(
    'getOption.toList to be toList.getOption',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.getOption(n)).toEqual(xs.toList.getOption(n)),
    ),
  );

  test(
    'elemIndex.toList to be toList.elemIndex',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.elemIndex(x)).toEqual(xs.toList.elemIndex(x)),
    ),
  );

  test(
    'findIndex.toList to be toList.findIndex',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.func(fc.boolean()), (xs, f) =>
      expect(xs.findIndex(f)).toEqual(xs.toList.findIndex(f)),
    ),
  );

  test(
    'removeAt.toList to be toList.removeAt',
    forAll(CA.fp4tsOrdSet(fc.integer()), fc.integer(), (xs, n) =>
      n < 0 || n >= xs.size
        ? expect(() => xs.removeAt(n)).toThrow()
        : expect(isValid(xs.removeAt(n)) && xs.removeAt(n).toList).toEqual(
            xs.toList.removeAt(n),
          ),
    ),
  );

  describe('filter', () => {
    it('should not filter anything when empty', () => {
      expect(OrdSet.empty.filter(() => true)).toEqual(OrdSet.empty);
    });

    it('should filter out all elements', () => {
      expect(OrdSet(1, 2, 3, 4, 5, 6).filter(() => false)).toEqual(
        OrdSet.empty,
      );
    });

    it('should keep all elements', () => {
      const s = OrdSet(1, 2, 3, 4, 5, 6).filter(() => true);
      expect(isValid(s));
      expect(s.toArray).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should filter out even elements', () => {
      const s = OrdSet(1, 2, 3, 4, 5, 6).filter(x => x % 2 !== 0);
      expect(isValid(s));
      expect(s.toArray).toEqual([1, 3, 5]);
    });

    it(
      'should remain valid tree',
      forAll(
        CA.fp4tsOrdSet(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (s, p) => isValid(s.filter(p)),
      ),
    );
  });

  describe('map', () => {
    it('should map over empty set', () => {
      expect(OrdSet.empty.map(x => x * 2)).toEqual(OrdSet.empty);
    });

    it('should double all of the values', () => {
      const s = OrdSet(1, 2, 3, 4, 5, 6).map(x => x * 2);
      expect(isValid(s)).toBe(true);
      expect(s.toArray).toEqual([2, 4, 6, 8, 10, 12]);
    });

    it(
      'should remain a valid tree',
      forAll(
        CA.fp4tsOrdSet(fc.integer()),
        fc.func<[number], string>(fc.string()),
        (s, f) => isValid(s.map(f)),
      ),
    );
  });

  describe('forEach', () => {
    it('should not be called when the set is empty', () => {
      let called = false;
      OrdSet.empty.forEach(() => (called = true));
      expect(called).toBe(false);
    });

    it('should be called with all elements in order', () => {
      const acc = [] as number[];
      OrdSet(1, 2, 3, 4, 5, 6, 7, 8, 9, 10).forEach(x => acc.push(x));
      expect(acc).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe('partition', () => {
    it('should return two empty sets when empty', () => {
      expect(OrdSet.empty.partition(() => false)).toEqual([
        OrdSet.empty,
        OrdSet.empty,
      ]);
    });

    it('should return only right set', () => {
      const [l, r] = OrdSet(1, 2, 3).partition(() => false);
      expect(isValid(l)).toBe(true);
      expect(isValid(r)).toBe(true);
      expect(l.toArray).toEqual([]);
      expect(r.toArray).toEqual([1, 2, 3]);
    });

    it('should return only left set', () => {
      const [l, r] = OrdSet(1, 2, 3).partition(() => true);
      expect(isValid(l)).toBe(true);
      expect(isValid(r)).toBe(true);
      expect(l.toArray).toEqual([1, 2, 3]);
      expect(r.toArray).toEqual([]);
    });

    it('should partition even and odd elements', () => {
      const [l, r] = OrdSet(1, 2, 3, 4, 5, 6).partition(x => x % 2 === 0);
      expect(isValid(l)).toBe(true);
      expect(isValid(r)).toBe(true);
      expect(l.toArray).toEqual([2, 4, 6]);
      expect(r.toArray).toEqual([1, 3, 5]);
    });
  });

  describe('foldLeft', () => {
    it('should return initial value when empty', () => {
      expect(OrdSet.empty.foldLeft(42, () => -1)).toBe(42);
    });

    it('should sum all of the values', () => {
      expect(OrdSet(1, 2, 3, 4, 5).foldLeft(0, (x, y) => x + y)).toBe(15);
    });

    it('should be left associative', () => {
      expect(OrdSet(1, 2, 3).foldLeft('0', (s, x) => `(${s} + ${x})`)).toBe(
        '(((0 + 1) + 2) + 3)',
      );
    });
  });

  describe('foldRight_', () => {
    it('should return initial value when empty', () => {
      expect(OrdSet.empty.foldRight_(42, () => -1)).toBe(42);
    });

    it('should sum all of the values', () => {
      expect(OrdSet(1, 2, 3, 4, 5).foldRight_(0, (x, y) => x + y)).toBe(15);
    });

    it('should be right associative', () => {
      expect(OrdSet(1, 2, 3).foldRight_('0', (s, x) => `(${s} + ${x})`)).toBe(
        '(1 + (2 + (3 + 0)))',
      );
    });
  });

  describe('foldMap', () => {
    it('should return an initial result when empty', () => {
      expect(OrdSet.empty.foldMap(Monoid.addition, id)).toBe(0);
      expect(OrdSet.empty.foldMap(Monoid.product, id)).toBe(1);
    });

    it('should combine values of the set', () => {
      expect(OrdSet(1, 2, 3, 4).foldMap(Monoid.addition, id)).toBe(10);
      expect(OrdSet(1, 2, 3, 4).foldMap(Monoid.product, id)).toBe(24);
    });
  });

  describe('foldMapK', () => {
    it('should return an initial result when empty', () => {
      expect(OrdSet.empty.foldMapK(List.MonoidK, List)).toEqual(List());
    });

    it('should combine values of the set', () => {
      expect(OrdSet(1, 2, 3, 4).foldMapK(List.MonoidK, List)).toEqual(
        List(1, 2, 3, 4),
      );
      expect(
        OrdSet(1, 2, 3, 4).foldMapK(List.MonoidK, x => List(x, x)),
      ).toEqual(List(1, 1, 2, 2, 3, 3, 4, 4));
    });
  });

  describe('should be eqvivalent to Set', () => {
    test('number', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 0, maxLength: 1_000 }),
          xs =>
            expect(OrdSet.fromArray(xs).toArray).toEqual(
              [...new Set(xs)].sort((x, y) => x - y),
            ),
        ),
      );
    });

    test('string', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 1_000 }),
          xs =>
            expect(OrdSet.fromArray(xs).toArray).toEqual(
              [...new Set(xs)].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)),
            ),
        ),
      );
    });

    describe('Tree validity', () => {
      type Action<A> =
        | { type: 'insert'; x: A }
        | { type: 'remove'; x: A }
        | { type: 'alter'; x: A; f: (v: boolean) => boolean }
        | { type: 'intersect'; that: OrdSet<A> }
        | { type: 'union'; that: OrdSet<A> }
        | { type: 'difference'; that: OrdSet<A> };

      const actionArbitrary = <A>(
        arbA: Arbitrary<A>,
        O: Ord<A> = Ord.fromUniversalCompare(),
      ): Arbitrary<Action<A>> =>
        fc.oneof(
          { depthSize: 'small' },
          arbA.map(x => ({ type: 'insert' as const, x })),
          arbA.map(x => ({ type: 'remove' as const, x })),
          fc
            .tuple(arbA, fc.func(fc.boolean()))
            .map(([x, f]) => ({ type: 'alter' as const, x, f })),
          CA.fp4tsOrdSet(arbA, O).map(that => ({
            type: 'intersect' as const,
            that,
          })),
          CA.fp4tsOrdSet(arbA, O).map(that => ({
            type: 'union' as const,
            that,
          })),
          CA.fp4tsOrdSet(arbA, O).map(that => ({
            type: 'difference' as const,
            that,
          })),
        );

      const executeAction =
        <A>(O: Ord<A>) =>
        (s: OrdSet<A>, a: Action<A>): OrdSet<A> => {
          switch (a.type) {
            case 'insert':
              return s.insert(a.x, O);
            case 'remove':
              return s.remove(a.x, O);
            case 'alter':
              return s.alter(a.x, a.f, O);
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
            CA.fp4tsOrdSet(fc.integer()),
            fc.array(actionArbitrary(fc.integer()), { minLength: 100 }),
            (s, as) =>
              expect(
                isValid(
                  as.reduce(executeAction(Ord.fromUniversalCompare()), s),
                ),
              ).toBe(true),
          ),
          { numRuns: 10000 },
        );
      });
    });

    describe('Laws', () => {
      checkAll(
        'CommutativeMonoid<Set<number>>',
        CommutativeMonoidSuite(
          OrdSet.Monoid(Ord.fromUniversalCompare<number>()),
        ).commutativeMonoid(
          CA.fp4tsOrdSet(fc.integer()),
          OrdSet.Eq(Eq.fromUniversalEquals()),
        ),
      );

      checkAll(
        'CommutativeSemigroup<Set.Intersection<number>>',
        CommutativeSemigroupSuite(
          OrdSet.Intersection.Semigroup(Ord.fromUniversalCompare<number>()),
        ).commutativeSemigroup(
          CA.fp4tsOrdSet(fc.integer()),
          OrdSet.Eq(Eq.fromUniversalEquals()),
        ),
      );

      checkAll(
        'Foldable<Set>',
        FoldableSuite(OrdSet.Foldable).foldable(
          fc.integer(),
          fc.integer(),
          CommutativeMonoid.addition,
          CommutativeMonoid.addition,
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          x => CA.fp4tsOrdSet(x),
        ),
      );
    });
  });
});
