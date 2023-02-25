// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, id, tupled } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import {
  Const,
  Identity,
  List,
  None,
  Option,
  Some,
  View,
} from '@fp4ts/cats-core/lib/data';
import {
  MonadPlusSuite,
  TraversableFilterSuite,
  UnzipSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Views', () => {
  describe('construction', () => {
    it(
      'fromArray toArray identity',
      forAll(fc.array(fc.integer()), xs =>
        expect(View.fromArray(xs).toArray).toEqual(xs),
      ),
    );

    it(
      'fromList toList identity',
      forAll(A.fp4tsList(fc.integer()), xs =>
        expect(xs.view.toList).toEqual(xs),
      ),
    );

    it(
      'fromLazyList toLazyList identity',
      forAll(A.fp4tsLazyList(fc.integer()), xs =>
        expect(xs.view.toLazyList.toArray).toEqual(xs.toArray),
      ),
    );

    it(
      'fromVector toVector identity',
      forAll(A.fp4tsVector(fc.integer()), xs =>
        expect(xs.view.toVector.toArray).toEqual(xs.toArray),
      ),
    );
  });

  describe('head', () => {
    it('should throw on empty collection', () => {
      expect(() => View.empty.head).toThrow();
    });

    it('should return the first element', () => {
      expect(View(1, 2, 3).head).toBe(1);
    });

    it('should return the first element of composed collection', () => {
      expect(View(1, 2, 3).filter(x => x % 2 === 0).head).toBe(2);
    });
  });

  test(
    'headOption to be List.headOption',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.headOption).toEqual(xs.toList.headOption),
    ),
  );

  test(
    'tail to be List.tail',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.tail.toList).toEqual(xs.toList.tail),
    ),
  );

  test(
    'last to be List.last',
    forAll(A.fp4tsView(fc.integer()), xs =>
      xs.isEmpty
        ? expect(() => xs.last).toThrow()
        : expect(xs.last).toBe(xs.toList.last),
    ),
  );

  test(
    'lastOption to be List.lastOption',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.lastOption).toEqual(xs.toList.lastOption),
    ),
  );

  test(
    'isEmpty is List.isEmpty',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.isEmpty).toBe(xs.toList.isEmpty),
    ),
  );

  test(
    'nonEmpty = !isEmpty',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.nonEmpty).toBe(!xs.isEmpty),
    ),
  );

  test(
    'size is List size',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.size).toBe(xs.toList.size),
    ),
  );

  test(
    'toOption is headOption',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.toOption).toEqual(xs.headOption),
    ),
  );

  test(
    'toRight === toOption.toRight',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.string()), (xs, left) =>
      expect(xs.toRight(left)).toEqual(xs.toOption.toRight(left)),
    ),
  );

  test(
    'toLeft === toOption.toLeft',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.string()), (xs, right) =>
      expect(xs.toLeft(right)).toEqual(xs.toOption.toLeft(right)),
    ),
  );

  test(
    'iterator is List.iterator',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect([...xs]).toEqual([...xs.toList]),
    ),
  );

  test(
    'prepend to be List.prepend',
    forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.prepend(x).toList).toEqual(xs.toList.prepend(x)),
    ),
  );

  test(
    'prepend to be List.append',
    forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.append(x).toList).toEqual(xs.toList.append(x)),
    ),
  );

  describe('all', () => {
    it('should short circuit', () => {
      expect(View.repeat(1).all(() => false)).toBe(false);
    });

    it(
      'should be List.all',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.all(p)).toBe(xs.toList.all(p)),
      ),
    );
  });

  describe('any', () => {
    it('should short circuit', () => {
      expect(View.repeat(1).any(() => true)).toBe(true);
    });

    it(
      'should be List.any',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.any(p)).toBe(xs.toList.any(p)),
      ),
    );
  });

  test(
    'count to be List.count',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
      expect(xs.count(p)).toBe(xs.toList.count(p)),
    ),
  );

  test(
    'max to be List.max',
    forAll(A.fp4tsView(fc.integer()), xs =>
      xs.isEmpty
        ? expect(() => xs.max()).toThrow()
        : expect(xs.max()).toBe(xs.toList.max()),
    ),
  );

  test(
    'maxOption to be List.maxOption',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.maxOption()).toEqual(xs.toList.maxOption()),
    ),
  );

  test(
    'max to be List.max',
    forAll(A.fp4tsView(fc.integer()), xs =>
      xs.isEmpty
        ? expect(() => xs.max()).toThrow()
        : expect(xs.max()).toBe(xs.toList.max()),
    ),
  );

  test(
    'minOption to be List.minOption',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.minOption()).toEqual(xs.toList.minOption()),
    ),
  );

  test(
    'sum to be List.sum',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.sum()).toBe(xs.toList.sum()),
    ),
  );

  test(
    'take to be List.take',
    forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.take(n).toList).toEqual(xs.toList.take(n)),
    ),
  );

  test(
    'drop to be List.drop',
    forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, n) =>
      expect(xs.drop(n).toList).toEqual(xs.toList.drop(n)),
    ),
  );

  test(
    'slice to be List.slice',
    forAll(A.fp4tsView(fc.integer()), fc.integer(), fc.integer(), (xs, f, t) =>
      expect(xs.slice(f, t).toList).toEqual(xs.toList.slice(f, t)),
    ),
  );

  describe('splitAt', () => {
    it(
      'should be [xs.take(n), xs.drop(n)',
      forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, n) =>
        expect(xs.splitAt(n).map(ys => ys.toArray)).toEqual([
          xs.take(n).toArray,
          xs.drop(n).toArray,
        ]),
      ),
    );

    it(
      'should be List.splitAt',
      forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, n) =>
        expect(xs.splitAt(n).map(ys => ys.toList)).toEqual(
          xs.toList.splitAt(n),
        ),
      ),
    );
  });

  test(
    'takeWhile to be List.takeWhile',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
      expect(xs.takeWhile(p).toList).toEqual(xs.toList.takeWhile(p)),
    ),
  );

  test(
    'dropWhile to be List.dropWhile',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
      expect(xs.dropWhile(p).toList).toEqual(xs.toList.dropWhile(p)),
    ),
  );

  describe('span', () => {
    it(
      'should be [xs.takeWhile(p), xs.dropWhile(p)]',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.span(p).map(ys => ys.toArray)).toEqual([
          xs.takeWhile(p).toArray,
          xs.dropWhile(p).toArray,
        ]),
      ),
    );

    it(
      'should be List.span',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.span(p).map(ys => ys.toList)).toEqual(xs.toList.span(p)),
      ),
    );
  });

  test(
    'inits to be List.inits',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.inits().map(ys => ys.toList).toArray).toEqual(
        xs.toList.inits().toArray,
      ),
    ),
  );

  test(
    'tails to be List.tails',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.tails().map(ys => ys.toList).toArray).toEqual(
        xs.toList.tails().toArray,
      ),
    ),
  );

  describe('elem', () => {
    it('should short circuit', () => {
      expect(View.range(1).elem(42)).toBe(true);
    });

    it(
      'should be List.elem',
      forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, x) =>
        expect(xs.elem(x)).toBe(xs.toList.elem(x)),
      ),
    );
  });

  describe('notElem', () => {
    it('should short circuit', () => {
      expect(View.range(1).notElem(42)).toBe(false);
    });

    it(
      '== !elem',
      forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, x) =>
        expect(xs.notElem(x)).toBe(!xs.elem(x)),
      ),
    );
  });

  describe('lookup', () => {
    it('should short-circuit', () => {
      expect(
        View('a', 'b', 'c').cycle().zip(View.range(1)).lookup('c'),
      ).toEqual(Some(3));
    });

    it(
      'should be List.lookup',
      forAll(
        A.fp4tsView(fc.tuple(fc.string(), fc.integer())),
        fc.string(),
        (xs, k) => expect(xs.lookup(k)).toEqual(xs.toList.lookup(k)),
      ),
    );
  });

  describe('find', () => {
    it('should short circuit', () => {
      expect(View.range(1).find(x => x === 42)).toEqual(Some(42));
    });

    it(
      'should be .filter(p).headOption',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.find(p)).toEqual(xs.filter(p).headOption),
      ),
    );

    it(
      'should be List.find',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.find(p)).toEqual(xs.toList.find(p)),
      ),
    );
  });

  test(
    'filter to be List.filter',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
      expect(xs.filter(p).toList).toEqual(xs.toList.filter(p)),
    ),
  );

  describe('filterNot', () => {
    test(
      'filterNot(p) to be filter(x => !p(x))',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.filterNot(p).toArray).toEqual(xs.filter(x => !p(x)).toArray),
      ),
    );

    it(
      'should be List.filterNot',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.filterNot(p).toList).toEqual(xs.toList.filterNot(p)),
      ),
    );
  });

  describe('collect', () => {
    it(
      'should be .map(f).filter(o => o.nonEmpty).map(o => o.get)',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func(A.fp4tsOption(fc.string())),
        (xs, p) =>
          expect(xs.collect(p).toArray).toEqual(
            xs
              .map(p)
              .filter(o => o.nonEmpty)
              .map(o => o.get).toArray,
          ),
      ),
    );

    it(
      'should be List.collect',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func(A.fp4tsOption(fc.string())),
        (xs, p) => expect(xs.collect(p).toList).toEqual(xs.toList.collect(p)),
      ),
    );
  });

  describe('collectWhile', () => {
    it(
      'should be .map(f).takeWhile(o => o.nonEmpty).map(o => o.get)',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func(A.fp4tsOption(fc.string())),
        (xs, p) =>
          expect(xs.collectWhile(p).toArray).toEqual(
            xs
              .map(p)
              .takeWhile(o => o.nonEmpty)
              .map(o => o.get).toArray,
          ),
      ),
    );

    it(
      'should be List.collectWhile',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func(A.fp4tsOption(fc.string())),
        (xs, p) =>
          expect(xs.collectWhile(p).toList).toEqual(xs.toList.collectWhile(p)),
      ),
    );
  });

  describe('partition', () => {
    it(
      'should be [xs.filter(p), xs.filterNot(p)',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.partition(p).map(xs => xs.toArray)).toEqual([
          xs.filter(p).toArray,
          xs.filterNot(p).toArray,
        ]),
      ),
    );

    it(
      'should be List.partition',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.partition(p).map(xs => xs.toList)).toEqual(
          xs.toList.partition(p),
        ),
      ),
    );
  });

  describe('get', () => {
    it(
      'should throw for idx < 0',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.integer().filter(i => i < 0),
        (xs, i) => expect(() => xs.get(i)).toThrow(),
      ),
    );

    it(
      'should throw for idx >= xs.size',
      forAll(
        fc
          .tuple(A.fp4tsView(fc.integer()), fc.integer())
          .filter(([xs, i]) => i >= xs.size),
        ([xs, i]) => expect(() => xs.get(i)).toThrow(),
      ),
    );

    it('should short circuit', () => {
      expect(View.range(0).get(42)).toBe(42);
    });

    it(
      'should be List.get for 0 <= i <= xs.size',
      forAll(
        fc
          .tuple(A.fp4tsView(fc.integer()), fc.integer())
          .filter(([xs, i]) => 0 <= i && i < xs.size),
        ([xs, i]) => expect(xs.get(i)).toBe(xs.toList.get(i)),
      ),
    );
  });

  describe('getOption', () => {
    it('should short circuit', () => {
      expect(View.range(0).get(42)).toEqual(42);
    });

    it(
      'should be List.getOption',
      forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, i) =>
        expect(xs.getOption(i)).toEqual(xs.toList.getOption(i)),
      ),
    );
  });

  test(
    'replaceAt to be List.replaceAt',
    forAll(A.fp4tsView(fc.integer()), fc.integer(), fc.integer(), (xs, i, x) =>
      i < 0 || xs.size <= i
        ? expect(() => xs.replaceAt(i, x).toArray).toThrow()
        : expect(xs.replaceAt(i, x).toList).toEqual(xs.toList.replaceAt(i, x)),
    ),
  );

  test(
    'modifyAt to be List.modifyAt',
    forAll(
      A.fp4tsView(fc.integer()),
      fc.integer(),
      fc.func(fc.integer()),
      (xs, i, f) =>
        i < 0 || xs.size <= i
          ? expect(() => xs.modifyAt(i, f).toArray).toThrow()
          : expect(xs.modifyAt(i, f).toList).toEqual(xs.toList.modifyAt(i, f)),
    ),
  );

  test(
    'insertAt to be List.insertAt',
    forAll(A.fp4tsView(fc.integer()), fc.integer(), fc.integer(), (xs, i, x) =>
      i < 0 || xs.size < i
        ? expect(() => xs.insertAt(i, x).toArray).toThrow()
        : expect(xs.insertAt(i, x).toList).toEqual(xs.toList.insertAt(i, x)),
    ),
  );

  test(
    'removeAt to be List.removeAt',
    forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, i) =>
      i < 0 || xs.size <= i
        ? expect(() => xs.removeAt(i).toArray).toThrow()
        : expect(xs.removeAt(i).toArray).toEqual(xs.toList.removeAt(i).toArray),
    ),
  );

  describe('elemIndex', () => {
    it('should short-circuit', () => {
      expect(View.range(1).elemIndex(42)).toEqual(Some(41));
    });

    it(
      'should be List.elemIndex',
      forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, x) =>
        expect(xs.elemIndex(x)).toEqual(xs.toList.elemIndex(x)),
      ),
    );
  });

  test(
    'elemIndices to be List.elemIndices',
    forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, x) =>
      expect(xs.elemIndices(x).toList).toEqual(xs.toList.elemIndices(x)),
    ),
  );

  describe('findIndex', () => {
    it('should short-circuit', () => {
      expect(View.range(1).findIndex(x => x === 42)).toEqual(Some(41));
    });

    it(
      'should be List.findIndex',
      forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
        expect(xs.findIndex(p)).toEqual(xs.toList.findIndex(p)),
      ),
    );
  });

  test(
    'findIndices be List.findIndices',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.boolean()), (xs, p) =>
      expect(xs.findIndices(p).toList).toEqual(xs.toList.findIndices(p)),
    ),
  );

  test(
    'reverse should be List.reverse',
    forAll(A.fp4tsView(fc.integer()), xs =>
      expect(xs.reverse.toList).toEqual(xs.toList.reverse),
    ),
  );

  test(
    'concat to be List.concat',
    forAll(A.fp4tsView(fc.integer()), A.fp4tsView(fc.integer()), (xs, ys) =>
      expect(xs.concat(ys).toList).toEqual(xs.toList.concat(ys.toList)),
    ),
  );

  describe('concatEval', () => {
    it('should do something', () => {
      View(1, 2, 3).concatEval(Eval.bottom()).take(3).toArray;
    });

    it(
      'should be lazy',
      forAll(A.fp4tsView(fc.integer()), xs =>
        expect(xs.concatEval(Eval.bottom()).take(xs.size).toArray).toEqual(
          xs.toArray,
        ),
      ),
    );
  });

  test(
    'map to be List.map',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.string()), (xs, f) =>
      expect(xs.map(f).toList).toEqual(xs.toList.map(f)),
    ),
  );

  describe('map2', () => {
    it('should short-circuit on the first arg empty', () => {
      expect(View.empty.map2(View.repeat(1), tupled).toArray).toEqual([]);
    });

    it(
      'should be List.map2',
      forAll(A.fp4tsView(fc.integer()), A.fp4tsView(fc.string()), (xs, ys) =>
        expect(xs.map2(ys, tupled).toList).toEqual(
          xs.toList.map2(ys.toList, tupled),
        ),
      ),
    );
  });

  describe('map2Eval', () => {
    it('should short-circuit on the first arg empty', () => {
      expect(View.empty.map2Eval(Eval.bottom(), tupled).value.toArray).toEqual(
        [],
      );
    });

    it(
      'should be List.map2Eval',
      forAll(
        A.fp4tsView(fc.integer()),
        A.fp4tsView(fc.string()),
        fc.func(A.fp4tsEval(fc.string())),
        (xs, ys, f) =>
          expect(xs.map2Eval(Eval.now(ys), f).value.toList).toEqual(
            xs.toList.map2Eval(Eval.now(ys.toList), f).value,
          ),
      ),
    );
  });

  describe('flatMap', () => {
    it('should be lazy', () => {
      expect(
        View(View.range(1), View.range(10), View.range(100)).flatMap(xs =>
          xs.take(3),
        ).toArray,
      ).toEqual([1, 2, 3, 10, 11, 12, 100, 101, 102]);
    });

    it(
      'should be List.flatMap',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func(A.fp4tsView(fc.string())),
        (xs, f) =>
          expect(xs.flatMap(f).toList).toEqual(
            xs.toList.flatMap(x => f(x).toList),
          ),
      ),
    );
  });

  test(
    'flatten to be .flatMap(id)',
    forAll(A.fp4tsView(A.fp4tsView(fc.integer())), xss =>
      expect(xss.flatten().toArray).toEqual(xss.flatMap(id).toArray),
    ),
  );

  test(
    'intersperse to be List.intersperse',
    forAll(A.fp4tsView<number | string>(fc.integer()), fc.string(), (xs, x) =>
      expect(xs.intersperse(x).toArray).toEqual(
        xs.toList.intersperse(x).toArray,
      ),
    ),
  );

  describe('zip', () => {
    it('should short-circuit', () => {
      expect(View.range(1).zip(View.empty).toArray).toEqual([]);
      expect(View.empty.zip(View.range(1)).toArray).toEqual([]);
    });

    it(
      'should be List.zip',
      forAll(A.fp4tsView(fc.integer()), A.fp4tsView(fc.string()), (xs, ys) =>
        expect(xs.zip(ys).toList).toEqual(xs.toList.zip(ys.toList)),
      ),
    );

    it(
      'should be zipWith(ys, tupled)',
      forAll(A.fp4tsView(fc.integer()), A.fp4tsView(fc.string()), (xs, ys) =>
        expect(xs.zip(ys).toArray).toEqual(xs.zipWith(ys, tupled).toArray),
      ),
    );
  });

  describe('zip3', () => {
    it('should short-circuit', () => {
      expect(View.range(1).zip3(View.empty, View.range(1)).toArray).toEqual([]);
      expect(View.range(1).zip3(View.range(1), View.empty).toArray).toEqual([]);
      expect(View.empty.zip3(View.range(1), View.range(1)).toArray).toEqual([]);
    });

    it(
      'should be List.zip3',
      forAll(
        A.fp4tsView(fc.integer()),
        A.fp4tsView(fc.string()),
        A.fp4tsView(fc.integer()),
        (xs, ys, zs) =>
          expect(xs.zip3(ys, zs).toList).toEqual(
            xs.toList.zip3(ys.toList, zs.toList),
          ),
      ),
    );

    it(
      'should be zipWith3(ys, zs, tupled)',
      forAll(
        A.fp4tsView(fc.integer()),
        A.fp4tsView(fc.string()),
        A.fp4tsView(fc.integer()),
        (xs, ys, zs) =>
          expect(xs.zip3(ys, zs).toArray).toEqual(
            xs.zipWith3(ys, zs, tupled).toArray,
          ),
      ),
    );
  });

  describe('zipWith', () => {
    it('should short-circuit', () => {
      expect(View.range(1).zipWith(View.empty, tupled).toArray).toEqual([]);
      expect(View.empty.zipWith(View.range(1), tupled).toArray).toEqual([]);
    });

    it(
      'should be List.zipWith',
      forAll(
        A.fp4tsView(fc.integer()),
        A.fp4tsView(fc.string()),
        fc.func(fc.integer()),
        (xs, ys, f) =>
          expect(xs.zipWith(ys, f).toList).toEqual(
            xs.toList.zipWith(ys.toList, f),
          ),
      ),
    );
  });

  describe('zipWith3', () => {
    it('should short-circuit', () => {
      expect(
        View.range(1).zipWith3(View.empty, View.range(1), tupled).toArray,
      ).toEqual([]);
      expect(
        View.range(1).zipWith3(View.range(1), View.empty, tupled).toArray,
      ).toEqual([]);
      expect(
        View.empty.zipWith3(View.range(1), View.range(1), tupled).toArray,
      ).toEqual([]);
    });

    it(
      'should be List.zipWith3',
      forAll(
        A.fp4tsView(fc.integer()),
        A.fp4tsView(fc.string()),
        A.fp4tsView(fc.string()),
        fc.func(fc.integer()),
        (xs, ys, zs, f) =>
          expect(xs.zipWith3(ys, zs, f).toList).toEqual(
            xs.toList.zipWith3(ys.toList, zs.toList, f),
          ),
      ),
    );
  });

  test(
    'zipWithIndex to be .zip(View.range(0)',
    forAll(A.fp4tsView(fc.string()), xs =>
      expect(xs.zipWithIndex.toArray).toEqual(xs.zip(View.range(0)).toArray),
    ),
  );

  describe('scanLeft', () => {
    test(
      'scanLeft(z, f).last === foldLeft(z, f)',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.string(),
        fc.func(fc.string()),
        (xs, z, f) => expect(xs.scanLeft(z, f).last).toBe(xs.foldLeft(z, f)),
      ),
    );

    it(
      'should be List.scanLeft',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.string(),
        fc.func(fc.string()),
        (xs, z, f) =>
          expect(xs.scanLeft(z, f).toList).toEqual(xs.toList.scanLeft(z, f)),
      ),
    );
  });

  describe('scanRight', () => {
    it('should be lazy', () => {
      expect(
        View.range(1)
          .scanRight(Eval.now(View.empty as View<number>), (x, exs) =>
            Eval.now(View.consEval(x, exs)),
          )
          .map(xs => xs.take(5).toArray)
          .take(3).toArray,
      ).toEqual([
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6],
        [3, 4, 5, 6, 7],
      ]);
    });

    it(
      'should be List.scanRight_',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.string(),
        fc.func(fc.string()),
        (xs, z, f) =>
          expect(
            xs.scanRight(Eval.now(z), (a, eb) => eb.map(b => f(a, b))).toList,
          ).toEqual(xs.toList.scanRight_(z, f)),
      ),
    );
  });

  describe('distinct to be List.distinct', () => {
    it('should be lazy', () => {
      expect(View(1, 2, 3).cycle().distinct().take(3).toArray).toEqual([
        1, 2, 3,
      ]);
    });

    test(
      'prim',
      forAll(A.fp4tsView(fc.integer()), xs =>
        expect(xs.distinct().toList).toEqual(xs.toList.distinct()),
      ),
    );

    test(
      'Eq',
      forAll(A.fp4tsView(fc.tuple(fc.integer(), fc.integer())), xs => {
        const E = Eq.tuple(Eq.fromUniversalEquals(), Eq.fromUniversalEquals());
        expect(xs.distinct(E).toList).toEqual(xs.toList.distinct(E));
      }),
    );
  });

  describe('remove', () => {
    it('should short-circuit', () => {
      expect(View.repeat(1).remove(1).take(2).toArray).toEqual([1, 1]);
    });

    it(
      'should be List.remove',
      forAll(A.fp4tsView(fc.integer()), fc.integer(), (xs, x) =>
        expect(xs.remove(x).toArray).toEqual(xs.toList.remove(x).toArray),
      ),
    );
  });

  describe('difference', () => {
    it('should be lazy in its first argument', () => {
      expect(View.range(1).difference(View(1, 2, 3)).take(5).toArray).toEqual([
        4, 5, 6, 7, 8,
      ]);
    });

    it(
      'should be List.difference',
      forAll(A.fp4tsView(fc.integer()), A.fp4tsView(fc.integer()), (xs, ys) =>
        expect(xs['\\'](ys).toList).toEqual(xs.toList['\\'](ys.toList)),
      ),
    );
  });

  describe('union', () => {
    it('should be lazy', () => {
      expect(
        View(1, 2, 3)
          .union(View.build(() => Eval.bottom<never>()))
          .take(3).toArray,
      ).toEqual([1, 2, 3]);
    });

    it(
      'should be List.union',
      forAll(A.fp4tsView(fc.integer()), A.fp4tsView(fc.integer()), (xs, ys) =>
        expect(xs.union(ys).toList).toEqual(xs.toList.union(ys.toList)),
      ),
    );
  });

  test(
    'intersect to be List.intersect',
    forAll(A.fp4tsView(fc.integer()), A.fp4tsView(fc.integer()), (xs, ys) =>
      expect(xs.intersect(ys).toList).toEqual(xs.toList.intersect(ys.toList)),
    ),
  );

  test(
    'foldLeft is List.foldLeft',
    forAll(
      A.fp4tsView(fc.integer()),
      fc.string(),
      fc.func(fc.string()),
      (xs, z, f) => expect(xs.foldLeft(z, f)).toBe(xs.toList.foldLeft(z, f)),
    ),
  );

  test(
    'foldLeft1 is List.foldLeft1',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      xs.isEmpty
        ? expect(() => xs.foldLeft1(f)).toThrow()
        : expect(xs.foldLeft1(f)).toBe(xs.toList.foldLeft1(f)),
    ),
  );

  test(
    'foldRight is List.foldRight',
    forAll(
      A.fp4tsView(fc.integer()),
      A.fp4tsEval(fc.string()),
      fc.func(A.fp4tsEval(fc.string())),
      (xs, ez, f) =>
        expect(xs.foldRight(ez, f).value).toBe(
          xs.toList.foldRight(ez, f).value,
        ),
    ),
  );

  test(
    'foldRight1 is List.foldRight1',
    forAll(
      A.fp4tsView(fc.integer()),
      fc.func(A.fp4tsEval(fc.integer())),
      (xs, f) =>
        xs.isEmpty
          ? expect(() => xs.foldRight1(f).value).toThrow()
          : expect(xs.foldRight1(f).value).toBe(xs.toList.foldRight1(f).value),
    ),
  );

  test(
    'foldMap is List.foldMap',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      expect(xs.foldMap(Monoid.addition, f)).toEqual(
        xs.toList.foldMap(Monoid.addition, f),
      ),
    ),
  );

  test(
    'foldMapLeft is List.foldMapLeft',
    forAll(A.fp4tsView(fc.integer()), fc.func(fc.integer()), (xs, f) =>
      expect(xs.foldMapLeft(Monoid.addition, f)).toEqual(
        xs.toList.foldMapLeft(Monoid.addition, f),
      ),
    ),
  );

  describe('traverse', () => {
    it('should short-circuit', () => {
      expect(View.range(1).traverse(Option.Monad, () => None)).toEqual(None);
    });

    it('should be lazy when traverse over identity', () => {
      expect(
        View.range(1)
          .traverse(Identity.Monad, x => x * 2)
          .take(5).toArray,
      ).toEqual([2, 4, 6, 8, 10]);
    });

    it(
      'should be List.traverse',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func(A.fp4tsEval(fc.string())),
        (xs, f) =>
          expect(xs.traverse(Monad.Eval, f).value.toList).toEqual(
            xs.toList.traverse(Monad.Eval, f).value,
          ),
      ),
    );
  });

  describe('traverse_', () => {
    it('should short-circuit', () => {
      expect(
        View.repeat(false).traverse_(
          Const.Applicative(Monoid.conjunction),
          Const,
        ),
      ).toEqual(false);
    });

    it('should evaluate the entire view on identity', () => {
      let cnt = 0;
      View.range(1, 5).traverse_(Identity.Monad, _ => cnt++);
      expect(cnt).toBe(4);
    });

    it(
      'should be List.traverse_',
      forAll(A.fp4tsView(fc.string()), xs => {
        const G = Const.Applicative(Monoid.string);
        expect(xs.traverse_(G, Const)).toBe(xs.toList.traverse_(G, Const));
      }),
    );
  });

  describe('traverseFilter', () => {
    it('should short-circuit', () => {
      expect(View.range(1).traverseFilter(Option.Monad, () => None)).toEqual(
        None,
      );
    });

    it('should be lazy when traversed over identity', () => {
      expect(
        View.range(1)
          .traverseFilter(Identity.Monad, x =>
            x % 2 === 0 ? Some(x * 2) : None,
          )
          .take(5).toArray,
      ).toEqual([4, 8, 12, 16, 20]);
    });

    it(
      'should be List.traverseFilter',
      forAll(
        A.fp4tsView(fc.integer()),
        fc.func(A.fp4tsEval(A.fp4tsOption(fc.string()))),
        (xs, f) =>
          expect(xs.traverseFilter(Monad.Eval, f).value.toList).toEqual(
            xs.toList.traverseFilter(Monad.Eval, f).value,
          ),
      ),
    );
  });

  test(
    'join to be List.join',
    forAll(A.fp4tsView(fc.string()), fc.string(), (xs, s) =>
      expect(xs.join(s)).toEqual(xs.toList.join(s)),
    ),
  );

  test(
    'join to be List.join',
    forAll(A.fp4tsView(fc.string()), fc.string(), xs =>
      expect(xs.join()).toEqual(xs.toList.join()),
    ),
  );

  describe('Laws', () => {
    const viewEq = <X>(E: Eq<X>) =>
      Eq.by<View<X>, List<X>>(List.Eq(E), xs => xs.toList);

    checkAll(
      'MonadPlus<View>',
      MonadPlusSuite(View.MonadPlus).monadPlus(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsView,
        viewEq,
      ),
    );

    checkAll(
      'TraversableFilter<View>',
      TraversableFilterSuite(View.TraversableFilter).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        View.FunctorFilter,
        Monad.Eval,
        Monad.Eval,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsView,
        viewEq,
        A.fp4tsEval,
        Eq.Eval,
        A.fp4tsEval,
        Eq.Eval,
      ),
    );

    checkAll(
      'Unzip<View>',
      UnzipSuite(View.Unzip).unzip(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsView,
        viewEq,
      ),
    );
  });
});

