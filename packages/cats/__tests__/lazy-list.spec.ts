// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id, tupled } from '@fp4ts/core';
import { Eval } from '@fp4ts/cats-core';
import { CommutativeMonoid, Eq } from '@fp4ts/cats-kernel';
import {
  LazyList,
  List,
  Option,
  Some,
  Vector,
} from '@fp4ts/cats-core/lib/data';
import {
  AlignSuite,
  AlternativeSuite,
  DeferSuite,
  FunctorFilterSuite,
  MonadSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('LazyList', () => {
  describe('type', () => {
    it('should be covariant', () => {
      const xs: LazyList<number> = LazyList.empty;
    });
    it('should disallow expansion of unrelated types', () => {
      const xs: LazyList<number> = LazyList.empty;
      // @ts-expect-error
      xs.prepend('string');
    });
  });

  describe('constructors', () => {
    it('should create an empty list', () => {
      const xs = LazyList();
      expect(xs.isEmpty).toBe(true);
      expect(xs.toArray).toEqual([]);
    });

    it('should create an empty list', () => {
      const xs = LazyList.empty;
      expect(xs.isEmpty).toBe(true);
      expect(xs.toArray).toEqual([]);
    });

    it('should create an empty list', () => {
      const xs = LazyList(1, 2, 3);
      expect(xs.isEmpty).toBe(false);
      expect(xs.toArray).toEqual([1, 2, 3]);
    });

    it('should create a singleton list', () => {
      const xs = LazyList.singleton(42);
      expect(xs.nonEmpty).toBe(true);
      expect(xs.toArray).toEqual([42]);
    });

    it('should create a list from array', () => {
      const xs = LazyList.fromArray([1, 2, 3]);
      expect(xs.toArray).toEqual([1, 2, 3]);
    });

    it('should create a list from a List', () => {
      expect(LazyList.fromList(List(1, 2, 3)).toArray).toEqual([1, 2, 3]);
    });

    it('should create a list from vector', () => {
      expect(LazyList.fromVector(Vector(1, 2, 3)).toArray).toEqual([1, 2, 3]);
    });
  });

  describe('iterator', () => {
    it('should convert the empty list to an empty array', () => {
      expect([...LazyList.empty]).toEqual([]);
    });

    it('should convert a list of three elements to an three element array', () => {
      expect([...LazyList(1, 2, 3)]).toEqual([1, 2, 3]);
    });

    it('should be stack safe', () => {
      expect([...LazyList.fromArray([...new Array(50_000).keys()])]).toEqual([
        ...new Array(50_000).keys(),
      ]);
    });

    it('should not force any values', () => {
      let cnt = 0;
      LazyList(1, 2, 3).map(x => (cnt++, x)).iterator;
      expect(cnt).toBe(0);
    });

    it(
      'should not evaluate more elements than requested',
      forAll(fc.array(fc.integer()), fc.integer({ min: 0 }), (xs, n) => {
        let cnt = 0;
        const it = LazyList.fromArray(xs).map(x => (cnt++, x)).iterator;

        for (let i = 0; i < Math.min(xs.length, n); n++) {
          const nxt = it.next();
          if (nxt.done) break;
        }

        expect(cnt).toBeLessThanOrEqual(n);
      }),
    );

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      let [_0, _1] = xs;
      [_0, _1] = xs;

      expect(cnt).toBe(2);
    });
  });

  describe('head', () => {
    it('should throw when list is empty', () => {
      expect(() => LazyList.empty.head).toThrow();
    });

    it('should return head of the list', () => {
      expect(LazyList(1, 2).head).toBe(1);
    });

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2).map(x => (cnt++, x));

      xs.head;
      xs.head;

      expect(cnt).toBe(1);
    });
  });

  describe('headOption', () => {
    it(
      'should be List.headOption',
      forAll(fc.array(fc.integer()), xs => {
        expect(LazyList.fromArray(xs).headOption).toEqual(
          List.fromArray(xs).headOption,
        );
      }),
    );

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2).map(x => (cnt++, x));

      xs.headOption;
      xs.headOption;

      expect(cnt).toBe(1);
    });
  });

  describe('last', () => {
    it('should throw error on empty list', () => {
      expect(() => LazyList.empty.last).toThrow();
    });

    it('should return Some last when list is not empty', () => {
      expect(LazyList(1, 2).last).toEqual(2);
    });

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.last;
      xs.last;

      expect(cnt).toBe(3);
    });
  });

  describe('lastOption', () => {
    it(
      'should be List.lastOption',
      forAll(fc.array(fc.integer()), xs =>
        expect(LazyList.fromArray(xs).lastOption).toEqual(
          List.fromArray(xs).lastOption,
        ),
      ),
    );

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.last;
      xs.last;

      expect(cnt).toBe(3);
    });

    it('should be stack safe', () => {
      LazyList.range(0, 50_000).lastOption;
    });
  });

  describe('tail', () => {
    it(
      'should be List.tail',
      forAll(fc.array(fc.integer()), xs =>
        expect(LazyList.fromArray(xs).tail.toArray).toEqual(
          List.fromArray(xs).tail.toArray,
        ),
      ),
    );

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.tail;
      xs.tail;

      expect(cnt).toBe(1);
    });

    it('should be stack safe', () => {
      let xs = LazyList.range(0, 50_000);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.tail;
      }
      xs.toArray;
    });
  });

  describe('init', () => {
    it(
      'should be List.init',
      forAll(fc.array(fc.integer()), xs =>
        expect(LazyList.fromArray(xs).init.toArray).toEqual(
          List.fromArray(xs).init.toArray,
        ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      LazyList(1, 2, 3).map(x => (cnt++, x)).init;
      expect(cnt).toBe(0);
    });

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.init.toArray;
      xs.init.toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.init;
      }
      xs.toArray;
    });

    it('should be stack safe', () => {
      LazyList(0, 50_000).init.toArray;
    });
  });

  describe('reverse', () => {
    it(
      'should be List.reverse',
      forAll(fc.array(fc.integer()), xs =>
        expect(LazyList.fromArray(xs).reverse.toArray).toEqual(
          List.fromArray(xs).reverse.toArray,
        ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3).map(x => (cnt++, x)).reverse;

      expect(cnt).toBe(0);
    });

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.reverse.toArray;
      xs.reverse.toArray;
      xs.toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe', () => {
      LazyList.range(0, 50_000).reverse.toArray;
    });

    it('should be stack safe', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.reverse;
      }
      xs.toArray;
    });
  });

  describe('prepend', () => {
    it(
      'should be List.prepend',
      forAll(fc.array(fc.integer()), fc.integer(), (xs, x) =>
        expect(LazyList.fromArray(xs).prepend(x).toArray).toEqual(
          List.fromArray(xs).prepend(x).toArray,
        ),
      ),
    );

    it('should not evaluate the current list', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .prepend(42);

      expect(cnt).toBe(0);
    });

    it('should be stack safe', () => {
      let xs = List(0);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.prepend(i);
      }
      xs.toArray;
    });
  });

  describe('append', () => {
    it(
      'should be List.append',
      forAll(fc.array(fc.integer()), fc.integer(), (xs, x) =>
        expect(LazyList.fromArray(xs).append(x).toArray).toEqual(
          List.fromArray(xs).append(x).toArray,
        ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .append(42);

      expect(cnt).toBe(0);
    });

    it('should be stack safe', () => {
      let xs = List(0);
      for (let i = 0; i < 10_000; i++) {
        xs = xs.append(i);
      }
      xs.toArray;
    });
  });

  describe('concat', () => {
    it(
      'should be List.append',
      forAll(fc.array(fc.integer()), fc.array(fc.integer()), (xs, ys) =>
        expect(
          LazyList.fromArray(xs)['+++'](LazyList.fromArray(ys)).toArray,
        ).toEqual(List.fromArray(xs)['+++'](List.fromArray(ys)).toArray),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .concat(LazyList(3, 4, 5));

      expect(cnt).toBe(0);
    });

    it('should not reevaluate lhs if it is memoized', () => {
      let cnt = 0;

      const lhs = LazyList(1, 2, 3).map(x => (cnt++, x));
      const rhs = LazyList(3, 4, 5);

      const xs = lhs.concat(rhs);

      lhs.toArray;
      xs.toArray;

      expect(cnt).toBe(3);
    });

    it('should not reevaluate rhs if it is memoized', () => {
      let cnt = 0;

      const lhs = LazyList(1, 2, 3);
      const rhs = LazyList(3, 4, 5).map(x => (cnt++, x));

      const xs = lhs.concat(rhs);

      rhs.toArray;
      xs.toArray;

      expect(cnt).toBe(3);
    });

    it.skip('should be stack safe', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.concat(LazyList(0));
      }
      xs.toArray;
    });

    it('should be stack safe', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 10_000; i++) {
        xs = LazyList(0).concat(xs);
      }
      xs.toArray;
    });
  });

  describe('all', () => {
    it(
      'should be List.all',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (xs, f) =>
          expect(LazyList.fromArray(xs).all(f)).toBe(List.fromArray(xs).all(f)),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(false, false)
        .map(x => (cnt++, x))
        .all(id);

      expect(cnt).toBe(1);
    });

    it('should memoize', () => {
      let cnt = 0;

      const xs = LazyList(true, true).map(x => (cnt++, x));

      xs.all(id);
      xs.all(id);
      xs.toArray;

      expect(cnt).toBe(2);
    });

    it('should use memoized value', () => {
      let cnt = 0;

      const xs = LazyList(true, true).map(x => (cnt++, x));

      xs.toArray;
      xs.all(id);

      expect(cnt).toBe(2);
    });

    it('should be stack safe', () => {
      LazyList.range(0, 50_000).all(() => true);
    });
  });

  describe('any', () => {
    it(
      'should be List.any',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (xs, f) =>
          expect(LazyList.fromArray(xs).any(f)).toBe(List.fromArray(xs).any(f)),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(true, true)
        .map(x => (cnt++, x))
        .any(id);

      expect(cnt).toBe(1);
    });

    it('should memoize', () => {
      let cnt = 0;

      const xs = LazyList(false, false).map(x => (cnt++, x));

      xs.any(id);
      xs.any(id);
      xs.toArray;

      expect(cnt).toBe(2);
    });

    it('should use memoized value', () => {
      let cnt = 0;

      const xs = LazyList(false, false).map(x => (cnt++, x));

      xs.toArray;
      xs.any(id);

      expect(cnt).toBe(2);
    });

    it('should be stack safe', () => {
      LazyList.range(0, 50_000).any(() => false);
    });
  });

  describe('count', () => {
    it(
      'should be List.count',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (xs, f) =>
          expect(LazyList.fromArray(xs).count(f)).toBe(
            List.fromArray(xs).count(f),
          ),
      ),
    );

    it('should memoize', () => {
      let cnt = 0;

      const xs = LazyList(true, true).map(x => (cnt++, x));

      xs.count(id);
      xs.count(id);
      xs.toArray;

      expect(cnt).toBe(2);
    });

    it('should use memoized value', () => {
      let cnt = 0;

      const xs = LazyList(true, true).map(x => (cnt++, x));

      xs.toArray;
      xs.count(id);

      expect(cnt).toBe(2);
    });

    it('should be stack safe', () => {
      LazyList.range(0, 50_000).count(() => false);
    });
  });

  describe('take', () => {
    it(
      'should be List.take',
      forAll(fc.array(fc.integer()), fc.integer(), (xs, n) =>
        expect(LazyList.fromArray(xs).take(n).toArray).toEqual(
          List.fromArray(xs).take(n).toArray,
        ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .take(2);

      expect(cnt).toBe(0);
    });

    it('should memoize', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.take(2).toArray;
      xs.toArray;

      expect(cnt).toBe(3);
    });

    it('should use memoized results', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toArray;
      xs.take(2).toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe', () => {
      let xs = LazyList.range(0, 5);
      for (let i = 0; i < 10_000; i++) {
        xs = xs.take(5);
      }
      xs.toArray;
    });
  });

  describe('takeWhile', () => {
    it(
      'should be List.takeWhile',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (xs, p) =>
          expect(LazyList.fromArray(xs).takeWhile(p).toArray).toEqual(
            List.fromArray(xs).takeWhile(p).toArray,
          ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .takeWhile(() => true);

      expect(cnt).toBe(0);
    });

    it('should evaluate at most n + 1 elements where n elements are taken', () => {
      let cnt = 0;

      LazyList(1, 2, 3, 4, 5)
        .map(x => (cnt++, x))
        .takeWhile(x => x < 3).toArray;

      expect(cnt).toBe(3);
    });

    it('should memoize', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3, 4, 5)
        .map(x => (cnt++, x))
        .takeWhile(x => x < 3);

      xs.toArray;
      xs.toArray;

      expect(cnt).toBe(3);
    });

    it('should use memoized results', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3, 4, 5).map(x => (cnt++, x));

      xs.toArray;
      xs.toArray;

      xs.takeWhile(() => true).toArray;

      expect(cnt).toBe(5);
    });

    it('should be stack safe for large lists', () => {
      LazyList.range(0, 50_000).takeWhile(() => true).toArray;
    });

    it('should be stack safe under composition', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.takeWhile(() => true);
      }
      xs.toArray;
    });
  });

  describe('drop', () => {
    it(
      'should be List.drop',
      forAll(fc.array(fc.integer()), fc.integer(), (xs, n) =>
        expect(LazyList.fromArray(xs).drop(n).toArray).toEqual(
          List.fromArray(xs).drop(n).toArray,
        ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .drop(2);

      expect(cnt).toBe(0);
    });

    it('should memoize', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.drop(2).toArray;
      xs.toArray;

      expect(cnt).toBe(3);
    });

    it('should use memoized results', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toArray;
      xs.drop(2).toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 10_000; i++) {
        xs = xs.drop(1);
      }
      xs.toArray;
    });
  });

  describe('dropWhile', () => {
    it(
      'should be List.dropWhile',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (xs, p) =>
          expect(LazyList.fromArray(xs).dropWhile(p).toArray).toEqual(
            List.fromArray(xs).dropWhile(p).toArray,
          ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .dropWhile(() => true);

      expect(cnt).toBe(0);
    });

    it('should memoize', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .dropWhile(x => true);

      xs.toArray;
      xs.toArray;

      expect(cnt).toBe(3);
    });

    it('should use memoized results', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toArray;
      xs.toArray;

      xs.dropWhile(() => true).toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe for large lists', () => {
      LazyList.range(0, 50_000).dropWhile(() => true).toArray;
    });

    it('should be stack safe under composition', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.dropWhile(() => false);
      }
      xs.toArray;
    });
  });

  describe('slice', () => {
    it(
      'should be List.slice',
      forAll(fc.array(fc.integer()), fc.integer(), fc.integer(), (xs, m, n) =>
        expect(LazyList.fromArray(xs).slice(m, n).toArray).toEqual(
          List.fromArray(xs).slice(m, n).toArray,
        ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .slice(0, 2);

      expect(cnt).toBe(0);
    });

    it('should memoize', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.slice(0, 2).toArray;
      xs.toArray;

      expect(cnt).toBe(3);
    });

    it('should use memoized results', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toArray;
      xs.slice(0, 2).toArray;

      expect(cnt).toBe(3);
    });
  });

  describe('splitAt', () => {
    it(
      'should be List.splitAt',
      forAll(fc.array(fc.integer()), fc.integer(), (xs, n) =>
        expect(
          LazyList.fromArray(xs)
            .splitAt(n)
            .map(ys => ys.toArray),
        ).toEqual(
          List.fromArray(xs)
            .splitAt(n)
            .map(ys => ys.toArray),
        ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;
      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .splitAt(2);
      expect(cnt).toBe(0);
    });

    it('should memoize return lhs', () => {
      let cnt = 0;

      const [l, r] = LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .splitAt(2);

      l.toArray;
      l.toArray;

      expect(cnt).toBe(2);
    });

    it('should memoize return rhs', () => {
      let cnt = 0;

      const [l, r] = LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .splitAt(2);

      r.toArray;
      r.toArray;

      expect(cnt).toBe(3);
    });

    it('should use memoized values', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));
      xs.toArray;
      const [l, r] = xs.splitAt(2);

      r.toArray;
      r.toArray;

      expect(cnt).toBe(3);
    });
  });

  describe('filter', () => {
    it(
      'should be List.filter',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], boolean>(fc.boolean()),
        (xs, f) =>
          expect(LazyList.fromArray(xs).filter(f).toArray).toEqual(
            List.fromArray(xs).filter(f).toArray,
          ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .filter(() => true);
    });

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.filter(() => true).toArray;
      xs.filter(() => true).toArray;

      expect(cnt).toBe(3);
    });

    it('should use memoized results', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).filter(() => (cnt++, true));
      const ys = xs.filter(() => true);

      xs.toArray;
      ys.toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 10_000; i++) {
        xs = xs.filter(() => true);
      }
      xs.toArray;
    });

    it('should be stack safe', () => {
      let xs = LazyList.range(0, 1000);
      for (let i = 0; i < 1000; i++) {
        xs = xs.filter(() => true);
      }
      xs.filter(() => false).toArray;
    });
  });

  describe('collect', () => {
    it(
      'should be List.collect',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], Option<number>>(A.fp4tsOption(fc.integer())),
        (xs, f) =>
          expect(LazyList.fromArray(xs).collect(f).toArray).toEqual(
            List.fromArray(xs).collect(f).toArray,
          ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .collect(Some);
    });

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.collect(Some).toArray;
      xs.collect(Some).toArray;

      expect(cnt).toBe(3);
    });

    it('should use memoized results', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).collect(x => (cnt++, Some(x)));
      const ys = xs.collect(Some);

      xs.toArray;
      ys.toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 10_000; i++) {
        xs = xs.collect(Some);
      }
      xs.toArray;
    });
  });

  describe('map', () => {
    it(
      'should be List.map',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], number>(fc.integer()),
        (xs, f) =>
          expect(LazyList.fromArray(xs).map(f).toArray).toEqual(
            List.fromArray(xs).map(f).toArray,
          ),
      ),
    );

    it('should memoize results', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.map(id).toArray;
      xs.map(id).toArray;

      expect(cnt).toBe(3);
    });

    it('should use memoized results', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toArray;
      xs.map(id).toArray;
      xs.map(id).toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe', () => {
      let xs = LazyList(1, 2);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.map(x => x);
      }
      xs.toArray;
    });
  });

  describe('flatMap', () => {
    it(
      'should be List.flatMap',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], number[]>(fc.array(fc.integer())),
        (xs, f) =>
          expect(
            LazyList.fromArray(xs).flatMap(x => LazyList.fromArray(f(x)))
              .toArray,
          ).toEqual(
            List.fromArray(xs).flatMap(x => List.fromArray(f(x))).toArray,
          ),
      ),
    );

    it('should be lazy', () => {
      let cnt = 0;

      LazyList(1, 2, 3)
        .map(x => (cnt++, x))
        .flatMap(LazyList.singleton);
    });

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).flatMap(x => (cnt++, LazyList.singleton(x)));

      xs.flatMap(LazyList.singleton).toArray;
      xs.flatMap(LazyList.singleton).toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe', () => {
      const size = 50_000;
      const go = (i: number): LazyList<number> =>
        i >= size
          ? LazyList.singleton(i)
          : LazyList.singleton(i + 1).flatMap(go);

      expect(go(0).toArray).toEqual([size]);
    });

    it('should be stack safe', () => {
      LazyList.range(0, 50_000).flatMap(LazyList.singleton).toArray;
    });
  });

  describe('zip', () => {
    it(
      'should be List.zip',
      forAll(fc.array(fc.integer()), fc.array(fc.integer()), (xs, ys) =>
        expect(
          LazyList.fromArray(xs).zip(LazyList.fromArray(ys)).toArray,
        ).toEqual(List.fromArray(xs).zip(List.fromArray(ys)).toArray),
      ),
    );

    it('should be stack safe', () => {
      const xs = LazyList.range(0);
      const ys = LazyList.range(0);
      xs.zip(ys).take(50_000).toArray;
    });

    it('should be stack safe', () => {
      let xs: LazyList<any> = LazyList(0);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.zip(xs);
      }
      xs.toArray;
    });
    it('should be stack safe', () => {
      let xs: LazyList<any> = LazyList(0);
      for (let i = 0; i < 5_000; i++) {
        xs = LazyList(0).concat(xs);
      }
      xs.zip(xs).toArray;
    });
  });

  describe('zipWith', () => {
    it(
      'should be List.zipWith',
      forAll(
        fc.array(fc.integer()),
        fc.array(fc.integer()),
        fc.func<[number, number], number>(fc.integer()),
        (xs, ys, f) =>
          expect(
            LazyList.fromArray(xs).zipWith(LazyList.fromArray(ys), f).toArray,
          ).toEqual(List.fromArray(xs).zipWith(List.fromArray(ys), f).toArray),
      ),
    );

    it('should not evaluate more than one element more than are on rhs', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3, 4)
        .map(x => (cnt++, x))
        .zipWith(LazyList(1, 2), tupled);

      expect(xs.toArray).toEqual([
        [1, 1],
        [2, 2],
      ]);
      expect(cnt).toBe(3);
    });

    it('should not evaluate more elements than are on lhs', () => {
      let cnt = 0;

      const xs = LazyList(1, 2).zipWith(
        LazyList(1, 2, 3).map(x => (cnt++, x)),
        tupled,
      );

      expect(xs.toArray).toEqual([
        [1, 1],
        [2, 2],
      ]);
      expect(cnt).toBe(2);
    });

    it('should not evaluate any rhs elements on empty', () => {
      let cnt = 0;

      const xs = LazyList().zipWith(
        LazyList(1, 2, 3).map(x => (cnt++, x)),
        tupled,
      );

      expect(xs.toArray).toEqual([]);
      expect(cnt).toBe(0);
    });
  });

  describe('zipWithIndex', () => {
    it(
      'should be List.zipWithIndex',
      forAll(fc.array(fc.integer()), xs =>
        expect(LazyList.fromArray(xs).zipWithIndex.toArray).toEqual(
          List.fromArray(xs).zipWithIndex.toArray,
        ),
      ),
    );

    it('should be stack safe on large lists', () => {
      LazyList.range(0).zip(LazyList.range(0)).take(50_000).toArray;
    });
  });

  describe('zipWithIndex', () => {
    it(
      'should be List.zipWithIndex',
      forAll(fc.array(fc.integer()), xs =>
        expect(LazyList.fromArray(xs).zipWithIndex.toArray).toEqual(
          List.fromArray(xs).zipWithIndex.toArray,
        ),
      ),
    );
  });

  describe('zipAllWith', () => {
    it(
      'should be List.zipAllWith',
      forAll(
        fc.array(fc.integer()),
        fc.array(fc.integer()),
        fc.func<[number, number], number>(fc.integer()),
        (xs, ys, f) =>
          expect(
            LazyList.fromArray(xs).zipAllWith(
              LazyList.fromArray(ys),
              () => 0,
              () => 0,
              f,
            ).toArray,
          ).toEqual(
            List.fromArray(xs).zipAllWith(
              List.fromArray(ys),
              () => 0,
              () => 0,
              f,
            ).toArray,
          ),
      ),
    );

    it('should be stack safe on large lists', () => {
      LazyList.range(0)
        .zipAllWith(
          LazyList.range(0),
          () => -1,
          () => -1,
          (a, b) => Math.max(a, b),
        )
        .take(50_000).toArray;
    });
  });

  describe('foldMap', () => {
    it(
      'should be List.foldMap',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number], number>(fc.integer()),
        (xs, f) =>
          expect(
            LazyList.fromArray(xs).foldMap(CommutativeMonoid.addition)(f),
          ).toBe(List.fromArray(xs).foldMap(CommutativeMonoid.addition)(f)),
      ),
    );

    it('should be lazy in application of f', () => {
      let cnt = 0;
      LazyList(true, true).foldMap(CommutativeMonoid.disjunction)(
        x => (cnt++, x),
      );
      expect(cnt).toBe(1);
    });

    it('should be stack safe on large list', () => {
      LazyList.range(0, 50_000).foldMap(CommutativeMonoid.addition)(id);
    });

    it('should be stack safe under composition', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.map(id);
      }
      xs.foldMap(CommutativeMonoid.addition)(id);
    });
  });

  describe('foldLeft', () => {
    it(
      'should be List.foldLeft',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number, number], number>(fc.integer()),
        (xs, f) =>
          expect(LazyList.fromArray(xs).foldLeft(0, f)).toBe(
            List.fromArray(xs).foldLeft(0, f),
          ),
      ),
    );

    it('should be stack safe on large list', () => {
      LazyList.range(0, 50_000).foldLeft(0, (a, b) => a + b);
    });
  });

  describe('foldRight', () => {
    it(
      'should be List.foldRight',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number, Eval<number>], Eval<number>>(
          A.fp4tsEval(fc.integer()),
        ),
        (xs, f) =>
          expect(LazyList.fromArray(xs).foldRight(Eval.now(0), f).value).toBe(
            List.fromArray(xs).foldRight(Eval.now(0), f).value,
          ),
      ),
    );

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.foldRight(Eval.now(0), (_, eb) => eb).value;
      xs.foldRight(Eval.now(0), (_, eb) => eb).value;

      expect(cnt).toBe(3);
    });

    it('should use memoized values', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toArray;
      xs.foldRight(Eval.now(0), (_, eb) => eb).value;
      xs.foldRight(Eval.now(0), (_, eb) => eb).value;

      expect(cnt).toBe(3);
    });

    it('should be stack safe on large list', () => {
      LazyList.range(0, 50_000).foldRight(Eval.now(0), (a, eb) =>
        eb.map(b => a + b),
      ).value;
    });

    it('should be stack safe under composition', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 50_000; i++) {
        xs = xs.map(id);
      }
      xs.foldRight(Eval.now(0), (a, eb) => eb.map(b => a + b)).value;
    });
  });

  describe('scanLeft', () => {
    it(
      'should be List.scanLeft',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number, number], number>(fc.integer()),
        (xs, f) =>
          expect(LazyList.fromArray(xs).scanLeft(0, f).toArray).toEqual(
            List.fromArray(xs).scanLeft(0, f).toArray,
          ),
      ),
    );

    it('should be stack safe', () => {
      LazyList.range(0, 50_000).scanLeft(0, (x, y) => x + y).toArray;
    });

    it('should be stack safe', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 1000; i++) {
        xs = xs.scanLeft(0, (x, y) => x + y);
      }
      xs.toArray;
    });
  });

  describe('scanRight', () => {
    it(
      'should be List.scanRight',
      forAll(
        fc.array(fc.integer()),
        fc.func<[number, number], number>(fc.integer()),
        (xs, f) =>
          expect(
            LazyList.fromArray(xs).scanRight(Eval.now(0), (x, eb) =>
              eb.map(y => f(x, y)),
            ).toArray,
          ).toEqual(List.fromArray(xs).scanRight(0, f).toArray),
      ),
    );

    it('should be stack safe on large list', () => {
      LazyList.range(0, 50_000).scanRight(Eval.now(0), (x, y) =>
        y.map(y => x + y),
      ).toArray;
    });

    it('should be stack safe under composition', () => {
      let xs = LazyList(0);
      for (let i = 0; i < 1000; i++) {
        xs = xs.scanRight(Eval.now(0), (x, y) => y.map(y => x + y));
      }
      xs.toArray;
    });
  });

  describe('distinct', () => {
    it('should return empty list when empty', () => {
      expect(LazyList<number>().distinct().toArray).toEqual([]);
    });

    it('should reduce repeating list into a singleton', () => {
      expect(LazyList(1, 1, 1, 1).distinct().toArray).toEqual([1]);
    });

    it('should remove duplicates', () => {
      expect(
        LazyList(1, 1, 2, 1, 3, 4, 1, 3, 5, 7, 8, 3, 6).distinct().toArray,
      ).toEqual([1, 2, 3, 4, 5, 7, 8, 6]);
    });

    it('should work with infinite list', () => {
      const xs: LazyList<number> = LazyList(1)['+++'](LazyList.defer(() => xs));
      expect(xs.distinct().head).toBe(1);
    });

    it('should be lazy in evaluation', () => {
      let cnt = 0;

      const xs = LazyList(1, 2, 3, 3, 3)
        .map(x => (cnt++, x))
        .distinct()
        .take(3);

      expect(xs.toArray).toEqual([1, 2, 3]);
      expect(cnt).toBe(3);
    });

    it('should memoize', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toArray;
      xs.distinct().toArray;

      expect(cnt).toBe(3);
    });

    it('should be stack safe on list of duplicates', () => {
      LazyList.iterate(0, () => 0)
        .take(50_000)
        .concat(LazyList(1))
        .distinct()
        .take(2).toArray;
    });

    it('should be stack safe on unique list', () => {
      LazyList.range(0).distinct().take(50_000);
    });
  });

  describe('memoization', () => {
    it('memoizes isEmpty', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.isEmpty;
      xs.isEmpty;

      expect(cnt).toBe(1);
    });

    it('memoizes nonEmpty', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.nonEmpty;
      xs.nonEmpty;

      expect(cnt).toBe(1);
    });

    it('memoizes toArray', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toArray;
      xs.toArray;

      expect(cnt).toBe(3);
    });

    it('memoizes toList', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toList;
      xs.toList;

      expect(cnt).toBe(3);
    });

    it('memoizes toVector', () => {
      let cnt = 0;
      const xs = LazyList(1, 2, 3).map(x => (cnt++, x));

      xs.toVector;
      xs.toVector;

      expect(cnt).toBe(3);
    });

    it('should memoize intermediate results fibonacci', () => {
      let cnt = 0;
      const fibs: LazyList<number> = LazyList(0, 1)
        ['+++'](LazyList.defer(() => fibs.zipWith(fibs.tail, (x, y) => x + y)))
        .map(x => (cnt++, x));

      fibs.drop(999).head;

      expect(cnt).toBe(1000);
    });
  });

  describe('Laws', () => {
    checkAll(
      'Defer<LazyList>',
      DeferSuite(LazyList.Defer).defer(
        fc.integer(),
        Eq.fromUniversalEquals(),
        A.fp4tsLazyList,
        LazyList.EqK.liftEq,
      ),
    );

    checkAll(
      'Align<LazyList>',
      AlignSuite(LazyList.Align).align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsLazyList,
        LazyList.EqK.liftEq,
      ),
    );

    checkAll(
      'Alternative<LazyList>',
      AlternativeSuite(LazyList.Alternative).alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsLazyList,
        LazyList.EqK.liftEq,
      ),
    );

    checkAll(
      'FunctorFilter<LazyList>',
      FunctorFilterSuite(LazyList.FunctorFilter).functorFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsLazyList,
        LazyList.EqK.liftEq,
      ),
    );

    checkAll(
      'Monad<LazyList>',
      MonadSuite(LazyList.Monad).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsLazyList,
        LazyList.EqK.liftEq,
      ),
    );

    checkAll(
      'Traversable<LazyList>',
      TraversableSuite(LazyList.Traversable).traversable(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        LazyList.Functor,
        Eval.Applicative,
        Eval.Applicative,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsLazyList,
        LazyList.EqK.liftEq,
        A.fp4tsEval,
        Eval.Eq,
        A.fp4tsEval,
        Eval.Eq,
      ),
    );
  });
});
