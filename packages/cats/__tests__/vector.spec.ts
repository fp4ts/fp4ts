// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id } from '@fp4ts/core';
import { CommutativeMonoid, Eq } from '@fp4ts/cats-kernel';
import { Eval } from '@fp4ts/cats-core';
import {
  Some,
  None,
  Left,
  Right,
  List,
  Vector,
  Identity,
} from '@fp4ts/cats-core/lib/data';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import {
  AlternativeSuite,
  MonadSuite,
  FunctorFilterSuite,
  AlignSuite,
  CoflatMapSuite,
  TraversableFilterSuite,
} from '@fp4ts/cats-laws';

describe('Vector', () => {
  describe('type', () => {
    it('should be covariant', () => {
      const o: Vector<number> = Vector.empty;
    });

    it('should disallow unrelated type widening', () => {
      const o: Vector<number> = Vector.empty;

      // @ts-expect-error
      o.prepend('some-string');
    });
  });

  describe('constructors', () => {
    it('should create vector from an array', () => {
      expect(Vector.fromArray([1, 2, 3, 4, 5]).toArray).toEqual([
        1, 2, 3, 4, 5,
      ]);
    });

    it('should create a vector from list', () => {
      expect(Vector.fromList(List(1, 2, 3, 4, 5)).toArray).toEqual(
        Vector(1, 2, 3, 4, 5).toArray,
      );
    });

    test('empty vector to be empty', () => {
      expect(Vector.empty.isEmpty).toBe(true);
    });

    test('singleton vector not to be empty', () => {
      expect(Vector.pure(1).nonEmpty).toBe(true);
    });
  });

  describe('iterator', () => {
    it('should convert the empty list to an empty array', () => {
      expect([...Vector.empty]).toEqual([]);
    });

    it('should convert a Vector of three elements to an three element array', () => {
      expect([...Vector(1, 2, 3)]).toEqual([1, 2, 3]);
    });

    it('should be stack safe', () => {
      expect([...Vector.fromArray([...new Array(10_000).keys()])]).toEqual([
        ...new Array(10_000).keys(),
      ]);
    });
  });

  describe('head', () => {
    it('should throw when vector is empty', () => {
      expect(() => Vector.empty.head).toThrow();
    });

    it('should return head of the vector', () => {
      expect(Vector(1, 2).head).toBe(1);
    });
  });

  describe('headOption', () => {
    it('should return None when vector is empty', () => {
      expect(Vector.empty.headOption).toEqual(None);
    });

    it('should return Some head when vector is not empty', () => {
      expect(Vector(1, 2).headOption).toEqual(Some(1));
    });
  });

  describe('last', () => {
    it('should throw error on empty vector', () => {
      expect(() => Vector.empty.last).toThrow();
    });

    it('should return Some last when vector is not empty', () => {
      expect(Vector(1, 2).last).toEqual(2);
    });
  });

  describe('lastOption', () => {
    it('should return None when list is empty', () => {
      expect(Vector.empty.lastOption).toEqual(None);
    });

    it('should return Some last when list is not empty', () => {
      expect(Vector(1, 2).lastOption).toEqual(Some(2));
    });
  });

  describe('tail', () => {
    it('should return an empty list when empty', () => {
      expect(Vector.empty.tail).toEqual(Vector.empty);
    });

    it('should return a list without the first element', () => {
      expect(Vector(1, 2, 3).tail.toArray).toEqual(Vector(2, 3).toArray);
    });
  });

  describe('init', () => {
    it('should return an empty vector when empty', () => {
      expect(Vector.empty.init).toEqual(Vector.empty);
    });

    it('should return a vector without the last element', () => {
      expect(Vector(1, 2, 3).init.toArray).toEqual(Vector(1, 2).toArray);
    });
  });

  describe('popHead', () => {
    it('should return None when vector is empty', () => {
      expect(Vector.empty.popHead).toEqual(None);
    });

    it('should pop head of a singleton vector', () => {
      expect(Vector(42).popHead).toEqual(Some([42, Vector.empty]));
    });

    it('should pop head of a vector', () => {
      const [hd, tl] = Vector(1, 2, 3, 4, 5).popHead.get;
      expect([hd, tl.toArray]).toEqual([1, [2, 3, 4, 5]]);
    });
  });

  describe('popLast', () => {
    it('should return None when vector is empty', () => {
      expect(Vector.empty.popLast).toEqual(None);
    });

    it('should pop lst element of a singleton vector', () => {
      expect(Vector(42).popLast).toEqual(Some([42, Vector.empty]));
    });

    it('should pop last element of a vector', () => {
      const [l, init] = Vector(1, 2, 3, 4, 5).popLast.get;
      expect([l, init.toArray]).toEqual([5, [1, 2, 3, 4]]);
    });
  });

  describe('reverse', () => {
    it('should return an empty vector', () => {
      expect(Vector.empty.reverse).toEqual(Vector.empty);
    });

    it('should reserve a vector of single element', () => {
      expect(Vector(42).reverse).toEqual(Vector(42));
    });

    it('should reserve a vector of three elements', () => {
      expect(Vector(1, 2, 3).reverse.toArray).toEqual(Vector(3, 2, 1).toArray);
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.reverse.toArray).toEqual(
        [...new Array(10_000).keys()].reverse(),
      );
    });
  });

  describe('prepend', () => {
    it('should prepend an element to an empty vector', () => {
      expect(Vector.empty.prepend(42)).toEqual(Vector(42));
    });

    it('should add an additional element to the head of the vector', () => {
      expect(Vector(1, 2, 3, 4).prepend(0).toArray).toEqual(
        Vector(0, 1, 2, 3, 4).toArray,
      );
    });

    it('should prepend multiple elements', () => {
      expect(Vector.empty.prepend(0).prepend(1)['+::'](2).toArray).toEqual([
        2, 1, 0,
      ]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const v = xs.reduce(
        (xs, x) => xs.prepend(x),
        Vector.empty as Vector<number>,
      );

      expect(v.toArray).toEqual(xs.reverse());
    });
  });

  describe('append', () => {
    it('should append an element to an empty vector', () => {
      expect(Vector.empty.append(42)).toEqual(Vector(42));
    });

    it('should add an additional element to the head of the vector', () => {
      expect(Vector(1, 2, 3, 4).append(0).toArray).toEqual(
        Vector(1, 2, 3, 4, 0).toArray,
      );
    });

    it('should append multiple elements', () => {
      expect(Vector.empty.append(0).append(1)['::+'](2).toArray).toEqual([
        0, 1, 2,
      ]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const v = xs.reduce(
        (xs, x) => xs.append(x),
        Vector.empty as Vector<number>,
      );

      expect(v.toArray).toEqual(xs);
    });
  });

  describe('elem', () => {
    it('should throw when empty', () => {
      expect(() => Vector.empty.elem(0)).toThrow();
    });

    it('should return element at the given index', () => {
      const size = 20_000;
      const xs = Vector.fromArray([...new Array(size).keys()]);
      const ys = [] as number[];
      for (let i = 0; i < size; i++) {
        ys[i] = xs.elem(i);
      }
      expect(ys).toEqual([...new Array(size).keys()]);
    });
  });

  describe('elemOption', () => {
    it('should return None when index is less than zero', () => {
      expect(Vector(1, 2, 3)['!?'](-1)).toEqual(None);
    });

    it('should return indexed element', () => {
      expect(Vector(1, 2, 3)['!?'](0)).toEqual(Some(1));
      expect(Vector(1, 2, 3)['!?'](1)).toEqual(Some(2));
      expect(Vector(1, 2, 3)['!?'](2)).toEqual(Some(3));
    });

    it('should return None when index is beyond the bounds', () => {
      expect(Vector.empty['!?'](1_000)).toEqual(None);
    });
  });

  describe('all', () => {
    it('should return true when list is empty', () => {
      expect(Vector.empty.all(() => false)).toBe(true);
    });

    it('should return true when all elements are even', () => {
      expect(List(2, 4, 6).all(x => x % 2 === 0)).toBe(true);
    });

    it('should return false when one element is odd', () => {
      expect(List(2, 4, 6, 7).all(x => x % 2 === 0)).toBe(false);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()].map(() => true));
      expect(xs.all(id)).toBe(true);
    });
  });

  describe('any', () => {
    it('should return false when list is empty', () => {
      expect(Vector.empty.any(() => true)).toBe(false);
    });

    it('should return true when all elements are odd', () => {
      expect(Vector(1, 3, 5).any(x => x % 2 === 0)).toBe(false);
    });

    it('should return false when one element is even', () => {
      expect(Vector(1, 3, 6).any(x => x % 2 === 0)).toBe(true);
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray(
        [...new Array(10_000).keys()].map(() => false),
      );
      expect(xs.any(id)).toBe(false);
    });
  });

  describe('count', () => {
    it('should return zero when list is empty', () => {
      expect(Vector.empty.count(() => true)).toBe(0);
    });

    it('should return 1 when 1 element is even', () => {
      expect(Vector(1, 2, 3).count(x => x % 2 === 0)).toBe(1);
    });

    it('should return 3 when all elements are even', () => {
      expect(Vector(2, 4, 6).count(x => x % 2 === 0)).toBe(3);
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray(
        [...new Array(10_000).keys()].map(() => true),
      );
      expect(xs.count(id)).toBe(10_000);
    });
  });

  describe('take', () => {
    it('should return an empty vector when vector is vector is empty', () => {
      expect(Vector.empty.take(1).toArray).toEqual(Vector.empty.toArray);
    });

    it('should return an empty vector when 0 elements are taken', () => {
      expect(Vector(1, 2, 3).take(0).toArray).toEqual(Vector.empty.toArray);
    });

    it('should return 1 element vector if 1 element is taken', () => {
      expect(Vector(1, 2, 3).take(1).toArray).toEqual(Vector(1).toArray);
    });

    it('should return entire vector if entire vector is taken', () => {
      expect(Vector(1, 2, 3).take(3).toArray).toEqual(Vector(1, 2, 3).toArray);
    });

    it('should return entire vector if more than size of the vector is taken', () => {
      expect(Vector(1, 2, 3).take(1000).toArray).toEqual(
        Vector(1, 2, 3).toArray,
      );
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.take(10_000).toArray).toEqual(xs.toArray);
    });
  });

  describe('takeRight', () => {
    it('should return an empty vector when vector is vector is empty', () => {
      expect(Vector.empty.takeRight(1).toArray).toEqual(Vector.empty.toArray);
    });

    it('should return an empty vector when 0 elements are taken', () => {
      expect(Vector(1, 2, 3).takeRight(0).toArray).toEqual(
        Vector.empty.toArray,
      );
    });

    it('should return 2 elements vector if 2 element are taken', () => {
      expect(Vector(1, 2, 3).takeRight(2).toArray).toEqual(
        Vector(2, 3).toArray,
      );
    });

    it('should return entire vector if entire vector is taken', () => {
      expect(Vector(1, 2, 3).takeRight(3).toArray).toEqual(
        Vector(1, 2, 3).toArray,
      );
    });

    it('should return entire vector if more than size of the vector is taken', () => {
      expect(Vector(1, 2, 3).takeRight(1000).toArray).toEqual(
        Vector(1, 2, 3).toArray,
      );
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.takeRight(10_000).toArray).toEqual(xs.toArray);
    });
  });

  describe('drop', () => {
    it('should return an empty vector when vector is vector is empty', () => {
      expect(Vector.empty.drop(1).toArray).toEqual(Vector.empty.toArray);
    });

    it('should return an entire vector when 0 elements are dropped', () => {
      expect(Vector(1, 2, 3).drop(0).toArray).toEqual(Vector(1, 2, 3).toArray);
    });

    it('should drop a single element from vector', () => {
      expect(Vector(1, 2, 3).drop(1).toArray).toEqual(Vector(2, 3).toArray);
    });

    it('should return drop the entire length of the vector', () => {
      expect(Vector(1, 2, 3).drop(3).toArray).toEqual(Vector.empty.toArray);
    });

    it('should return an empty vector if more than vector size is dropped', () => {
      expect(Vector(1, 2, 3).drop(1000).toArray).toEqual(Vector.empty.toArray);
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.drop(10_000).toArray).toEqual([]);
    });
  });

  describe('dropRight', () => {
    it('should return an empty vector when vector is vector is empty', () => {
      expect(Vector.empty.dropRight(1).toArray).toEqual(Vector.empty.toArray);
    });

    it('should return an entire vector when 0 elements are dropped', () => {
      expect(Vector(1, 2, 3).dropRight(0).toArray).toEqual(
        Vector(1, 2, 3).toArray,
      );
    });

    it('should drop a single element from vector', () => {
      expect(Vector(1, 2, 3).dropRight(1).toArray).toEqual(
        Vector(1, 2).toArray,
      );
    });

    it('should return drop the entire length of the vector', () => {
      expect(Vector(1, 2, 3).dropRight(3).toArray).toEqual(
        Vector.empty.toArray,
      );
    });

    it('should return an empty vector if more than vector size is dropped', () => {
      expect(Vector(1, 2, 3).dropRight(1000).toArray).toEqual(
        Vector.empty.toArray,
      );
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.dropRight(10_000).toArray).toEqual([]);
    });
  });

  describe('slice', () => {
    it('should return an empty vector if empty vector is sliced', () => {
      expect(Vector.empty.slice(1, 2).toArray).toEqual(Vector.empty.toArray);
    });

    it('should drop first element of the vector', () => {
      expect(Vector(1, 2, 3, 4).slice(1, 1000).toArray).toEqual(
        Vector(2, 3, 4).toArray,
      );
    });

    it('should take first element of the vector', () => {
      expect(Vector(1, 2, 3, 4).slice(0, 1).toArray).toEqual(Vector(1).toArray);
    });

    it('should slice middle two elements of the vector', () => {
      expect(Vector(1, 2, 3, 4).slice(1, 3).toArray).toEqual(
        Vector(2, 3).toArray,
      );
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000)]);
      expect(xs.slice(2_500, 5_000).toArray).toEqual(
        [...new Array(10_000)].slice(2_500, 5_000),
      );
    });
  });

  describe('splitAt', () => {
    it('should return two empty vectors when empty', () => {
      expect(Vector.empty.splitAt(0)).toEqual([Vector.empty, Vector.empty]);
    });

    it('should return empty lhs when split on negative index', () => {
      expect(Vector(1, 2, 3).splitAt(-1)).toEqual([
        Vector.empty,
        Vector(1, 2, 3),
      ]);
    });

    it('should return empty lhs when split on index 0', () => {
      const [lhs, rhs] = Vector(1, 2, 3).splitAt(0);
      expect([lhs.toArray, rhs.toArray]).toEqual([
        Vector().toArray,
        Vector(1, 2, 3).toArray,
      ]);
    });

    it('should return singleton lhs when split on index 1', () => {
      const [lhs, rhs] = Vector(1, 2, 3).splitAt(1);
      expect([lhs.toArray, rhs.toArray]).toEqual([
        Vector(1).toArray,
        Vector(2, 3).toArray,
      ]);
    });

    it('should return singleton rhs when split on index 2', () => {
      const [lhs, rhs] = Vector(1, 2, 3).splitAt(2);
      expect([lhs.toArray, rhs.toArray]).toEqual([
        Vector(1, 2).toArray,
        Vector(3).toArray,
      ]);
    });

    it('should return empty rhs when split beyond the bounds of vector', () => {
      expect(Vector(1, 2, 3).splitAt(1_000)).toEqual([
        Vector(1, 2, 3),
        Vector.empty,
      ]);
    });
  });

  describe('concat', () => {
    it('should concat two empty vectors into an empty vector', () => {
      expect(Vector.empty.concat(Vector.empty)).toEqual(Vector.empty);
    });

    it('should return rhs when lhs empty', () => {
      expect(Vector.empty['+++'](Vector(1, 2, 3)).toArray).toEqual(
        Vector(1, 2, 3).toArray,
      );
    });

    it('should return lhs when rhs empty', () => {
      expect(Vector(1, 2, 3)['+++'](Vector.empty).toArray).toEqual(
        Vector(1, 2, 3).toArray,
      );
    });

    it('should concatenate two vectors', () => {
      expect(Vector(1, 2, 3)['+++'](Vector(4, 5, 6)).toArray).toEqual(
        Vector(1, 2, 3, 4, 5, 6).toArray,
      );
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const vx = Vector.fromArray(xs);

      expect(vx['+++'](vx).toArray).toEqual([...xs, ...xs]);
    });
  });

  describe('map', () => {
    it('should return an empty vector if empty vector if mapped', () => {
      expect(Vector.empty.map(() => true)).toEqual(Vector.empty);
    });

    it('should double all of the elements', () => {
      expect(Vector(1, 2, 3).map(x => x * 2).toArray).toEqual(
        Vector(2, 4, 6).toArray,
      );
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.map(id).toArray).toEqual(xs.toArray);
    });
  });

  describe('flatMap', () => {
    it('should return an empty vector if empty vector if mapped', () => {
      expect(Vector.empty.flatMap(() => Vector(true))).toEqual(Vector.empty);
    });

    it('should return twice the double of all elements', () => {
      expect(
        Vector(1, 2, 3).flatMap(x => Vector(x * 2, x * 2)).toArray,
      ).toEqual(Vector(2, 2, 4, 4, 6, 6).toArray);
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.flatMap(x => Vector(x, x)).toArray).toEqual(
        xs.toArray.flatMap(x => [x, x]),
      );
    });
  });

  // describe('tailRecM', () => {
  //   it('should return initial result when returned singleton vector', () => {
  //     expect(Vector.tailRecM(42)(x => Vector(Right(x)))).toEqual(Vector(42));
  //   });

  //   it('should return empty vector when an empty vector is returned', () => {
  //     expect(Vector.tailRecM(42)(x => Vector.empty)).toEqual(Vector.empty);
  //   });

  //   it('should compute recursive sum', () => {
  //     expect(
  //       Vector.tailRecM<[number, number]>([0, 0])(([i, x]) =>
  //         i < 10
  //           ? Vector<Either<[number, number], number>>(
  //               Right(x),
  //               Left([i + 1, x + i]),
  //             )
  //           : Vector(Right(x)),
  //       ).toArray,
  //     ).toEqual(Vector(0, 0, 1, 3, 6, 10, 15, 21, 28, 36, 45).toArray);
  //   });

  //   it('should compute recursive sum inverted', () => {
  //     expect(
  //       Vector.tailRecM<[number, number]>([0, 0])(([i, x]) =>
  //         i < 10
  //           ? Vector<Either<[number, number], number>>(
  //               Left([i + 1, x + i]),
  //               Right(x),
  //             )
  //           : Vector(Right(x)),
  //       ).toArray,
  //     ).toEqual(Vector(45, 36, 28, 21, 15, 10, 6, 3, 1, 0, 0).toArray);
  //   });

  //   it('should be stack safe', () => {
  //     const size = 100_000;

  //     expect(
  //       Vector.tailRecM(0)(i =>
  //         i < size ? Vector(Left(i + 1)) : Vector(Right(i)),
  //       ),
  //     ).toEqual(Vector(size));
  //   });
  // });

  describe('zip', () => {
    it('should produce an empty vector when zipped with empty vector on lhs', () => {
      expect(Vector.empty.zip(Vector(42))).toEqual(Vector.empty);
    });

    it('should produce an empty Vector when zipped with empty Vector on rhs', () => {
      expect(Vector(42).zip(Vector.empty)).toEqual(Vector.empty);
    });

    it('should zip two single element Vectors', () => {
      expect(Vector(42).zip(Vector(43))).toEqual(Vector([42, 43]));
    });
  });

  describe('zipWithIndex', () => {
    it('should produce an empty Vector out of empty Vector', () => {
      expect(Vector.empty.zipWithIndex).toEqual(Vector.empty);
    });

    it('should index the values in the Vector', () => {
      expect(Vector(1, 2, 3).zipWithIndex.toArray).toEqual([
        [1, 0],
        [2, 1],
        [3, 2],
      ]);
    });
  });

  describe('zipWith', () => {
    const add = (x: number, y: number): number => x + y;

    it('should produce an empty Vector when zipped with empty Vector on lhs', () => {
      expect(Vector.empty.zipWith(Vector(42))(add)).toEqual(Vector.empty);
    });

    it('should produce an empty Vector when zipped with empty Vector on rhs', () => {
      expect(Vector(42).zipWith(Vector.empty)(add)).toEqual(Vector.empty);
    });

    it('should zip two single element Vectors', () => {
      expect(Vector(42).zipWith(Vector(43))(add)).toEqual(Vector(85));
    });
  });

  describe('zipAll', () => {
    it('should fill default value on left', () => {
      expect(
        Vector.empty.zipAll(
          Vector(42),
          () => 1,
          () => 2,
        ).toArray,
      ).toEqual([[1, 42]]);
    });

    it('should fill default value on right', () => {
      expect(
        Vector(42).zipAll(
          Vector.empty,
          () => 1,
          () => 2,
        ).toArray,
      ).toEqual([[42, 2]]);
    });

    it('should zip two single element Vectors', () => {
      expect(
        Vector(42).zipAll(
          Vector(43),
          () => 1,
          () => 2,
        ).toArray,
      ).toEqual([[42, 43]]);
    });
  });

  describe('zipAllWith', () => {
    const add = (x: number, y: number): number => x + y;

    it('should fill default value on left', () => {
      expect(
        Vector.empty.zipAllWith(
          Vector(42),
          () => 1,
          () => 2,
        )(add).toArray,
      ).toEqual([43]);
    });

    it('should fill default value on right', () => {
      expect(
        Vector(42).zipAllWith(
          Vector.empty,
          () => 1,
          () => 2,
        )(add).toArray,
      ).toEqual([44]);
    });

    it('should zip two single element Vectors', () => {
      expect(
        Vector(42).zipAllWith(
          Vector(43),
          () => 1,
          () => 2,
        )(add).toArray,
      ).toEqual([85]);
    });
  });

  describe('forEach', () => {
    it('should not invoke a callback when empty', () => {
      const fn = jest.fn();
      Vector.empty.forEach(fn);

      expect(fn).not.toHaveBeenCalled();
    });

    it('should call with each element in order', () => {
      const xs: number[] = [];
      Vector(1, 2, 3, 4, 5).forEach(x => xs.push(x));

      expect(xs).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('partition', () => {
    it('should partition empty Vector to tuple of empty Vectors', () => {
      const [l, r] = Vector.empty.partition(() => true);
      expect([l.toArray, r.toArray]).toEqual([[], []]);
    });

    it('should return left partition', () => {
      const [l, r] = Vector(1, 2, 3).partition(() => true);
      expect([l.toArray, r.toArray]).toEqual([[1, 2, 3], []]);
    });

    it('should return right partition', () => {
      const [l, r] = Vector(1, 2, 3).partition(() => false);
      expect([l.toArray, r.toArray]).toEqual([[], [1, 2, 3]]);
    });

    it('should make partition of odd and even numbers', () => {
      const [l, r] = Vector(1, 2, 3, 4, 5, 6, 7, 8, 9).partition(
        x => x % 2 !== 0,
      );
      expect([l.toArray, r.toArray]).toEqual([
        [1, 3, 5, 7, 9],
        [2, 4, 6, 8],
      ]);
    });
  });

  describe('partitionWith', () => {
    it('should partitionWith empty Vector to tuple of empty Vectors', () => {
      const [l, r] = Vector.empty.partitionWith(() => Left(null));
      expect([l.toArray, r.toArray]).toEqual([[], []]);
    });

    it('should return left partitionWith', () => {
      const [l, r] = Vector(1, 2, 3).partitionWith(Left);
      expect([l.toArray, r.toArray]).toEqual([[1, 2, 3], []]);
    });

    it('should return right partitionWith', () => {
      const [l, r] = Vector(1, 2, 3).partitionWith(Right);
      expect([l.toArray, r.toArray]).toEqual([[], [1, 2, 3]]);
    });

    it('should make partitionWith of odd and even numbers', () => {
      const [l, r] = Vector(1, 2, 3, 4, 5, 6, 7, 8, 9).partitionWith(x =>
        x % 2 === 0 ? Right(x) : Left(x),
      );
      expect([l.toArray, r.toArray]).toEqual([
        [1, 3, 5, 7, 9],
        [2, 4, 6, 8],
      ]);
    });
  });

  describe('foldLeft', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return initial value on empty vector', () => {
      expect(Vector.empty.foldLeft(0, add)).toBe(0);
    });

    it('should sum all values of the vector', () => {
      expect(Vector(1, 2, 3, 4, 5).foldLeft(0, add)).toBe(15);
    });

    it('should be left associative', () => {
      expect(Vector(1, 2, 3).foldLeft('()', (r, a) => `(${r} ${a})`)).toBe(
        '(((() 1) 2) 3)',
      );
    });
  });

  describe('foldRight', () => {
    const add = (x: number, y: Eval<number>): Eval<number> => y.map(y => x + y);

    it('should return initial value on empty vector', () => {
      expect(Vector.empty.foldRight(Eval.zero, add).value).toBe(0);
    });

    it('should sum all values of the vector', () => {
      expect(Vector(1, 2, 3, 4, 5).foldRight(Eval.zero, add).value).toBe(15);
    });

    it('should be right associative', () => {
      expect(
        Vector(1, 2, 3).foldRight(Eval.now('()'), (r, a) =>
          a.map(a => `(${r} ${a})`),
        ).value,
      ).toBe('(1 (2 (3 ())))');
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldRight(Eval.zero, add).value).toEqual(
        [...new Array(10_000).keys()].reduce(
          (y, x) => y.map(y => x + y),
          Eval.zero,
        ).value,
      );
    });
  });

  describe('foldRight_', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return initial value on empty vector', () => {
      expect(Vector.empty.foldRight_(0, add)).toBe(0);
    });

    it('should sum all values of the vector', () => {
      expect(Vector(1, 2, 3, 4, 5).foldRight_(0, add)).toBe(15);
    });

    it('should be right associative', () => {
      expect(Vector(1, 2, 3).foldRight_('()', (r, a) => `(${r} ${a})`)).toBe(
        '(1 (2 (3 ())))',
      );
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldRight_(0, add)).toEqual(
        [...new Array(10_000).keys()].reduce(add, 0),
      );
    });
  });

  describe('scanLeft', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return an initial result when Vector is empty', () => {
      expect(Vector.empty.scanLeft(0, add)).toEqual(Vector(0));
    });

    it('should accumulate sums of the values', () => {
      expect(Vector(1, 2, 3).scanLeft(0, add).toArray).toEqual([0, 1, 3, 6]);
    });

    it('should be left associate', () => {
      expect(
        Vector(1, 2, 3).scanLeft('', (x, y) => `(${x} ${y})`).toArray,
      ).toEqual(['', '( 1)', '(( 1) 2)', '((( 1) 2) 3)']);
    });
  });

  describe('scanLeft1', () => {
    const add = (x: number, y: number): number => x + y;

    it('should throw error when vector is empty', () => {
      expect(() => Vector.empty.scanLeft1(add)).toThrow();
    });

    it('should accumulate sums of the values', () => {
      expect(Vector(1, 2, 3).scanLeft1(add).toArray).toEqual([1, 3, 6]);
    });

    it('should be left associate', () => {
      expect(
        Vector('1', '2', '3').scanLeft1((x, y) => `(${x} ${y})`).toArray,
      ).toEqual(['1', '(1 2)', '((1 2) 3)']);
    });
  });

  describe('scanRight', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return an initial result when list is empty', () => {
      expect(Vector.empty.scanRight(0, add)).toEqual(Vector(0));
    });

    it('should accumulate sums of the values', () => {
      expect(Vector(1, 2, 3).scanRight(0, add).toArray).toEqual([6, 5, 3, 0]);
    });

    it('should be right associate', () => {
      expect(
        Vector(1, 2, 3).scanRight('', (x, y) => `(${x} ${y})`).toArray,
      ).toEqual(['(1 (2 (3 )))', '(2 (3 ))', '(3 )', '']);
    });
  });

  describe('scanRight1', () => {
    const add = (x: number, y: number): number => x + y;

    it('should throw when vector is empty', () => {
      expect(() => Vector.empty.scanRight1(add)).toThrow();
    });

    it('should accumulate sums of the values', () => {
      expect(Vector(1, 2, 3).scanRight1(add).toArray).toEqual([6, 5, 3]);
    });

    it('should be right associate', () => {
      expect(
        Vector('1', '2', '3').scanRight1((x, y) => `(${x} ${y})`).toArray,
      ).toEqual(['(1 (2 3))', '(2 3)', '3']);
    });
  });

  describe('traverse', () => {
    it('should return empty list when empty', () => {
      expect(Vector().traverse(Identity.Applicative)(id)).toEqual(Vector.empty);
    });

    it('should invoke elements in order', () => {
      const arr: number[] = [];
      Vector(1, 2, 3, 4, 5).traverse(Identity.Applicative)(x => {
        arr.push(x);
        return x;
      });

      expect(arr).toEqual([1, 2, 3, 4, 5]);
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(200).keys()]);
      expect(xs.traverse(List.Applicative)(x => List(x)).head.toArray).toEqual(
        xs.toArray,
      );
    });
  });

  describe('Laws', () => {
    checkAll(
      'Align<Vector>',
      AlignSuite(Vector.Align).align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsVector,
        Vector.Eq,
      ),
    );

    checkAll(
      'Alternative<Vector>',
      AlternativeSuite(Vector.Alternative).alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsVector,
        Vector.Eq,
      ),
    );

    checkAll(
      'CoflatMap<Vector>',
      CoflatMapSuite(Vector.CoflatMap).coflatMap(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsVector,
        Vector.Eq,
      ),
    );

    checkAll(
      'Monad<Vector>',
      MonadSuite(Vector.Monad).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsVector,
        Vector.Eq,
      ),
    );

    checkAll(
      'TraversableFilter<Vector>',
      TraversableFilterSuite(Vector.TraversableFilter).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        Vector.FunctorFilter,
        Eval.Applicative,
        Eval.Applicative,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsVector,
        Vector.Eq,
        A.fp4tsEval,
        Eval.Eq,
        A.fp4tsEval,
        Eval.Eq,
      ),
    );
  });
});