abstract class Action<A, B> {
  public abstract runOnView(xs: View<A>): View<B>;
  public abstract runOnList(xs: List<A>): List<B>;
}

class PrependAction<A> extends Action<A, A> {
  readonly name = 'Prepend';
  public constructor(public readonly value: A) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.prepend(this.value);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.prepend(this.value);
  }

  static readonly Arb = fc.integer().map(x => new PrependAction(x));
}
class AppendAction<A> extends Action<A, A> {
  readonly name = 'Append';
  public constructor(public readonly value: A) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.append(this.value);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.append(this.value);
  }

  static readonly Arb = fc.integer().map(x => new AppendAction(x));
}
class TakeAction<A> extends Action<A, A> {
  readonly name = 'Take';
  public constructor(public readonly n: number) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.take(this.n);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.take(this.n);
  }

  static readonly Arb = fc.integer().map(x => new TakeAction(x));
}
class DropAction<A> extends Action<A, A> {
  readonly name = 'Drop';
  public constructor(public readonly n: number) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.drop(this.n);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.drop(this.n);
  }

  static readonly Arb = fc.integer().map(x => new DropAction(x));
}
class TakeWhileAction<A> extends Action<A, A> {
  readonly name = 'TakeWhile';
  public constructor(public readonly p: (a: A) => boolean) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.takeWhile(this.p);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.takeWhile(this.p);
  }

  static readonly Arb = fc.func(fc.boolean()).map(p => new TakeWhileAction(p));
}
class DropWhileAction<A> extends Action<A, A> {
  readonly name = 'DropWhile';
  public constructor(public readonly p: (a: A) => boolean) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.dropWhile(this.p);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.dropWhile(this.p);
  }

  static readonly Arb = fc.func(fc.boolean()).map(p => new DropWhileAction(p));
}
class FilterAction<A> extends Action<A, A> {
  readonly name = 'Filter';
  public constructor(public readonly f: (a: A) => boolean) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.filter(this.f);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.filter(this.f);
  }

  static readonly Arb = fc.func(fc.boolean()).map(f => new FilterAction(f));
}
class FilterNotAction<A> extends Action<A, A> {
  readonly name = 'FilterNot';
  public constructor(public readonly f: (a: A) => boolean) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.filterNot(this.f);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.filterNot(this.f);
  }

  static readonly Arb = fc.func(fc.boolean()).map(f => new FilterNotAction(f));
}
class CollectAction<A, B> extends Action<A, B> {
  readonly name = 'Collect';
  public constructor(public readonly f: (a: A) => Option<B>) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.collect(this.f);
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.collect(this.f);
  }

  static readonly Arb = fc
    .func(A.fp4tsOption(fc.integer()))
    .map(f => new CollectAction(f));
}
class CollectWhileAction<A, B> extends Action<A, B> {
  readonly name = 'CollectWhile';
  public constructor(public readonly f: (a: A) => Option<B>) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.collectWhile(this.f);
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.collectWhile(this.f);
  }

  static readonly Arb = fc
    .func(A.fp4tsOption(fc.integer()))
    .map(f => new CollectWhileAction(f));
}
class ConcatAction<A> extends Action<A, A> {
  readonly name = 'Concat';
  public constructor(public readonly that: View<A>) {
    super();
  }

