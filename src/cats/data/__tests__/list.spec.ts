import { id } from '../../../fp/core';
import { Left, Right } from '../either';
import { Option, Some, None } from '../option';
import { arrayApplicative } from '../array/instances';
import { List } from '../list';
import { primitiveEq } from '../../eq';

describe('List', () => {
  describe('type', () => {
    it('should be covariant', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const xs: List<number> = List.empty;
    });

    it('should disallow type expansion of unrelated types', () => {
      const xs: List<number> = List.empty;
      // @ts-expect-error
      xs.prepend('string');
    });
  });

  describe('constructors', () => {
    it('should an empty list', () => {
      const xs = List();
      expect(xs.isEmpty).toBe(true);
      expect(xs.toArray).toEqual([]);
    });

    it('should an empty list', () => {
      const xs = List.empty;
      expect(xs.isEmpty).toBe(true);
      expect(xs.toArray).toEqual([]);
    });

    it('should an empty list', () => {
      const xs = List(1, 2, 3);
      expect(xs.isEmpty).toBe(false);
      expect(xs.toArray).toEqual([1, 2, 3]);
    });

    it('should create a list from array', () => {
      const xs = List.fromArray([1, 2, 3]);
      expect(xs.toArray).toEqual([1, 2, 3]);
    });

    it('should create a list from array', () => {
      const xs = List.of(1, 2, 3);
      expect(xs.toArray).toEqual([1, 2, 3]);
    });
  });

  describe('accessors', () => {
    it('should return head of the list', () => {
      const xs = List(1, 2, 3);
      expect(xs.head).toEqual(1);
    });

    it('should throw an error when accessed a head of an empty list', () => {
      const fn = () => List.empty.head;
      expect(fn).toThrow();
    });

    it('should return tail of the list', () => {
      const xs = List(1, 2, 3);
      expect(xs.tail).toEqual(List(2, 3));
    });

    it('should calculate the size of the empty list to be zero', () => {
      expect(List.empty.size).toBe(0);
    });

    it('should calculate the size of the list', () => {
      expect(List(1, 2, 3, 4).size).toBe(4);
    });

    it('should return undefined when unconsing the empty list', () => {
      expect(List.empty.uncons).toEqual(None);
    });

    it('should return head and tail of the list', () => {
      expect(List(1).uncons).toEqual(Some([1, List.empty]));
    });
  });

  describe('headOption', () => {
    it('should return None when list is empty', () => {
      expect(List.empty.headOption).toEqual(None);
    });

    it('should return Some head when list is not empty', () => {
      expect(List(1, 2).headOption).toEqual(Some(1));
    });
  });

  describe('last', () => {
    it('should throw error on empty list', () => {
      expect(() => List.empty.last).toThrow();
    });

    it('should return Some last when list is not empty', () => {
      expect(List(1, 2).last).toEqual(2);
    });
  });

  describe('lastOption', () => {
    it('should return None when list is empty', () => {
      expect(List.empty.lastOption).toEqual(None);
    });

    it('should return Some last when list is not empty', () => {
      expect(List(1, 2).lastOption).toEqual(Some(2));
    });
  });

  describe('init', () => {
    it('should return an empty list when empty', () => {
      expect(List.empty.init).toEqual(List.empty);
    });

    it('should return a list without the last element', () => {
      expect(List(1, 2, 3).init).toEqual(List(1, 2));
    });
  });

  describe('equality', () => {
    const E = primitiveEq();
    test('two empty lists to be the same', () => {
      expect(List.empty.equals(E, List.empty)).toBe(true);
    });

    test('list with a single element not to be equal to empty list', () => {
      expect(List(1).notEquals(E, List.empty)).toBe(true);
    });

    test('empty list not to be equal to list with a single element', () => {
      expect(List.empty.notEquals(E, List(1))).toBe(true);
    });

    test('two lists identical lists to be equal', () => {
      expect(List(1, 2, 3).equals(E, List(1, 2, 3))).toBe(true);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.equals(E, xs)).toBe(true);
    });
  });

  describe('reverse', () => {
    it('should return an empty list', () => {
      expect(List.empty.reverse).toEqual(List.empty);
    });

    it('should reserve a list of single element', () => {
      expect(List(42).reverse).toEqual(List(42));
    });

    it('should reserve a list of three elements', () => {
      expect(List(1, 2, 3).reverse).toEqual(List(3, 2, 1));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.reverse.toArray).toEqual(
        [...new Array(10_000).keys()].reverse(),
      );
    });
  });

  describe('prepend', () => {
    it('should add a element to an empty list', () => {
      expect(List.empty.prepend(42)).toEqual(List(42));
    });

    it('should add a element to a list', () => {
      expect(List(1, 2).prepend(42)).toEqual(List(42, 1, 2));
    });
  });

  describe('concat', () => {
    it('should concat two empty lists into an empty list', () => {
      expect(List.empty['+++'](List.empty)).toEqual(List.empty);
    });

    it('should concat a list with empty list on lhs', () => {
      expect(List.empty['+++'](List(1, 2, 3))).toEqual(List(1, 2, 3));
    });

    it('should concat a list with empty list on rhs', () => {
      expect(List(1, 2, 3)['+++'](List.empty)).toEqual(List(1, 2, 3));
    });

    it('should concat two lists', () => {
      expect(List(1, 2, 3)['+++'](List(4, 5, 6))).toEqual(
        List(1, 2, 3, 4, 5, 6),
      );
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs['+++'](xs).toArray).toEqual([...xs.toArray, ...xs.toArray]);
    });
  });

  describe('elem', () => {
    it('should return first element of a single element list', () => {
      expect(List(42).elem(0)).toBe(42);
    });

    it('should return second element of a two element list', () => {
      expect(List(42, 43).elem(1)).toBe(43);
    });

    it('should throw when index out of bounds referenced', () => {
      expect(() => List(42, 43).elem(10000)).toThrow();
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.elem(9_999)).toBe(9_999);
    });
  });

  describe('all', () => {
    it('should return true when list is empty', () => {
      expect(List.empty.all(() => false)).toBe(true);
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
      expect(List.empty.any(() => true)).toBe(false);
    });

    it('should return true when all elements are odd', () => {
      expect(List(1, 3, 5).any(x => x % 2 === 0)).toBe(false);
    });

    it('should return false when one element is even', () => {
      expect(List(1, 3, 6).any(x => x % 2 === 0)).toBe(true);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()].map(() => false));
      expect(xs.any(id)).toBe(false);
    });
  });

  describe('count', () => {
    it('should return zero when list is empty', () => {
      expect(List.empty.count(() => true)).toBe(0);
    });

    it('should return 1 when 1 element is even', () => {
      expect(List(1, 2, 3).count(x => x % 2 === 0)).toBe(1);
    });

    it('should return 3 when all elements are even', () => {
      expect(List(2, 4, 6).count(x => x % 2 === 0)).toBe(3);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()].map(() => true));
      expect(xs.count(id)).toBe(10_000);
    });
  });

  describe('take', () => {
    it('should return an empty list when list is list is empty', () => {
      expect(List.empty.take(1)).toEqual(List.empty);
    });

    it('should return an empty list when 0 elements are taken', () => {
      expect(List(1, 2, 3).take(0)).toEqual(List.empty);
    });

    it('should return 1 element list if 1 element is taken', () => {
      expect(List(1, 2, 3).take(1)).toEqual(List(1));
    });

    it('should return entire list if entire list is taken', () => {
      expect(List(1, 2, 3).take(3)).toEqual(List(1, 2, 3));
    });

    it('should return entire list if more than size of the list is taken', () => {
      expect(List(1, 2, 3).take(1000)).toEqual(List(1, 2, 3));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.take(10_000).toArray).toEqual(xs.toArray);
    });
  });

  describe('takeRight', () => {
    it('should return an empty list when list is list is empty', () => {
      expect(List.empty.takeRight(1)).toEqual(List.empty);
    });

    it('should return an empty list when 0 elements are taken', () => {
      expect(List(1, 2, 3).takeRight(0)).toEqual(List.empty);
    });

    it('should return 2 elements list if 2 element are taken', () => {
      expect(List(1, 2, 3).takeRight(2)).toEqual(List(2, 3));
    });

    it('should return entire list if entire list is taken', () => {
      expect(List(1, 2, 3).takeRight(3)).toEqual(List(1, 2, 3));
    });

    it('should return entire list if more than size of the list is taken', () => {
      expect(List(1, 2, 3).takeRight(1000)).toEqual(List(1, 2, 3));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.takeRight(10_000).toArray).toEqual(xs.toArray);
    });
  });

  describe('drop', () => {
    it('should return an empty list when list is list is empty', () => {
      expect(List.empty.drop(1)).toEqual(List.empty);
    });

    it('should return an entire list when 0 elements are dropped', () => {
      expect(List(1, 2, 3).drop(0)).toEqual(List(1, 2, 3));
    });

    it('should drop a single element from list', () => {
      expect(List(1, 2, 3).drop(1)).toEqual(List(2, 3));
    });

    it('should return drop the entire length of the list', () => {
      expect(List(1, 2, 3).drop(3)).toEqual(List.empty);
    });

    it('should return an empty list if more than list size is dropped', () => {
      expect(List(1, 2, 3).drop(1000)).toEqual(List.empty);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.drop(10_000).toArray).toEqual([]);
    });
  });

  describe('dropRight', () => {
    it('should return an empty list when list is list is empty', () => {
      expect(List.empty.dropRight(1)).toEqual(List.empty);
    });

    it('should return an entire list when 0 elements are dropped', () => {
      expect(List(1, 2, 3).dropRight(0)).toEqual(List(1, 2, 3));
    });

    it('should drop a single element from list', () => {
      expect(List(1, 2, 3).dropRight(1)).toEqual(List(1, 2));
    });

    it('should return drop the entire length of the list', () => {
      expect(List(1, 2, 3).dropRight(3)).toEqual(List.empty);
    });

    it('should return an empty list if more than list size is dropped', () => {
      expect(List(1, 2, 3).dropRight(1000)).toEqual(List.empty);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.dropRight(10_000).toArray).toEqual([]);
    });
  });

  describe('slice', () => {
    it('should return an empty list if empty list is sliced', () => {
      expect(List.empty.slice(1, 2)).toEqual(List.empty);
    });

    it('should drop first element of the list', () => {
      expect(List(1, 2, 3, 4).slice(1, 1000)).toEqual(List(2, 3, 4));
    });

    it('should take first element of the list', () => {
      expect(List(1, 2, 3, 4).slice(0, 1)).toEqual(List(1));
    });

    it('should slice middle two elements of the list', () => {
      expect(List(1, 2, 3, 4).slice(1, 3)).toEqual(List(2, 3));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000)]);
      expect(xs.slice(2_500, 5_000).toArray).toEqual(
        [...new Array(10_000)].slice(2_500, 5_000),
      );
    });
  });

  describe('splitAt', () => {
    it('should return two empty lists when empty', () => {
      expect(List.empty.splitAt(0)).toEqual([List.empty, List.empty]);
    });

    it('should return empty lhs when split on negative index', () => {
      expect(List(1, 2, 3).splitAt(-1)).toEqual([List.empty, List(1, 2, 3)]);
    });

    it('should return singleton lhs when split on index 0', () => {
      expect(List(1, 2, 3).splitAt(0)).toEqual([List(1), List(2, 3)]);
    });

    it('should return singleton rhs when split on index 2', () => {
      expect(List(1, 2, 3).splitAt(2)).toEqual([List(1, 2), List(3)]);
    });

    it('should return empty rhs when split beyond the bounds of list', () => {
      expect(List(1, 2, 3).splitAt(1_000)).toEqual([List(1, 2, 3), List.empty]);
    });
  });

  describe('filter', () => {
    it('should return an empty list if empty list if filtered', () => {
      expect(List.empty.filter(() => true)).toEqual(List.empty);
    });

    it('should filter out odd elements', () => {
      expect(List(1, 2, 3, 4, 5).filter(x => x % 2 === 0)).toEqual(List(2, 4));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.filter(() => true).toArray).toEqual(xs.toArray);
    });
  });

  describe('map', () => {
    it('should return an empty list if empty list if mapped', () => {
      expect(List.empty.map(() => true)).toEqual(List.empty);
    });

    it('should double all of the elements', () => {
      expect(List(1, 2, 3).map(x => x * 2)).toEqual(List(2, 4, 6));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.map(id).toArray).toEqual(xs.toArray);
    });
  });

  describe('map', () => {
    it('should return an empty list if empty list if mapped', () => {
      expect(List.empty.map(() => true)).toEqual(List.empty);
    });

    it('should double all of the elements', () => {
      expect(List(1, 2, 3).map(x => x * 2)).toEqual(List(2, 4, 6));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.map(id).toArray).toEqual(xs.toArray);
    });
  });

  describe('flatMap', () => {
    it('should return an empty list if empty list if mapped', () => {
      expect(List.empty.flatMap(() => List(true))).toEqual(List.empty);
    });

    it('should return twice the double of all elements', () => {
      expect(List(1, 2, 3).flatMap(x => List(x * 2, x * 2))).toEqual(
        List(2, 2, 4, 4, 6, 6),
      );
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.flatMap(List).toArray).toEqual(xs.toArray);
    });
  });

  describe('fold', () => {
    it('should return false on an empty list', () => {
      expect(
        List.empty.fold(
          () => false,
          () => true,
        ),
      ).toBe(false);
    });

    it('should return true on an empty list', () => {
      expect(
        List(1).fold(
          () => false,
          () => true,
        ),
      ).toBe(true);
    });
  });

  describe('foldLeft', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return initial value on empty list', () => {
      expect(List.empty.foldLeft(0, add)).toBe(0);
    });

    it('should sum all values of the list', () => {
      expect(List(1, 2, 3, 4, 5).foldLeft(0, add)).toBe(15);
    });

    it('should be left associative', () => {
      expect(List(1, 2, 3).foldLeft('()', (r, a) => `(${r} ${a})`)).toBe(
        '(((() 1) 2) 3)',
      );
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldLeft(0, add)).toEqual(
        [...new Array(10_000).keys()].reduce(add, 0),
      );
    });
  });

  describe('foldLeft1', () => {
    const add = (x: number, y: number): number => x + y;

    it('should throw an error when list is empty', () => {
      expect(() => List.empty.foldLeft1(add)).toThrow();
    });

    it('should sum all values of the list', () => {
      expect(List(1, 2, 3, 4, 5).foldLeft1(add)).toBe(15);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldLeft1(add)).toEqual(
        [...new Array(10_000).keys()].reduce(add, 0),
      );
    });
  });

  describe('foldRight', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return initial value on empty list', () => {
      expect(List.empty.foldRight(0, add)).toBe(0);
    });

    it('should sum all values of the list', () => {
      expect(List(1, 2, 3, 4, 5).foldRight(0, add)).toBe(15);
    });

    it('should be right associative', () => {
      expect(List(1, 2, 3).foldRight('()', (r, a) => `(${r} ${a})`)).toBe(
        '(1 (2 (3 ())))',
      );
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldRight(0, add)).toEqual(
        [...new Array(10_000).keys()].reduce(add, 0),
      );
    });
  });

  describe('foldRight1', () => {
    const add = (x: number, y: number): number => x + y;

    it('should throw on empty list', () => {
      expect(() => List.empty.foldRight1(add)).toThrow();
    });

    it('should sum all values of the list', () => {
      expect(List(1, 2, 3, 4, 5).foldRight1(add)).toBe(15);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldRight1(add)).toEqual(
        [...new Array(10_000).keys()].reduce(add, 0),
      );
    });
  });

  describe('foldMap', () => {
    it('should produce an empty list out of empty list', () => {
      expect(
        List.empty.foldMap(List.MonoidK.algebra())(x => List(x, x)),
      ).toEqual(List.empty);
    });

    it('should produce double the number of elements', () => {
      expect(
        List(1, 2, 3).foldMap(List.MonoidK.algebra())(x => List(x, x)),
      ).toEqual(List(1, 1, 2, 2, 3, 3));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldMap(List.MonoidK.algebra())(x => List(x)).toArray).toEqual(
        xs.toArray,
      );
    });
  });

  describe('foldMapK', () => {
    it('should produce an empty list out of empty list', () => {
      expect(List.empty.foldMapK(List.MonoidK)(x => List(x, x))).toEqual(
        List.empty,
      );
    });

    it('should produce double the number of elements', () => {
      expect(List(1, 2, 3).foldMapK(List.MonoidK)(x => List(x, x))).toEqual(
        List(1, 1, 2, 2, 3, 3),
      );
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldMapK(List.MonoidK)(x => List(x)).toArray).toEqual(
        xs.toArray,
      );
    });
  });

  describe('zip', () => {
    it('should produce an empty list when zipped with empty list on lhs', () => {
      expect(List.empty.zip(List(42))).toEqual(List.empty);
    });

    it('should produce an empty list when zipped with empty list on rhs', () => {
      expect(List(42).zip(List.empty)).toEqual(List.empty);
    });

    it('should zip two single element lists', () => {
      expect(List(42).zip(List(43))).toEqual(List([42, 43]));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.zip(xs).toArray).toEqual(xs.toArray.map(x => [x, x]));
    });
  });

  describe('zipPad', () => {
    it('should fill default value on left', () => {
      expect(
        List.empty.zipPad(
          List(42),
          () => 1,
          () => 2,
        ),
      ).toEqual(List([1, 42]));
    });

    it('should fill default value on right', () => {
      expect(
        List(42).zipPad(
          List.empty,
          () => 1,
          () => 2,
        ),
      ).toEqual(List([42, 2]));
    });

    it('should zip two single element lists', () => {
      expect(
        List(42).zipPad(
          List(43),
          () => 1,
          () => 2,
        ),
      ).toEqual(List([42, 43]));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(
        xs.zipPad(
          xs,
          () => 1,
          () => 2,
        ).toArray,
      ).toEqual(xs.toArray.map(x => [x, x]));
    });
  });

  describe('zipWithIndex', () => {
    it('should produce an empty list out of empty list', () => {
      expect(List.empty.zipWithIndex).toEqual(List.empty);
    });

    it('should index the values in the list', () => {
      expect(List(1, 2, 3).zipWithIndex).toEqual(List([1, 0], [2, 1], [3, 2]));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.zipWithIndex.toArray).toEqual(xs.toArray.map(x => [x, x]));
    });
  });

  describe('zipWith', () => {
    const add = (x: number, y: number): number => x + y;

    it('should produce an empty list when zipped with empty list on lhs', () => {
      expect(List.empty.zipWith(List(42), add)).toEqual(List.empty);
    });

    it('should produce an empty list when zipped with empty list on rhs', () => {
      expect(List(42).zipWith(List.empty, add)).toEqual(List.empty);
    });

    it('should zip two single element lists', () => {
      expect(List(42).zipWith(List(43), add)).toEqual(List(85));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.zipWith(xs, add).toArray).toEqual(xs.toArray.map(x => x + x));
    });
  });

  describe('zipWithPad', () => {
    const add = (x: number, y: number): number => x + y;

    it('should fill default value on left', () => {
      expect(
        List.empty.zipWithPad(
          List(42),
          () => 1,
          () => 2,
          add,
        ),
      ).toEqual(List(43));
    });

    it('should fill default value on right', () => {
      expect(
        List(42).zipWithPad(
          List.empty,
          () => 1,
          () => 2,
          add,
        ),
      ).toEqual(List(44));
    });

    it('should zip two single element lists', () => {
      expect(
        List(42).zipWithPad(
          List(43),
          () => 1,
          () => 2,
          add,
        ),
      ).toEqual(List(85));
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(
        xs.zipWithPad(
          xs,
          () => 1,
          () => 2,
          add,
        ).toArray,
      ).toEqual(xs.toArray.map(x => x + x));
    });
  });

  describe('collect', () => {
    const collectEven = (n: number): Option<number> =>
      n % 2 === 0 ? Some(n) : None;

    it('should return an empty list out of empty list', () => {
      expect(List.empty.collect(collectEven)).toEqual(List.empty);
    });

    it('should collect even numbers', () => {
      expect(List(1, 2, 3, 4).collect(collectEven)).toEqual(List(2, 4));
    });

    it('should return an empty array', () => {
      expect(List(1, 3, 5).collect(collectEven)).toEqual(List.empty);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.collect(Some).toArray).toEqual(xs.toArray);
    });
  });

  describe('collectWhile', () => {
    const collectEven = (n: number): Option<number> =>
      n % 2 === 0 ? Some(n) : None;

    it('should return an empty list out of empty list', () => {
      expect(List.empty.collectWhile(collectEven)).toEqual(List.empty);
    });

    it('should collect prefix of even numbers', () => {
      expect(List(2, 3, 4).collectWhile(collectEven)).toEqual(List(2));
    });

    it('should return an empty array', () => {
      expect(List(1, 3, 5).collectWhile(collectEven)).toEqual(List.empty);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.collectWhile(Some).toArray).toEqual(xs.toArray);
    });
  });

  describe('partition', () => {
    it('should partition empty list to tuple of empty lists', () => {
      expect(List.empty.partition(() => Left(null))).toEqual([
        List.empty,
        List.empty,
      ]);
    });

    it('should return left partition', () => {
      expect(List(1, 2, 3).partition(Left)).toEqual([
        List(1, 2, 3),
        List.empty,
      ]);
    });

    it('should return right partition', () => {
      expect(List(1, 2, 3).partition(Right)).toEqual([
        List.empty,
        List(1, 2, 3),
      ]);
    });

    it('should make partition of odd and even numbers', () => {
      expect(
        List(1, 2, 3, 4, 5, 6, 7, 8, 9).partition(x =>
          x % 2 === 0 ? Right(x) : Left(x),
        ),
      ).toEqual([List(1, 3, 5, 7, 9), List(2, 4, 6, 8)]);
    });
  });

  describe('scanLeft', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return an initial result when list is empty', () => {
      expect(List.empty.scanLeft(0, add)).toEqual(List(0));
    });

    it('should accumulate sums of the values', () => {
      expect(List(1, 2, 3).scanLeft(0, add)).toEqual(List(0, 1, 3, 6));
    });

    it('should be left associate', () => {
      expect(List(1, 2, 3).scanLeft('', (x, y) => `(${x} ${y})`)).toEqual(
        List('', '( 1)', '(( 1) 2)', '((( 1) 2) 3)'),
      );
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.scanLeft(0, (_, x) => x).toArray).toEqual([0, ...xs.toArray]);
    });
  });

  describe('scanLeft1', () => {
    const add = (x: number, y: number): number => x + y;

    it('should throw error when list is empty', () => {
      expect(() => List.empty.scanLeft1(add)).toThrow();
    });

    it('should accumulate sums of the values', () => {
      expect(List(1, 2, 3).scanLeft1(add)).toEqual(List(1, 3, 6));
    });

    // TODO: Fix
    // it('should be left associate', () => {
    //   expect(List(1, 2, 3).scanLeft1((x, y) => `(${x} ${y})`)).toEqual(
    //     List('1', '(1 2)', '((1 2) 3)'),
    //   );
    // });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.scanLeft1((_, x) => x).toArray).toEqual(xs.toArray);
    });
  });

  describe('scanRight', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return an initial result when list is empty', () => {
      expect(List.empty.scanRight(0, add)).toEqual(List(0));
    });

    it('should accumulate sums of the values', () => {
      expect(List(1, 2, 3).scanRight(0, add)).toEqual(List(6, 5, 3, 0));
    });

    it('should be left associate', () => {
      expect(List(1, 2, 3).scanRight('', (x, y) => `(${x} ${y})`)).toEqual(
        List('(1 (2 (3 )))', '(2 (3 ))', '(3 )', ''),
      );
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.scanRight(0, x => x).toArray).toEqual([...xs.toArray, 0]);
    });
  });

  describe('scanRight1', () => {
    const add = (x: number, y: number): number => x + y;

    it('should throw when list is empty', () => {
      expect(() => List.empty.scanRight1(add)).toThrow();
    });

    it('should accumulate sums of the values', () => {
      expect(List(1, 2, 3).scanRight1(add)).toEqual(List(6, 5, 3));
    });

    // TODO: Fix types
    // it('should be left associate', () => {
    //   expect(List(1, 2, 3).scanRight1((x, y) => `(${x} ${y})`)).toEqual(
    //     List('(1 (2 (3 )))', '(2 (3 ))', '(3 )', ''),
    //   );
    // });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.scanRight1(x => x).toArray).toEqual(xs.toArray);
    });
  });

  describe('traverse & sequence', () => {
    // it('should map list of numbers to array of a single list', () => {
    //   expect(
    //     List(1, 2, 3)
    //       .map(x => [x])
    //       .sequence(arrayApplicative()),
    //   ).toEqual([List(1, 2, 3)]);
    // });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(xs.traverse(arrayApplicative())(x => [x])[0].toArray).toEqual(
        xs.toArray,
      );
    });
  });

  describe('flatTraverse & flatSequence', () => {
    // it('should map list of numbers to array of a single list', () => {
    //   expect(
    //     List(1, 2, 3)
    //       .map(x => [List(x)])
    //       .flatSequence(arrayApplicative()),
    //   ).toEqual([List(1, 2, 3)]);
    // });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(
        xs.flatTraverse(arrayApplicative())(x => [List(x)])[0].toArray,
      ).toEqual(xs.toArray);
    });

    it('should be stack safe', () => {
      const xs = List.fromArray([...new Array(10_000).keys()]);
      expect(
        xs.flatTraverse(arrayApplicative())(x => [List(x)])[0].toArray,
      ).toEqual(xs.toArray);
    });
  });

  describe('show', () => {
    it('should show empty list', () => {
      expect(List.empty.show()).toBe('[]');
    });

    it('should show list of primitive values', () => {
      expect(List(1, 2, 3).show()).toBe('[1, 2, 3]');
    });

    it('should show list of complex', () => {
      expect(
        List<[number, number]>([1, 1], [2, 2], [3, 3]).show({
          show: ([x, y]) => `(${x}, ${y})`,
        }),
      ).toBe('[(1, 1), (2, 2), (3, 3)]');
    });
  });

  describe('monad', () => {
    it('should create a list of one element', () => {
      const xs = List.pure(1);
      expect(xs).toEqual(List(1));
    });

    test('left identity', () => {
      const h = (x: number): List<number> => List(x * 2);
      expect(List.pure(42).flatMap(h)).toEqual(h(42));
    });

    test('right identity', () => {
      expect(List(1, 2, 3, 4).flatMap(List.pure)).toEqual(List(1, 2, 3, 4));
    });

    test('associativity', () => {
      const h = (n: number): List<number> => List(n * 2);
      const g = (n: number): List<number> => List(n, n);
      const m = List(1, 2, 3);
      expect(m.flatMap(h).flatMap(g)).toEqual(m.flatMap(x => h(x).flatMap(g)));
    });
  });
});
