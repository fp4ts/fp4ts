import { Some, None } from '../option';
import { List } from '../collections/list';
import { Vector } from '../collections/vector';
import { id } from '../../../core';

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
      expect(Vector.singleton(1).nonEmpty).toBe(true);
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
      expect(Vector.empty.prepend(0).prepend(1).prepend(2).toArray).toEqual([
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
      expect(Vector.empty.append(0).append(1).append(2).toArray).toEqual([
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
      expect(xs.flatMap(Vector).toArray).toEqual(xs.toArray);
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

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldLeft(0, add)).toEqual(
        [...new Array(10_000).keys()].reduce(add, 0),
      );
    });
  });

  describe('foldRight', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return initial value on empty vector', () => {
      expect(Vector.empty.foldRight(0, add)).toBe(0);
    });

    it('should sum all values of the vector', () => {
      expect(Vector(1, 2, 3, 4, 5).foldRight(0, add)).toBe(15);
    });

    it('should be right associative', () => {
      expect(Vector(1, 2, 3).foldRight('()', (r, a) => `(${r} ${a})`)).toBe(
        '(1 (2 (3 ())))',
      );
    });

    it('should be stack safe', () => {
      const xs = Vector.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldRight(0, add)).toEqual(
        [...new Array(10_000).keys()].reduce(add, 0),
      );
    });
  });
});