  public runOnView(xs: View<A>): View<A> {
    return xs.concat(this.that);
  }
  public runOnList(xs: List<A>): List<A> {
    return xs.concat(this.that.toList);
  }

  static readonly Arb = A.fp4tsView(fc.integer()).map(
    xs => new ConcatAction(xs),
  );
}
class MapAction<A, B> extends Action<A, B> {
  readonly name = 'Map';
  public constructor(public readonly f: (a: A) => B) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.map(this.f);
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.map(this.f);
  }

  static readonly Arb = fc.func(fc.integer()).map(f => new MapAction(f));
}
class FlatMapAction<A, B> extends Action<A, B> {
  readonly name = 'FlatMap';
  public constructor(public readonly f: (a: A) => View<B>) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.flatMap(this.f);
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.flatMap(x => this.f(x).toList);
  }

  static readonly Arb = fc
    .func(A.fp4tsView(fc.integer()))
    .map(f => new FlatMapAction(f));
}
class ZipAction<A, B> extends Action<A, [A, B]> {
  readonly name = 'Zip';
  public constructor(public readonly that: View<B>) {
    super();
  }

  public runOnView(xs: View<A>): View<[A, B]> {
    return xs.zip(this.that);
  }
  public runOnList(xs: List<A>): List<[A, B]> {
    return xs.zip(this.that.toList);
  }

