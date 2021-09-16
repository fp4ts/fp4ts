import { Some, None } from '../option';
import { List } from '../collections/list';
import { FingerTree } from '../collections/finger-tree';

describe('FingerTree', () => {
  describe('type', () => {
    it('should be covariant', () => {
      const o: FingerTree<number> = FingerTree.empty;
    });

    it('should disallow unrelated type widening', () => {
      const o: FingerTree<number> = FingerTree.empty;

      // @ts-expect-error
      o.prepend('some-string');
    });
  });

  describe('constructors', () => {
    it('should create finger tree from an array', () => {
      expect(FingerTree.fromArray([1, 2, 3, 4, 5]).toArray).toEqual([
        1, 2, 3, 4, 5,
      ]);
    });

    it('should create a finger tree from list', () => {
      expect(FingerTree.fromList(List(1, 2, 3, 4, 5)).toList).toEqual(
        List(1, 2, 3, 4, 5),
      );
    });

    test('empty finger tree to be empty', () => {
      expect(FingerTree.empty.isEmpty).toBe(true);
    });

    test('singleton finger tree not to be empty', () => {
      expect(FingerTree.singleton(1).nonEmpty).toBe(true);
    });
  });

  describe('head', () => {
    it('should throw when tree is empty', () => {
      expect(() => FingerTree.empty.head).toThrow();
    });

    it('should return head of the finger tree', () => {
      expect(FingerTree(1, 2).head).toBe(1);
    });
  });

  describe('headOption', () => {
    it('should return None when tree is empty', () => {
      expect(FingerTree.empty.headOption).toEqual(None);
    });

    it('should return Some head when tree is not empty', () => {
      expect(FingerTree(1, 2).headOption).toEqual(Some(1));
    });
  });

  describe('last', () => {
    it('should throw error on empty finger tree', () => {
      expect(() => FingerTree.empty.last).toThrow();
    });

    it('should return Some last when tree is not empty', () => {
      expect(FingerTree(1, 2).last).toEqual(2);
    });
  });

  describe('lastOption', () => {
    it('should return None when list is empty', () => {
      expect(FingerTree.empty.lastOption).toEqual(None);
    });

    it('should return Some last when list is not empty', () => {
      expect(FingerTree(1, 2).lastOption).toEqual(Some(2));
    });
  });

  describe('tail', () => {
    it('should return an empty list when empty', () => {
      expect(FingerTree.empty.tail).toEqual(FingerTree.empty);
    });

    it('should return a list without the first element', () => {
      expect(FingerTree(1, 2, 3).tail.toArray).toEqual(
        FingerTree(2, 3).toArray,
      );
    });
  });

  describe('init', () => {
    it('should return an empty finger tree when empty', () => {
      expect(FingerTree.empty.init).toEqual(FingerTree.empty);
    });

    it('should return a finger tree without the last element', () => {
      expect(FingerTree(1, 2, 3).init.toArray).toEqual(
        FingerTree(1, 2).toArray,
      );
    });
  });

  describe('popHead', () => {
    it('should return None when tree is empty', () => {
      expect(FingerTree.empty.popHead).toEqual(None);
    });

    it('should pop head of a singleton finger tree', () => {
      expect(FingerTree(42).popHead).toEqual(Some([42, FingerTree.empty]));
    });

    it('should pop head of a finger tree', () => {
      const [hd, tl] = FingerTree(1, 2, 3, 4, 5).popHead.get;
      expect([hd, tl.toArray]).toEqual([1, [2, 3, 4, 5]]);
    });
  });

  describe('popLast', () => {
    it('should return None when tree is empty', () => {
      expect(FingerTree.empty.popLast).toEqual(None);
    });

    it('should pop lst element of a singleton finger tree', () => {
      expect(FingerTree(42).popLast).toEqual(Some([42, FingerTree.empty]));
    });

    it('should pop last element of a finger tree', () => {
      const [l, init] = FingerTree(1, 2, 3, 4, 5).popLast.get;
      expect([l, init.toArray]).toEqual([5, [1, 2, 3, 4]]);
    });
  });

  describe('prepend', () => {
    it('should prepend an element to an empty finger tree', () => {
      expect(FingerTree.empty.prepend(42)).toEqual(FingerTree(42));
    });

    it('should add an additional element to the head of the finger tree', () => {
      expect(FingerTree(1, 2, 3, 4).prepend(0).toArray).toEqual(
        FingerTree(0, 1, 2, 3, 4).toArray,
      );
    });

    it('should prepend multiple elements', () => {
      expect(FingerTree.empty.prepend(0).prepend(1).prepend(2).toArray).toEqual(
        [2, 1, 0],
      );
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const v = xs.reduce(
        (xs, x) => xs.prepend(x),
        FingerTree.empty as FingerTree<number>,
      );

      expect(v.toArray).toEqual(xs.reverse());
    });
  });

  describe('append', () => {
    it('should append an element to an empty finger tree', () => {
      expect(FingerTree.empty.append(42)).toEqual(FingerTree(42));
    });

    it('should add an additional element to the head of the finger tree', () => {
      expect(FingerTree(1, 2, 3, 4).append(0).toArray).toEqual(
        FingerTree(1, 2, 3, 4, 0).toArray,
      );
    });

    it('should append multiple elements', () => {
      expect(FingerTree.empty.append(0).append(1).append(2).toArray).toEqual([
        0, 1, 2,
      ]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const v = xs.reduce(
        (xs, x) => xs.append(x),
        FingerTree.empty as FingerTree<number>,
      );

      expect(v.toArray).toEqual(xs);
    });
  });

  describe('concat', () => {
    it('should concat two empty finger trees into an empty finger tree', () => {
      expect(FingerTree.empty.concat(FingerTree.empty)).toEqual(
        FingerTree.empty,
      );
    });

    it('should return rhs when lhs empty', () => {
      expect(FingerTree.empty['+++'](FingerTree(1, 2, 3)).toArray).toEqual(
        FingerTree(1, 2, 3).toArray,
      );
    });

    it('should return lhs when rhs empty', () => {
      expect(FingerTree(1, 2, 3)['+++'](FingerTree.empty).toArray).toEqual(
        FingerTree(1, 2, 3).toArray,
      );
    });

    it('should concatenate two finger trees', () => {
      expect(FingerTree(1, 2, 3)['+++'](FingerTree(4, 5, 6)).toArray).toEqual(
        FingerTree(1, 2, 3, 4, 5, 6).toArray,
      );
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const vx = FingerTree.fromArray(xs);

      expect(vx['+++'](vx).toArray).toEqual([...xs, ...xs]);
    });
  });

  describe('foldLeft', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return initial value on empty finger tree', () => {
      expect(FingerTree.empty.foldLeft(0, add)).toBe(0);
    });

    it('should sum all values of the finger tree', () => {
      expect(FingerTree(1, 2, 3, 4, 5).foldLeft(0, add)).toBe(15);
    });

    it('should be left associative', () => {
      expect(FingerTree(1, 2, 3).foldLeft('()', (r, a) => `(${r} ${a})`)).toBe(
        '(((() 1) 2) 3)',
      );
    });

    it('should be stack safe', () => {
      const xs = FingerTree.fromArray([...new Array(10_000).keys()]);
      expect(xs.foldLeft(0, add)).toEqual(
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
});
