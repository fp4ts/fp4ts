import { Monoid } from '../../monoid';
import { Some, None } from '../option';
import { List } from '../collections/list';
import { FingerTree } from '../collections/finger-tree';
import { Measured } from '../collections/finger-tree/measured';
import { fingerTreeMeasured } from '../collections/finger-tree/instances';

describe('FingerTree', () => {
  type Empty = void;
  const EmptyMonoid: Monoid<Empty> = {
    empty: undefined,
    combine: () => () => undefined,
    combine_: () => undefined,
  };
  const EmptyMeasured: Measured<any, any> = {
    monoid: EmptyMonoid,
    measure: () => undefined,
  };

  const M = EmptyMeasured;

  describe('type', () => {
    it('should be covariant', () => {
      const o: FingerTree<any, number> = FingerTree.empty<Empty>();
    });

    it('should disallow unrelated type widening', () => {
      const o: FingerTree<any, number> = FingerTree.empty<Empty>();

      // @ts-expect-error
      o.prepend(M)('some-string');
    });
  });

  describe('constructors', () => {
    it('should create finger tree from an array', () => {
      expect(FingerTree.fromArray(M)([1, 2, 3, 4, 5]).toArray).toEqual([
        1, 2, 3, 4, 5,
      ]);
    });

    it('should create a finger tree from list', () => {
      expect(FingerTree.fromList(M)(List(1, 2, 3, 4, 5)).toList).toEqual(
        List(1, 2, 3, 4, 5),
      );
    });

    test('empty finger tree to be empty', () => {
      expect(FingerTree.empty<Empty>().isEmpty).toBe(true);
    });

    test('singleton finger tree not to be empty', () => {
      expect(FingerTree.singleton(1).nonEmpty).toBe(true);
    });
  });

  describe('head', () => {
    it('should throw when tree is empty', () => {
      expect(() => FingerTree.empty<Empty>().head(M)).toThrow();
    });

    it('should return head of the finger tree', () => {
      expect(FingerTree(M)(1, 2).head(M)).toBe(1);
    });
  });

  describe('headOption', () => {
    it('should return None when tree is empty', () => {
      expect(FingerTree.empty<Empty>().headOption(M)).toEqual(None);
    });

    it('should return Some head when tree is not empty', () => {
      expect(FingerTree(M)(1, 2).headOption(M)).toEqual(Some(1));
    });
  });

  describe('last', () => {
    it('should throw error on empty finger tree', () => {
      expect(() => FingerTree.empty<Empty>().last(M)).toThrow();
    });

    it('should return Some last when tree is not empty', () => {
      expect(FingerTree(M)(1, 2).last(M)).toEqual(2);
    });
  });

  describe('lastOption', () => {
    it('should return None when list is empty', () => {
      expect(FingerTree.empty<Empty>().lastOption(M)).toEqual(None);
    });

    it('should return Some last when list is not empty', () => {
      expect(FingerTree(M)(1, 2).lastOption(M)).toEqual(Some(2));
    });
  });

  describe('tail', () => {
    it('should return an empty list when empty', () => {
      expect(FingerTree.empty<Empty>().tail(M)).toEqual(FingerTree.empty());
    });

    it('should return a list without the first element', () => {
      expect(FingerTree(M)(1, 2, 3).tail(M).toArray).toEqual(
        FingerTree(M)(2, 3).toArray,
      );
    });
  });

  describe('init', () => {
    it('should return an empty finger tree when empty', () => {
      expect(FingerTree.empty<Empty>().init(M)).toEqual(FingerTree.empty());
    });

    it('should return a finger tree without the last element', () => {
      expect(FingerTree(M)(1, 2, 3).init(M).toArray).toEqual(
        FingerTree(M)(1, 2).toArray,
      );
    });
  });

  describe('popHead', () => {
    it('should return None when tree is empty', () => {
      expect(FingerTree.empty<Empty>().popHead(M)).toEqual(None);
    });

    it('should pop head of a singleton finger tree', () => {
      expect(FingerTree(M)(42).popHead(M)).toEqual(
        Some([42, FingerTree.empty()]),
      );
    });

    it('should pop head of a finger tree', () => {
      const [hd, tl] = FingerTree(M)(1, 2, 3, 4, 5).popHead(M).get;
      expect([hd, tl.toArray]).toEqual([1, [2, 3, 4, 5]]);
    });
  });

  describe('popLast', () => {
    it('should return None when tree is empty', () => {
      expect(FingerTree.empty<Empty>().popLast(M)).toEqual(None);
    });

    it('should pop lst element of a singleton finger tree', () => {
      expect(FingerTree(M)(42).popLast(M)).toEqual(
        Some([42, FingerTree.empty()]),
      );
    });

    it('should pop last element of a finger tree', () => {
      const [l, init] = FingerTree(M)(1, 2, 3, 4, 5).popLast(M).get;
      expect([l, init.toArray]).toEqual([5, [1, 2, 3, 4]]);
    });
  });

  describe('prepend', () => {
    it('should prepend an element to an empty finger tree', () => {
      // @ts-ignore
      expect(FingerTree.empty<Empty>().prepend(M)(42)).toEqual(
        FingerTree(M)(42),
      );
    });

    it('should add an additional element to the head of the finger tree', () => {
      expect(FingerTree(M)(1, 2, 3, 4).prepend(M)(0).toArray).toEqual(
        FingerTree(M)(0, 1, 2, 3, 4).toArray,
      );
    });

    it('should prepend multiple elements', () => {
      expect(
        // @ts-ignore
        FingerTree.empty<Empty>().prepend(M)(0).prepend(M)(1).prepend(M)(2)
          .toArray,
      ).toEqual([2, 1, 0]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const v = xs.reduce(
        (xs, x) => xs.prepend(M)(x),
        FingerTree.empty() as FingerTree<Empty, number>,
      );

      expect(v.toArray).toEqual(xs.reverse());
    });
  });

  describe('append', () => {
    it('should append an element to an empty finger tree', () => {
      // @ts-ignore
      expect(FingerTree.empty<Empty>().append(M)(42)).toEqual(
        FingerTree(M)(42),
      );
    });

    it('should add an additional element to the head of the finger tree', () => {
      expect(FingerTree(M)(1, 2, 3, 4).append(M)(0).toArray).toEqual(
        FingerTree(M)(1, 2, 3, 4, 0).toArray,
      );
    });

    it('should append multiple elements', () => {
      expect(
        // @ts-ignore
        FingerTree.empty<Empty>().append(M)(0).append(M)(1).append(M)(2)
          .toArray,
      ).toEqual([0, 1, 2]);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const v = xs.reduce(
        (xs, x) => xs.append(M)(x),
        FingerTree.empty() as FingerTree<Empty, number>,
      );

      expect(v.toArray).toEqual(xs);
    });
  });

  describe('concat', () => {
    it('should concat two empty finger trees into an empty finger tree', () => {
      expect(FingerTree.empty<Empty>().concat(M)(FingerTree.empty())).toEqual(
        FingerTree.empty(),
      );
    });

    it('should return rhs when lhs empty', () => {
      expect(
        // @ts-ignore
        FingerTree.empty().concat(M)(FingerTree(M)(1, 2, 3)).toArray,
      ).toEqual(FingerTree(M)(1, 2, 3).toArray);
    });

    it('should return lhs when rhs empty', () => {
      expect(
        FingerTree(M)(1, 2, 3).concat(M)(FingerTree.empty()).toArray,
      ).toEqual(FingerTree(M)(1, 2, 3).toArray);
    });

    it('should concatenate two finger trees', () => {
      expect(
        FingerTree(M)(1, 2, 3).concat(M)(FingerTree(M)(4, 5, 6)).toArray,
      ).toEqual(FingerTree(M)(1, 2, 3, 4, 5, 6).toArray);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const vx = FingerTree.fromArray(M)(xs);

      expect(vx.concat(M)(vx).toArray).toEqual([...xs, ...xs]);
    });
  });

  describe('splitAt', () => {
    it('should return none when tree is empty', () => {
      expect(FingerTree.empty().splitAt(M)(undefined, () => true)).toEqual(
        None,
      );
    });

    it('should split on the first element', () => {
      const [before, x, after] = FingerTree(M)(1, 2, 3).splitAt(M)(
        undefined,
        () => true,
      ).get;

      expect([before.toArray, x, after.toArray]).toEqual([[], 1, [2, 3]]);
    });

    it('should return None when predicate never evaluates', () => {
      expect(FingerTree(M)(1, 2, 3).splitAt(M)(undefined, () => false)).toEqual(
        None,
      );
    });
  });

  describe('foldLeft', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return initial value on empty finger tree', () => {
      expect(FingerTree.empty<Empty>().foldLeft(0, add)).toBe(0);
    });

    it('should sum all values of the finger tree', () => {
      expect(FingerTree(M)(1, 2, 3, 4, 5).foldLeft(0, add)).toBe(15);
    });

    it('should be left associative', () => {
      expect(
        FingerTree(M)(1, 2, 3).foldLeft('()', (r, a) => `(${r} ${a})`),
      ).toBe('(((() 1) 2) 3)');
    });

    it('should be stack safe', () => {
      const xs = FingerTree.fromArray(M)([...new Array(10_000).keys()]);
      expect(xs.foldLeft(0, add)).toEqual(
        [...new Array(10_000).keys()].reduce(add, 0),
      );
    });
  });

  describe('foldRight', () => {
    const add = (x: number, y: number): number => x + y;

    it('should return initial value on empty list', () => {
      expect(FingerTree.empty().foldRight(0, add)).toBe(0);
    });

    it('should sum all values of the list', () => {
      expect(FingerTree(M)(1, 2, 3, 4, 5).foldRight(0, add)).toBe(15);
    });

    it('should be right associative', () => {
      expect(
        FingerTree(M)(1, 2, 3).foldRight('()', (r, a) => `(${r} ${a})`),
      ).toBe('(1 (2 (3 ())))');
    });

    it('should be stack safe', () => {
      const xs = FingerTree.fromArray(M)([...new Array(10_000).keys()]);
      expect(xs.foldRight(0, add)).toEqual(
        [...new Array(10_000).keys()].reduce(add, 0),
      );
    });
  });

  describe('measurements', () => {
    type Size = number;
    const sizeMonoid: Monoid<Size> = {
      empty: 0,
      combine: y => x => x + y,
      combine_: (x, y) => x + y,
    };

    const sizeMeasured = <A>(): Measured<A, Size> => ({
      monoid: sizeMonoid,
      // all elements are counted only once
      measure: () => 1,
    });

    const S = sizeMeasured();
    const xs = [...new Array(10_000).keys()];
    const t = FingerTree(sizeMeasured<number>())(...xs);

    it('should calculate size', () => {
      expect(fingerTreeMeasured<Size, number>(sizeMeasured()).measure(t)).toBe(
        10_000,
      );
    });

    it('should return value on index 0', () => {
      const [head, x, tail] = FingerTree(S)(1, 2, 3, 4, 5).splitAt(S)(
        0,
        x => x > 0,
      ).get;

      expect([head.toArray, x, tail.toArray]).toEqual([[], 1, [2, 3, 4, 5]]);
    });

    it('should return value on index 2', () => {
      const [head, x, tail] = FingerTree(S)(1, 2, 3, 4, 5).splitAt(S)(
        0,
        x => x > 2,
      ).get;

      expect([head.toArray, x, tail.toArray]).toEqual([[1, 2], 3, [4, 5]]);
    });

    it('should last element of the array', () => {
      const [head, x, tail] = FingerTree(S)(1, 2, 3, 4, 5).splitAt(S)(
        0,
        x => x > 4,
      ).get;

      expect([head.toArray, x, tail.toArray]).toEqual([[1, 2, 3, 4], 5, []]);
    });

    it('should return none when indexed out out bounds', () => {
      expect(
        FingerTree(S)(1, 2, 3, 4, 5).splitAt(S)(0, x => x > 10000),
      ).toEqual(None);
    });

    it('should be stack safe for the splitAt', () => {
      const xs = [...new Array(10_000).keys()];
      const ft = FingerTree.fromArray(S)(xs);

      const rs = xs.map(idx => ft.splitAt(S)(0, x => x > idx).get[1]);
      expect(rs).toEqual(xs);
    });
  });
});