  static readonly Arb = A.fp4tsView(fc.integer()).map(xs => new ZipAction(xs));
}
class Zip3Action<A, B, C> extends Action<A, [A, B, C]> {
  readonly name = 'Zip3';
  public constructor(public readonly ys: View<B>, public readonly zs: View<C>) {
    super();
  }

  public runOnView(xs: View<A>): View<[A, B, C]> {
    return xs.zip3(this.ys, this.zs);
  }
  public runOnList(xs: List<A>): List<[A, B, C]> {
    return xs.zip3(this.ys.toList, this.zs.toList);
  }

  static readonly Arb = fc
    .tuple(A.fp4tsView(fc.integer()), A.fp4tsView(fc.integer()))
    .map(([ys, zs]) => new Zip3Action(ys, zs));
}
class ZipWithAction<A, B, C> extends Action<A, C> {
  readonly name = 'ZipWith';
  public constructor(
    public readonly that: View<B>,
    public readonly f: (a: A, b: B) => C,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<C> {
    return xs.zipWith(this.that, this.f);
  }
  public runOnList(xs: List<A>): List<C> {
    return xs.zipWith(this.that.toList, this.f);
  }

  static readonly Arb = fc
    .tuple(A.fp4tsView(fc.integer()), fc.func(fc.integer()))
    .map(([xs, f]) => new ZipWithAction(xs, f));
}
class ZipWithIndexAction<A> extends Action<A, [A, number]> {
  readonly name = 'ZipWith';
  public constructor() {
    super();
  }

  public runOnView(xs: View<A>): View<[A, number]> {
    return xs.zipWithIndex;
  }
  public runOnList(xs: List<A>): List<[A, number]> {
    return xs.zipWithIndex;
  }

  static readonly Arb = fc.constant(new ZipWithIndexAction());
}
class FoldLeftAction<A, B> extends Action<A, B> {
  readonly name = 'FoldLeft';
  public constructor(
    public readonly z: B,
    public readonly f: (b: B, a: A) => B,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return View(xs.foldLeft(this.z, this.f));
  }
  public runOnList(xs: List<A>): List<B> {
    return List(xs.foldLeft(this.z, this.f));
  }

  static readonly Arb = fc
    .tuple(fc.integer(), fc.func(fc.integer()))
    .map(([z, f]) => new FoldLeftAction(z, f));
}
class FoldRightAction<A, B> extends Action<A, B> {
  readonly name = 'FoldRight';
  public constructor(
    public readonly ez: Eval<B>,
    public readonly f: (a: A, eb: Eval<B>) => Eval<B>,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return View(xs.foldRight(this.ez, this.f).value);
  }
  public runOnList(xs: List<A>): List<B> {
    return List(xs.foldRight(this.ez, this.f).value);
  }

  static readonly Arb = fc
    .tuple(A.fp4tsEval(fc.integer()), fc.func(A.fp4tsEval(fc.integer())))
    .map(([z, f]) => new FoldRightAction(z, f));
}
class ScanLeftAction<A, B> extends Action<A, B> {
  readonly name = 'ScanLeft';
  public constructor(
    public readonly z: B,
    public readonly f: (b: B, a: A) => B,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.scanLeft(this.z, this.f);
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.scanLeft(this.z, this.f);
  }

  static readonly Arb = fc
    .tuple(fc.integer(), fc.func(fc.integer()))
    .map(([z, f]) => new ScanLeftAction(z, f));
}
class ScanRightAction<A, B> extends Action<A, B> {
  readonly name = 'ScanRight';
  public constructor(
    public readonly z: B,
    public readonly f: (a: A, b: B) => B,
  ) {
    super();
  }

  public runOnView(xs: View<A>): View<B> {
    return xs.scanRight(Eval.now(this.z), (a, eb) => eb.map(b => this.f(a, b)));
  }
  public runOnList(xs: List<A>): List<B> {
    return xs.scanRight_(this.z, this.f);
  }

  static readonly Arb = fc
    .tuple(fc.integer(), fc.func(fc.integer()))
    .map(([z, f]) => new ScanRightAction(z, f));
}

describe('composition', () => {
  const actionArb: Arbitrary<Action<unknown, unknown>> = fc.oneof(
    PrependAction.Arb,
    AppendAction.Arb,
    TakeAction.Arb,
    DropAction.Arb,
    TakeWhileAction.Arb,
    DropWhileAction.Arb,
    FilterAction.Arb,
    FilterNotAction.Arb,
    CollectAction.Arb,
    CollectWhileAction.Arb,
    ConcatAction.Arb,
    MapAction.Arb,
    FlatMapAction.Arb,
    ZipAction.Arb,
    Zip3Action.Arb,
    ZipWithAction.Arb,
    ZipWithIndexAction.Arb,
    FoldLeftAction.Arb,
    FoldRightAction.Arb,
    ScanLeftAction.Arb,
    ScanRightAction.Arb,
  );
  const actionsArb = fc.array(actionArb, { minLength: 100, maxLength: 10000 });

  it(
    'should be isomorphic to List operations',
    forAll(actionsArb, A.fp4tsView(fc.integer()), (as, xs) =>
      expect(
        as.reduce<View<unknown>>((xs, a) => a.runOnView(xs), xs).toArray,
      ).toEqual(
        as.reduce<List<unknown>>((xs, a) => a.runOnList(xs), xs.toList).toArray,
      ),
    ),
  );
});
