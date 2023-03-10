// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Applicative,
  CommutativeMonoid,
  CommutativeSemigroup,
  Compare,
  Eq,
  Foldable,
  Iter,
  Monoid,
  MonoidK,
  None,
  Option,
  Ord,
  Some,
} from '@fp4ts/cats';
import {
  $type,
  cached,
  constant,
  Eval,
  id,
  Kind,
  lazy,
  throwError,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { List } from './list';
import { View } from './view';

/**
 * Immutable, strict, finite set of values `A`.
 *
 * Port of Haskell's [Data.Set](https://hackage.haskell.org/package/containers-0.6.7/docs/src/Data.Set.Internal.html)
 */
export type OrdSet<A> = _OrdSet<A>;
export const OrdSet = function <A>(...xs: A[]): OrdSet<A> {
  return OrdSet.fromArray(xs);
};

/**
 * _O(1)_ Creates an empty `OrdSet`.
 *
 * ```typescript
 * > OrdSet.empty
 * // OrdSet()
 * ```
 */
OrdSet.empty = null as any as OrdSet<never>; // defined below

function singleton<A>(a: A): OrdSet<A> {
  return new Bin(1, a, Empty, Empty);
}

/**
 * _O(1)_ Creates a set with a single element.
 *
 * ```typescript
 * > OrdSet.singleton(1, 'a')
 * // OrdSet([1, 'a'])
 * ```
 */
OrdSet.singleton = singleton;

// -- Construction from arrays

/**
 * _O(n * log(n))_ Build a set from an array. If the values in the array are ordered,
 * linear-time (_O(n)_) implementation is used instead.
 *
 * @see {@link OrdSet.fromArrayWith} for a building array with a custom combining
 *                                   function
 * @see {@link OrdSet.fromDistinctAscArray}
 *
 * @examples
 *
 * ```typescript
 * > OrdSet.fromArray([])
 * // OrdSet()
 *
 * > OrdSet.fromArray([5, 3, 5])
 * // OrdSet(3, 5)
 *
 * > OrdSet.fromArray([5, 3, 7])
 * // OrdSet(3, 5, 7)
 * ```
 */
OrdSet.fromArray = <A>(
  xs: readonly A[],
  O: Ord<A> = Ord.fromUniversalCompare(),
): OrdSet<A> => {
  switch (xs.length) {
    case 0:
      return Empty;
    case 1:
      return new Bin(1, xs[0], Empty, Empty);
    default: {
      let i = 0;
      for (let l = xs.length - 1; i < l; i++) {
        if (O.gte(xs[i], xs[i + 1])) {
          return _fromArray(fromDistinctAscArray(xs, 0, i), xs, i, O);
        }
      }
      return fromDistinctAscArray(xs, 0, xs.length);
    }
  }
};

function _fromArray<A>(
  t: OrdSet<A>,
  xs: readonly A[],
  start: number,
  O: Ord<A>,
): OrdSet<A> {
  for (let i = start, l = xs.length; i < l; i++) {
    t = t.insert(xs[i], O);
  }
  return t;
}

/**
 * _O(n)_ Builds a set from an array of values which are already in an ascending
 * order.
 *
 * @see {@link OrdSet.fromDistinctDescArray} for array with keys in descending order
 * @see {@link OrdSet.fromArray} for array with keys in no particular order
 */
OrdSet.fromDistinctAscArray = <A>(xs0: readonly A[]): OrdSet<A> =>
  fromDistinctAscArray(xs0, 0, xs0.length);

function fromDistinctAscArray<A>(
  xs: readonly A[],
  start: number,
  end: number,
): OrdSet<A> {
  if (start >= end) return Empty;
  if (end - start === 1) return new Bin(1, xs[start], Empty, Empty);

  const middle = ((start + end) / 2) | 0;
  const lhs = fromDistinctAscArray(xs, start, middle);
  const rhs = fromDistinctAscArray(xs, middle + 1, end);
  return mkBin(xs[middle], lhs, rhs);
}

/**
 * _O(n)_ Builds a set from an array which elements are in descending order.
 *
 * @see {@link Ord.fromDistinctAscArray} for array with keys in ascending order
 * @see {@link Ord.fromArray} for array with keys in no particular order
 */
OrdSet.fromDistinctDescArray = <A>(xs0: readonly A[]): OrdSet<A> =>
  fromDistinctDescArray(xs0, 0, xs0.length);

function fromDistinctDescArray<A>(
  xs: readonly A[],
  start: number,
  end: number,
): OrdSet<A> {
  if (start >= end) return Empty;
  if (end - start === 1) {
    return new Bin(1, xs[start], Empty, Empty);
  }

  const middle = ((start + end) / 2) | 0;
  const rhs = fromDistinctDescArray(xs, start, middle);
  const lhs = fromDistinctDescArray(xs, middle + 1, end);
  return mkBin(xs[middle], lhs, rhs);
}

/**
 * _O(n * log(n))_ Build a set from a {@link List}. If the vales in the List are
 * ordered, linear-time (_O(n)_) implementation is used instead.
 *
 * @examples
 *
 * ```typescript
 * > OrdSet.fromArray(List.empty)
 * // OrdSet()
 *
 * > OrdSet.fromArray(List(5, 3, 5))
 * // OrdSet(3, 5)
 * ```
 */
OrdSet.fromList = <A>(
  xs: List<A>,
  O: Ord<A> = Ord.fromUniversalCompare(),
): OrdSet<A> => {
  if (xs.isEmpty) return Empty;
  const x = xs.head;
  if (xs.tail.isEmpty) return new Bin(1, x, Empty, Empty);
  if (O.gte(x, xs.tail.head)) return _fromList(Empty as OrdSet<A>, xs, O);

  let s = 1;
  let t: OrdSet<A> = new Bin(1, x, Empty, Empty);
  xs = xs.tail;

  while (xs.tail.nonEmpty) {
    const x = xs.head;
    if (notOrdered(x, xs.tail, O)) return _fromList(t, xs, O);
    const { fst, snd, thr } = createList(s, xs.tail, O);
    if (snd.isEmpty) return _fromList(_link(x, t, fst), thr, O);

    s = s << 1;
    t = _link(x, t, fst);
    xs = snd;
  }
  const y = xs.head;
  return _insertMax(y, t);
};

const _fromList = <A>(z: OrdSet<A>, xs: List<A>, O: Ord<A>): OrdSet<A> =>
  xs.foldLeft(z, (m, x) => m.insert(x, O));

const notOrdered = <A>(x: A, kvs: List<A>, O: Ord<A>): boolean =>
  kvs.isEmpty ? false : O.gte(x, kvs.head);

type Triple<A, B, C> = { fst: A; snd: B; thr: C };
const Triple = <A, B, C>(fst: A, snd: B, thr: C): Triple<A, B, C> => ({
  fst,
  snd,
  thr,
});
function createList<A>(
  s: number,
  xs: List<A>,
  O: Ord<A>,
): Triple<OrdSet<A>, List<A>, List<A>> {
  if (xs.isEmpty) return Triple(Empty, List.empty, List.empty);
  if (s === 1) {
    const x = xs.head;
    return notOrdered(x, xs.tail, O)
      ? Triple(new Bin(1, x, Empty, Empty), List.empty, xs.tail)
      : Triple(new Bin(1, x, Empty, Empty), xs.tail, List.empty);
  }

  const res = createList(s >> 1, xs, O);
  if (res.snd.isEmpty) return res;
  const { fst: l, snd: ys, thr } = res;
  const y = ys.head;
  if (ys.tail.isEmpty) {
    return Triple(_insertMax(y, l), List.empty, thr);
  }

  if (notOrdered(y, ys.tail, O)) {
    return Triple(l, List.empty, ys);
  }

  const { fst: r, snd: zs, thr: ws } = createList(s >> 1, ys.tail, O);
  return Triple(_link(y, l, r), zs, ws);
}

abstract class _OrdSet<out A> {
  public readonly __void!: void;
  public readonly _A!: () => A;

  /**
   * _O(1)_ Returns `true` is the set is empty, or `false` otherwise.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.empty.isEmpty
   * // true
   *
   * > OrdSet.singleton(3, 'a')
   * // false
   * ```
   */
  public get isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * _O(1)_ Negation of `isEmpty`:
   *
   * ```typescript
   * xs.nonEmpty == !xs.isEmpty
   * ```
   */
  public get nonEmpty(): boolean {
    return this.size !== 0;
  }

  /**
   * _O(n)_ Returns the size of the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.empty.size
   * // 0
   *
   * > OrdSet.singleton(3).size
   * // 1
   *
   * > OrdSet(5, 3, 5).size
   * // 2
   * ```
   */
  public abstract readonly size: number;

  /**
   * _O(1)_ Returns a {@link View} of the sets's values.
   *
   * @note The complexity of this method, i.e., creating a view is constant as
   * the view is a lazy collection. Although it's traversal is _O(n)_.
   */
  public get view(): View<A> {
    return View.build((ez, g) => this.foldRight(ez, g));
  }

  /**
   * _O(n)_ Converts the set into an array.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.empty.toArray
   * // []
   *
   * > OrdSet.singleton(3, 'b').toArray
   * // [[3, 'b']]
   *
   * > OrdSet(5, 3, 5).toArray
   * // [3, 5]
   * ```
   */
  public get toArray(): A[] {
    const xs = new Array<A>(this.size);
    let idx = 0;
    this.forEach(x => (xs[idx++] = x));
    return xs;
  }

  /**
   * _O(n)_ Converts the set into a {@link List}.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.toArray
   * // List()
   *
   * > OrdMap.singleton(3, 'b').toArray
   * // List([3, 'b'])
   *
   * > OrdMap(5, 3, 5).toArray
   * // List(3, 5)
   * ```
   */
  public get toList(): List<A> {
    return this.foldRight_(List.empty as List<A>, List.cons);
  }

  /**
   * _O(1)_ Returns an iterator of the set's values in an ascending order.
   *
   * @note The complexity of this method, i.e., creating an iterator is constant
   * as the iterator is a lazy collection. Although it's traversal is _O(n)_.
   */
  public get iterator(): Iterator<A> {
    return new OrdSetIterator(this);
  }
  public [Symbol.iterator](): Iterator<A> {
    return this.iterator;
  }

  /**
   * _O(1)_ Returns an iterator of the sets's values in an descending order.
   *
   * @note The complexity of this method, i.e., creating an iterator is constant
   * as the iterator is a lazy collection. Although it's traversal is _O(n)_.
   */
  public get reverseIterator(): Iterator<A> {
    return new OrdSetReversedIterator(this);
  }

  // -- Min-Max

  /**
   * _O(log(n))_ Returns a minimal value of the set.
   *
   * @note This method is partial.
   *
   * @see {@link minOption} for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.singleton(3).min
   * // 'a'
   *
   * > OrdSet(3, 1, 5).min
   * // 5
   *
   * > OrdSet.empty.min
   * // Uncaught Error: Set.empty.min
   * ```
   */
  public get min(): A {
    const n = this as any as Node<A>;
    return n.tag === 'empty'
      ? throwError(new Error('Set.empty.min'))
      : n.lhs.minSure(n.value);
  }

  /**
   * _O(log(n))_ Optionally return the minimal value of the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.singleton(3).minOption
   * // Some(3)
   *
   * > OrdSet(3, 1, 5).minOption
   * // Some(5)
   *
   * > OrdSet.empty.minOption
   * // None
   * ```
   */
  public get minOption(): Option<A> {
    const n = this as any as Node<A>;
    return n.tag === 'empty' ? None : Some(n.lhs.minSure(n.value));
  }

  private minSure<A>(this: OrdSet<A>, x: A): A {
    const n = this as any as Node<A>;
    return n.tag === 'empty' ? x : n.lhs.minSure(n.value);
  }

  /**
   * _O(log(n))_ Removes and find the minimal value of the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.singleton(3).popMin
   * // Some([3], OrdSet()])
   *
   * > OrdSet(3, 1, 5).popMin
   * // Some(1, OrdSet(3, 5)])
   *
   * > OrdSet.empty.popMin
   * // None
   * ```
   */
  public get popMin(): Option<[A, OrdSet<A>]> {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return None;
    const { s, x } = _getMinView(n.value, n.lhs, n.rhs);
    return Some([x, s]);
  }

  /**
   * _O(log(n))_ Removes the minimal value from the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.singleton(3).removeMin
   * // OrdSet()]
   *
   * > OrdSet(3, 1, 5).removeMin
   * // OrdSet(3, 5)
   *
   * > OrdSet.empty.removeMin
   * // OrdSet()
   * ```
   */
  public get removeMin(): OrdSet<A> {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return Empty;
    return n.removeMinImpl();
  }
  private removeMinImpl(this: Bin<A>): OrdSet<A> {
    const l = this.lhs as Node<A>;
    return l.tag === 'empty'
      ? this.rhs
      : _balanceR(this.value, l.removeMinImpl(), this.rhs);
  }

  /**
   * _O(log(n))_ Returns maximal value of the set.
   *
   * @note This method is partial.
   *
   * @see {@link maxOption} for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.singleton(3).max
   * // 3
   *
   * > OrdSet(3, 1, 5).max
   * // 5
   *
   * > OrdSet.empty.max
   * // Uncaught Error: OrdSet.empty.max
   * ```
   */
  public get max(): A {
    const n = this as any as Node<A>;
    return n.tag === 'empty'
      ? throwError(new Error('OrdSet.empty.max'))
      : n.rhs.maxSure(n.value);
  }

  /**
   * _O(log(n))_ Optionally return the maximal value of the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.singleton(3).maxOption
   * // Some(3)
   *
   * > OrdSet(3, 1, 5).maxOption
   * // Some(5)
   *
   * > OrdSet.empty.maxOption
   * // None
   * ```
   */
  public get maxOption(): Option<A> {
    const n = this as any as Node<A>;
    return n.tag === 'empty' ? None : Some(n.rhs.maxSure(n.value));
  }

  private maxSure<A>(this: OrdSet<A>, x: A): A {
    const n = this as any as Node<A>;
    return n.tag === 'empty' ? x : n.rhs.maxSure(n.value);
  }

  /**
   * _O(log(n))_ Remove and find the maximal value of the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.singleton(3).popMax
   * // Some(['a', OrdSet()])
   *
   * > OrdSet(3, 1, 5).popMax
   * // Some([5, OrdSet(1, 3)])
   *
   * > OrdSet.empty.popMax
   * // None
   * ```
   */
  public get popMax(): Option<[A, OrdSet<A>]> {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return None;
    const { x, s } = _getMaxView(n.value, n.lhs, n.rhs);
    return Some([x, s]);
  }

  /**
   * _O(log(n))_ Removes the maximal value of the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.singleton(3).removeMax
   * // OrdSet()
   *
   * > OrdSet(3, 1, 5).removeMax
   * // OrdSet(1, 3)
   *
   * > OrdSet.empty.removeMax
   * // OrdSet()
   * ```
   */
  public get removeMax(): OrdSet<A> {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return Empty;
    return n.removeMaxImpl();
  }
  private removeMaxImpl(this: Bin<A>): OrdSet<A> {
    const r = this.rhs as Node<A>;
    return r.tag === 'empty'
      ? this.lhs
      : _balanceL(this.value, this.lhs, r.removeMaxImpl());
  }

  // -- Querying

  /**
   * _O(log(n))_ Returns `true` if the given value `x` is present in the set, or
   * `false` otherwise.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet.empty.contains(42)
   * // false
   *
   * > OrdSet.singleton(42).contains(42)
   * // true
   * ```
   */
  public contains<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): boolean {
    return this.containsImpl(x, O);
  }
  private containsImpl<A>(this: OrdSet<A>, x: A, O: Ord<A>): boolean {
    const n = this as Node<A>;
    if (n.tag === 'empty') return false;
    switch (O.compare(x, n.value)) {
      case Compare.LT:
        return n.lhs.containsImpl(x, O);
      case Compare.GT:
        return n.rhs.containsImpl(x, O);
      case Compare.EQ:
        return true;
    }
  }

  /**
   * _O(log(n))_ Finds the largest value, smaller than the provided one.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(3, 5).lookupLT(3)
   * // None
   *
   * > OrdSet(3, 5).lookupLT(4)
   * // Some(3)
   * ```
   */
  public lookupLT<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Option<A> {
    return this.lookupLTNone(x, O);
  }
  private lookupLTNone<A>(this: OrdSet<A>, x: A, O: Ord<A>): Option<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return None;

    const value = n.value;
    return O.lte(x, value)
      ? n.lhs.lookupLTNone(x, O)
      : n.rhs.lookupLTSome(x, value, O);
  }
  private lookupLTSome<A>(this: OrdSet<A>, x: A, kx: A, O: Ord<A>): Option<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return Some(kx);

    const value = n.value;
    return O.lte(x, value)
      ? n.lhs.lookupLTSome(x, kx, O)
      : n.rhs.lookupLTSome(x, value, O);
  }

  /**
   * _O(log(n))_ Finds the smallest value, larger than the provided one.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(3, 5).lookupGT(5)
   * // None
   *
   * > OrdSet(3, 5).lookupGT(4)
   * // Some(5)
   * ```
   */
  public lookupGT<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Option<A> {
    return this.lookupGTNone(x, O);
  }
  private lookupGTNone<A>(this: OrdSet<A>, x: A, O: Ord<A>): Option<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return None;

    const value = n.value;
    return O.lt(x, value)
      ? n.lhs.lookupGTSome(x, value, O)
      : n.rhs.lookupGTNone(x, O);
  }
  private lookupGTSome<A>(this: OrdSet<A>, x: A, kx: A, O: Ord<A>): Option<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return Some(kx);

    const value = n.value;
    return O.lt(x, value)
      ? n.lhs.lookupGTSome(x, value, O)
      : n.rhs.lookupGTSome(x, kx, O);
  }

  /**
   * _O(log(n))_ Finds the largest value, smaller or equal than the provided one.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(3, 5).lookupLE(2)
   * // None
   *
   * > OrdSet(3, 5).lookupLE(3)
   * // Some(3)
   *
   * > OrdSet(3, 5).lookupLE(4)
   * // Some(3)
   * ```
   */
  public lookupLE<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Option<A> {
    return this.lookupLENone(x, O);
  }
  private lookupLENone<A>(this: OrdSet<A>, x: A, O: Ord<A>): Option<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return None;

    const value = n.value;
    switch (O.compare(x, value)) {
      case Compare.LT:
        return n.lhs.lookupLENone(x, O);
      case Compare.EQ:
        return Some(value);
      case Compare.GT:
        return n.rhs.lookupLESome(x, value, O);
    }
  }
  private lookupLESome<A>(this: OrdSet<A>, x: A, kx: A, O: Ord<A>): Option<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return Some(kx);

    const value = n.value;
    switch (O.compare(x, value)) {
      case Compare.LT:
        return n.lhs.lookupLESome(x, kx, O);
      case Compare.EQ:
        return Some(value);
      case Compare.GT:
        return n.rhs.lookupLESome(x, value, O);
    }
  }

  /**
   * _O(log(n))_ Finds the smallest value, larger or equal than the provided one.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(3, 5).lookupGE(6)
   * // None
   *
   * > OrdSet(3, 5).lookupGE(5)
   * // Some(5)
   *
   * > OrdSet(3, 5).lookupGE(4)
   * // Some(5)
   * ```
   */
  public lookupGE<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Option<A> {
    return this.lookupGENone(x, O);
  }
  private lookupGENone<A>(this: OrdSet<A>, x: A, O: Ord<A>): Option<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return None;

    const value = n.value;
    switch (O.compare(x, value)) {
      case Compare.LT:
        return n.lhs.lookupGESome(x, value, O);
      case Compare.EQ:
        return Some(value);
      case Compare.GT:
        return n.rhs.lookupGENone(x, O);
    }
  }
  private lookupGESome<A>(this: OrdSet<A>, x: A, kx: A, O: Ord<A>): Option<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return Some(kx);

    const value = n.value;
    switch (O.compare(x, value)) {
      case Compare.LT:
        return n.lhs.lookupGESome(x, value, O);
      case Compare.EQ:
        return Some(value);
      case Compare.GT:
        return n.rhs.lookupGESome(x, kx, O);
    }
  }

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Returns `true` if the _all_ elements
   * of the first set are contained within the second one as well.
   */
  public isSubsetOf<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): boolean {
    return this.size <= that.size && this.isSubsetOfX(that, O);
  }

  private isSubsetOfX<A>(this: OrdSet<A>, that: OrdSet<A>, O: Ord<A>): boolean {
    const n1 = this as Node<A>;
    if (n1.tag === 'empty') return true;
    const n2 = that as Node<A>;
    if (n2.tag === 'empty') return false;

    if (n1.size === 0) return n2.contains(n1.value, O);

    const { lhs, value, rhs } = n1;
    const { lt, found, gt } = n2.splitContainsImpl(value, O);
    return (
      found &&
      lhs.size <= lt.size &&
      rhs.size <= gt.size &&
      lhs.isSubsetOfX(lt, O) &&
      rhs.isSubsetOfX(gt, O)
    );
  }

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Returns `true` if the sets are
   * disjoint
   *
   * `m.disjoint(n)` is equivalent to `m.intersect(n).isEmpty`
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(3, 5).disjoint(OrdSet(5, 7))
   * // false
   *
   * > OrdSet(3, 5).disjoint(OrdSet(7))
   * // true
   *
   * > OrdSet(3, 5).disjoint(OrdSet.empty)
   * // true
   *
   * > OrdSet.empty.disjoint(OrdSet.empty)
   * // true
   * ```
   */
  public disjoint<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): boolean {
    return this.disjointImpl(that, O);
  }
  private disjointImpl<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    O: Ord<A>,
  ): boolean {
    const n1 = this as Node<A>;
    if (n1.tag === 'empty') return true;
    const n2 = that as Node<A>;
    if (n2.tag === 'empty') return true;

    if (n1.size === 1) return !that.containsImpl(n1.value, O);
    if (n2.size === 1) return !this.containsImpl(n2.value, O);

    const { lt: l, found, gt: r } = n2.splitContainsImpl(n1.value, O);

    return !found && n1.lhs.disjointImpl(l, O) && n1.rhs.disjointImpl(r, O);
  }

  // -- Insert/remove/update

  /**
   * _O(log(n))_ Inserts a new value in the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(5, 3).insert(5)
   * // OrdSet(3, 5)
   *
   * > OrdSet(5, 3).insert(7)
   * // OrdSet(3, 5, 7)
   *
   * > OrdSet.empty.insert(42, 'x')
   * // OrdSet(42)
   * ```
   */
  public insert<A>(
    this: OrdSet<A>,
    a: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): OrdSet<A> {
    return this.insertImpl(a, O);
  }
  private insertImpl<A>(this: OrdSet<A>, a: A, O: Ord<A>): OrdSet<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return new Bin(1, a, Empty, Empty);

    const { value, lhs, rhs } = n;
    switch (O.compare(a, value)) {
      case Compare.LT: {
        const l = lhs.insertImpl(a, O);
        return l === n.lhs ? n : _balanceL(value, l, rhs);
      }
      case Compare.GT: {
        const r = rhs.insertImpl(a, O);
        return r === n.rhs ? n : _balanceR(value, lhs, r);
      }
      case Compare.EQ:
        return value === a ? n : new Bin(n.size, a, lhs, rhs);
    }
  }

  private insertR<A>(this: OrdSet<A>, a: A, O: Ord<A>): OrdSet<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return new Bin(1, a, Empty, Empty);

    const { value, lhs, rhs } = n;
    switch (O.compare(a, value)) {
      case Compare.LT: {
        const l = lhs.insertImpl(a, O);
        return l === n.lhs ? n : _balanceL(value, l, rhs);
      }
      case Compare.GT: {
        const r = rhs.insertImpl(a, O);
        return r === n.rhs ? n : _balanceR(value, lhs, r);
      }
      case Compare.EQ:
        return n;
    }
  }

  /**
   * _O(log(n))_ Removes the value from the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap(1, 3, 5).remove(3)
   * OrdMap(1, 5)
   *
   * > OrdMap(1, 3, 5).remove(7)
   * OrdMap(1, 3, 5)
   *
   * > OrdMap.empty.remove(7)
   * OrdMap()
   * ```
   */
  public remove<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): OrdSet<A> {
    return this.removeImpl(x, O);
  }
  private removeImpl<A>(this: OrdSet<A>, x: A, O: Ord<A>): OrdSet<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return Empty;

    const { value, lhs, rhs } = n;
    switch (O.compare(x, value)) {
      case Compare.LT: {
        const l = lhs.removeImpl(x, O);
        return l === lhs ? n : _balanceR(value, l, rhs);
      }
      case Compare.GT: {
        const r = rhs.removeImpl(x, O);
        return r === rhs ? n : _balanceL(value, lhs, r);
      }
      case Compare.EQ:
        return _glue(lhs, rhs);
    }
  }

  /**
   * _O(log(n))_ Updates the inserts or deletes a value from the set.
   *
   * @examples
   *
   * ```typescript
   * > const f = _ => false
   *
   * > OrdSet(5, 3).alter(7, f)
   * // OrdSet(3, 5)
   *
   * > OrdSet(5, 3).alter(5, f)
   * // OrdSet(3)
   *
   * > const g = _ => true
   *
   * > OrdSet(5, 3).alter(7, g)
   * // OrdSet(3, 5, 7)
   *
   * > OrdSet(5, 3).alter(5, g)
   * // OrdSet(3, 5)
   * ```
   */
  public alter<A>(
    this: OrdSet<A>,
    x: A,
    f: (contains: boolean) => boolean,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): OrdSet<A> {
    return this.alterImpl(x, f, O);
  }
  private alterImpl<A>(
    this: OrdSet<A>,
    x: A,
    f: (contains: boolean) => boolean,
    O: Ord<A>,
  ): OrdSet<A> {
    const n = this as Node<A>;
    if (n.tag === 'empty') {
      return f(false) ? new Bin(1, x, Empty, Empty) : Empty;
    }

    const { value, lhs, rhs } = n;
    switch (O.compare(x, value)) {
      case Compare.LT: {
        const l = lhs.alterImpl(x, f, O);
        return l === lhs ? n : _link(value, l, rhs);
      }

      case Compare.EQ:
        return f(true) ? n : _merge(lhs, rhs);

      case Compare.GT: {
        const r = rhs.alterImpl(x, f, O);
        return r === rhs ? n : _link(value, lhs, r);
      }
    }
  }

  // -- Combining

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Returns a union of sets.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap(3, 5).union(OrdMap(5, 7))
   * // OrdMap(3, 5, 7)
   * ```
   */
  public union<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): OrdSet<A> {
    return this.unionImpl(that, O);
  }
  private unionImpl<A>(this: OrdSet<A>, that: OrdSet<A>, O: Ord<A>): OrdSet<A> {
    const n1 = this as Node<A>;
    if (n1.tag === 'empty') return that;
    const n2 = that as Node<A>;
    if (n2.tag === 'empty') return this;

    if (n2.size === 1) return n1.insertR(n2.value, O);
    if (n1.size === 1) return n2.insertImpl(n1.value, O);

    const { lt: l2, gt: r2 } = n2.splitImpl(n1.value, O);
    const l1l2 = n1.lhs.unionImpl(l2, O);
    const r1r2 = n1.rhs.unionImpl(r2, O);

    return l1l2 === n1.lhs && r1r2 === n1.rhs
      ? n1
      : _link(n1.value, l1l2, r1r2);
  }

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Returns a difference of two sets.
   * The resulting set contains values first one, which are not present in the
   * second one.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(3, 5)['\\'](OrdSet(5, 7))
   * // OrdSet(3)
   * ```
   */
  public difference<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): OrdSet<A> {
    return this.differenceImpl(that, O);
  }
  /**
   * Alias for {@link difference}
   */
  public '\\'<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): OrdSet<A> {
    return this.difference(that, O);
  }
  private differenceImpl<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    O: Ord<A>,
  ): OrdSet<A> {
    const n1 = this as Node<A>;
    if (n1.tag === 'empty') return Empty;
    const n2 = that as Node<A>;
    if (n2.tag === 'empty') return this;

    const { lt: l1, gt: r1 } = n1.splitImpl(n2.value, O);
    const l1l2 = l1.differenceImpl(n2.lhs, O);
    const r1r2 = r1.differenceImpl(n2.rhs, O);

    return l1l2.size + r1r2.size === n1.size ? n1 : _merge(l1l2, r1r2);
  }

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Returns an intersection of two sets.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(3, 5).intersect(OrdSet(5, 7))
   * // OrdSet(5)
   * ```
   */
  public intersect<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): OrdSet<A> {
    return this.intersectImpl(that, O);
  }
  private intersectImpl<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    O: Ord<A>,
  ): OrdSet<A> {
    const n1 = this as Node<A>;
    if (n1.tag === 'empty') return Empty;
    const n2 = that as Node<A>;
    if (n2.tag === 'empty') return Empty;

    const { value, lhs, rhs } = n1;
    const { lt: l2, found, gt: r2 } = n2.splitContainsImpl(value, O);
    const l1l2 = lhs.intersectImpl(l2, O);
    const r1r2 = rhs.intersectImpl(r2, O);

    return found
      ? l1l2 === lhs && r1r2 === rhs
        ? n1
        : _link(value, l1l2, r1r2)
      : _merge(l1l2, r1r2);
  }

  // -- Transformation

  public filter<B extends A>(p: (a: A) => a is B): OrdSet<B>;
  public filter(p: (a: A) => boolean): OrdSet<A>;
  public filter(p: (a: A) => boolean): OrdSet<A> {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return Empty;

    const { value, lhs, rhs } = n;
    const l = lhs.filter(p);

    return p(value) ? _link(value, l, rhs.filter(p)) : _merge(l, rhs.filter(p));
  }

  public partition(p: (a: A) => boolean): [OrdSet<A>, OrdSet<A>] {
    const { fst, snd } = this.partitionImpl(p);
    return [fst, snd];
  }
  private partitionImpl(p: (a: A) => boolean): Pair<OrdSet<A>, OrdSet<A>> {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return Pair(Empty, Empty);

    const { value, lhs, rhs } = n;
    const { fst: l1, snd: r1 } = lhs.partitionImpl(p);
    const { fst: l2, snd: r2 } = rhs.partitionImpl(p);

    return p(value)
      ? Pair(_link(value, l1, l2), _merge(r1, r2))
      : Pair(_merge(l1, l2), _link(value, r1, r2));
  }

  /**
   * _O(log(n))_ Returns a tuple `[s1, s1]`, where `s1` is a set with values
   * smaller than the provided key `x`, and the `s2` with larger than `x`.
   */
  public split<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): [OrdSet<A>, OrdSet<A>] {
    const { lt, gt } = this.splitImpl(x, O);
    return [lt, gt];
  }
  private splitImpl<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A>,
  ): { lt: OrdSet<A>; gt: OrdSet<A> } {
    const n = this as Node<A>;
    if (n.tag === 'empty') return { lt: Empty, gt: Empty };

    const { value, lhs, rhs } = n;
    switch (O.compare(x, value)) {
      case Compare.LT: {
        const { lt, gt } = lhs.splitImpl(x, O);
        return { lt, gt: _link(value, gt, rhs) };
      }
      case Compare.GT: {
        const { lt, gt } = rhs.splitImpl(x, O);
        return { lt: _link(value, lhs, lt), gt };
      }
      case Compare.EQ:
        return { lt: lhs, gt: rhs };
    }
  }

  /**
   * _O(log(n))_ Returns a tripe `[s1, found, s2]`, where `s1` is a set with values
   * smaller than the provided key `x`, and the `s2` with larger than `x`. The
   * `found` is a boolean which is `true` if `x` was part of the original set,
   * or `false` otherwise.
   */
  public splitContains<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): [OrdSet<A>, boolean, OrdSet<A>] {
    const { lt, found, gt } = this.splitContainsImpl(x, O);
    return [lt, found, gt];
  }
  private splitContainsImpl<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A>,
  ): { lt: OrdSet<A>; found: boolean; gt: OrdSet<A> } {
    const n = this as Node<A>;
    if (n.tag === 'empty') return { lt: Empty, found: false, gt: Empty };

    const cmp = O.compare(x, n.value);
    const { value, lhs, rhs } = n;
    switch (cmp) {
      case Compare.LT: {
        const { lt, found, gt } = lhs.splitContainsImpl(x, O);
        return { lt, found, gt: _link(value, gt, rhs) };
      }
      case Compare.GT: {
        const { lt, found, gt } = rhs.splitContainsImpl(x, O);
        return { lt: _link(value, lhs, lt), found, gt };
      }
      case Compare.EQ:
        return { lt: lhs, found: true, gt: rhs };
    }
  }

  public map<B>(
    f: (a: A) => B,
    O: Ord<B> = Ord.fromUniversalCompare(),
  ): OrdSet<B> {
    const xs = new Array<B>(this.size);
    let i = 0;
    this.forEach(x => (xs[i++] = f(x)));
    return OrdSet.fromArray(xs, O);
  }

  // -- Indexing

  /**
   * _O(log(n))_ Returns value at zero-based `i`th index in the ascending
   * sequence of value forming the set.
   *
   * @note This method is partial
   * @see {@link getOption} for a safe option
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(3, 5, 7).get(0)
   * // 3
   *
   * > OrdSet(3, 5, 7).get(1)
   * // 5
   *
   * > OrdSet(3, 5, 7).get(2)
   * // 7
   *
   * > OrdSet(3, 5, 7).get(3)
   * // Uncaught Error: Map.get: IndexOutOfBounds
   *
   * > OrdSet(3, 5, 7).get(-1)
   * // Uncaught Error: Map.get: IndexOutOfBounds
   * ```
   */
  public get(i: number): A {
    return i < 0 || i >= this.size
      ? throwError(new Error('Set.get: IndexOutOfBounds'))
      : this.getImpl(i);
  }
  private getImpl(i: number): A {
    // invariant preserved by the check in the public method
    const n = this as any as Bin<A>;

    if (i === n.lhs.size) return n.value;

    return i < n.lhs.size
      ? n.lhs.getImpl(i)
      : n.rhs.getImpl(i - n.lhs.size - 1);
  }

  /**
   * _O(log(n))_ Returns value at zero-based `i`th index in the ascending sequence
   * of values forming the set.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(3, 5, 7).getOption(0)
   * // Some([3, 'b'])
   *
   * > OrdSet(3, 5, 7).getOption(1)
   * // Some([5, 'a'])
   *
   * > OrdSet(3, 5, 7).getOption(2)
   * // Some([7, 'c'])
   *
   * > OrdSet(3, 5, 7).getOption(3)
   * // None
   *
   * > OrdSet(3, 5, 7).getOption(-1)
   * // None
   * ```
   */
  public getOption(i: number): Option<A> {
    return i < 0 || i >= this.size ? None : Some(this.getImpl(i));
  }

  /**
   * _O(log(n))_ Return zero-based index of the given value in the sorted sequence
   * of values contained by the set.
   *
   * ```typescript
   * > OrdSet(5, 3, 7).keyIndex(3)
   * // Some(0)
   *
   * > OrdSet(5, 3, 7).keyIndex(5)
   * // Some(1)
   *
   * > OrdSet(5, 3, 7).keyIndex(7)
   * // Some(2)
   *
   * > OrdSet(5, 3, 7).keyIndex(2)
   * // None
   * ```
   */
  public elemIndex<A>(
    this: OrdSet<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Option<number> {
    return this.keyIndexImpl(0, x, O);
  }
  private keyIndexImpl<A>(
    this: OrdSet<A>,
    s: number,
    x: A,
    O: Ord<A>,
  ): Option<number> {
    const n = this as Node<A>;
    if (n.tag === 'empty') return None;

    const { value, lhs, rhs } = n;
    switch (O.compare(x, value)) {
      case Compare.LT:
        return lhs.keyIndexImpl(s, x, O);
      case Compare.EQ:
        return Some(s + lhs.size);
      case Compare.GT:
        return rhs.keyIndexImpl(s + lhs.size + 1, x, O);
    }
  }

  /**
   * _O(n)_ Returns a zero-based index of the value which returns `true` for the
   * given predicate in the ordered sequence of values forming the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(5, 3, 7).findIndex(x => x < 5)
   * // Some(0)
   *
   * > OrdSet(5, 3, 7).findIndex(x => x > 5)
   * // Some(2)
   *
   * > OrdSet(5, 3, 7).findIndex(x => x < 1)
   * // None
   * ```
   */
  public findIndex(p: (a: A) => boolean): Option<number> {
    return this.findIndexImpl(0, p);
  }
  private findIndexImpl(s: number, p: (a: A) => boolean): Option<number> {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return None;

    const { value, lhs, rhs } = n;
    const l = lhs.findIndexImpl(s, p);
    if (l.nonEmpty) return l;
    if (p(value)) return Some(s + lhs.size);
    return rhs.findIndexImpl(s + lhs.size + 1, p);
  }

  /**
   * _O(log(n))_ Take a given number of values in the ascending order.
   *
   * `m.take(n)` is equivalent to `OrdMap.fromList(m.toList.take(n))`
   */
  public take(n: number): OrdSet<A> {
    return n >= this.size ? this : this.takeImpl(n);
  }
  private takeImpl(i: number): OrdSet<A> {
    if (i <= 0) return Empty;
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return Empty;

    const { value, lhs, rhs } = n;
    if (i < lhs.size) return lhs.takeImpl(i);
    if (i > lhs.size) return _link(value, lhs, rhs.takeImpl(i - lhs.size - 1));
    return lhs;
  }

  /**
   * _O(log(n))_ Drop a given number of values in the ascending order.
   *
   * `m.drop(n)` is equivalent to `OrdSet.fromList(m.toList.drop(n))`
   */
  public drop(n: number): OrdSet<A> {
    return n >= this.size ? Empty : this.dropImpl(n);
  }
  private dropImpl(i: number): OrdSet<A> {
    if (i <= 0) return this;
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return Empty;

    const { value, lhs, rhs } = n;
    if (i < lhs.size) return _link(value, lhs.dropImpl(i), rhs);
    if (i > lhs.size) return rhs.dropImpl(i - lhs.size - 1);
    return _insertMin(value, rhs);
  }

  /**
   * _O(log(n))_ Split the set at the particular index.
   *
   * `m.splitAt(n)` is equivalent to `[m.take(n), m.drop(n)]`
   */
  public splitAt(n: number): [OrdSet<A>, OrdSet<A>] {
    if (n >= this.size) return [this, Empty];
    const { fst, snd } = this.splitAtImpl(n);
    return [fst, snd];
  }
  private splitAtImpl(i: number): Pair<OrdSet<A>, OrdSet<A>> {
    if (i <= 0) return Pair(Empty, this);
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return Pair(Empty, Empty);

    const { value, lhs, rhs } = n;
    if (i < lhs.size) {
      const { fst, snd } = lhs.splitAtImpl(i);
      return Pair(fst, _link(value, snd, rhs));
    }
    if (i > lhs.size) {
      const { fst, snd } = rhs.splitAtImpl(i - lhs.size - 1);
      return Pair(_link(value, lhs, fst), snd);
    }
    return Pair(lhs, _insertMin(value, rhs));
  }

  /**
   * _O(log(n))_ Take a given number of values in the descending order.
   *
   * `m.takeRight(n)` is equivalent to `OrdSet.fromList(m.toList.takeRight(n))`
   */
  public takeRight(n: number): OrdSet<A> {
    if (n <= 0) return Empty;
    if (n >= this.size) return this;
    return this.drop(this.size - n);
  }

  /**
   * _O(log(n))_ Drop a given number of values in the descending order.
   *
   * `m.dropRight(n)` is equivalent to `OrdSet.fromList(m.toList.dropRight(n))`
   */
  public dropRight(n: number): OrdSet<A> {
    if (n <= 0) return this;
    if (n >= this.size) return Empty;
    return this.take(this.size - n);
  }

  /**
   * _O(log(n))_ Removes a value at the zero-based index of the ordered values
   * forming the set.
   *
   * @note This method is partial
   *
   * @examples
   *
   * ```typescript
   * > OrdSet(5, 3, 7).removeAt(0)
   * // OrdSet(5, 7)
   *
   * > OrdSet(5, 3, 7).removeAt(1)
   * // OrdSet(3, 7)
   *
   * > OrdSet(5, 3, 7).removeAt(42)
   * // Uncaught Error: Map.removeAt: IndexOutOfBounds
   *
   * > OrdSet(5, 3, 7).removeAt(-1)
   * // Uncaught Error: Map.removeAt: IndexOutOfBounds
   * ```
   */
  public removeAt(i: number): OrdSet<A> {
    return i < 0 || i >= this.size
      ? throwError(new Error('Map.removeAt: IndexOutOfBounds'))
      : this.removeAtImpl(i);
  }
  private removeAtImpl(i: number): OrdSet<A> {
    // invariant preserved by the check in the public method
    const { value, lhs, rhs } = this as any as Bin<A>;
    if (i === lhs.size) return _glue(lhs, rhs);

    return i < lhs.size
      ? _balanceR(value, lhs.removeAtImpl(i), rhs)
      : _balanceL(value, lhs, rhs.removeAtImpl(i - lhs.size - 1));
  }

  // -- Folds

  /**
   * _O(n)_ Apply `f` to each element of the set for its side-effect.
   *
   * @examples
   *
   * ```typescript
   * > let acc = 0;
   * > OrdSet(1, 2, 3, 4, 5).forEach(x => acc += x)
   * > acc
   * // 15
   * ```
   */
  public forEach(f: (a: A) => void): void {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return;
    if (n.size === 1) return f(n.value);
    n.lhs.forEach(f);
    f(n.value);
    n.rhs.forEach(f);
  }

  /**
   * _O(n)_ Apply a left-associative operator `f` to each element of the set
   * reducing the set from left to right.
   */
  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return z;
    if (n.size === 1) return f(z, n.value);
    const l = n.lhs.foldLeft(z, f);
    const m = f(l, n.value);
    return n.rhs.foldLeft(m, f);
  }

  /**
   * _O(n)_ Apply a right-associative operator `f` to each element of the set,
   * reducing the list from right to left lazily.
   *
   * @see {@link foldRight_} for a strict variant.
   */
  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    return Iter.foldRight_(this.iterator, ez, f);
  }

  /**
   * _O(n)_ Strict, non-short-circuiting version of the {@link foldRight}.
   */
  public foldRight_<B>(z: B, f: (a: A, b: B) => B): B {
    const n = this as any as Node<A>;
    if (n.tag === 'empty') return z;
    if (n.size === 1) return f(n.value, z);
    const r = n.rhs.foldRight_(z, f);
    const m = f(n.value, r);
    return n.lhs.foldRight_(m, f);
  }

  /**
   * _O(n)_ Right associative, lazy fold mapping each element of the structure
   * into a monoid `M` and combining their results using `combineEval`.
   *
   * @see foldMapK for a version accepting a `MonoidK` instance
   * @see foldMapLeft for a left-associative, strict variant
   */
  public foldMap<M>(M: Monoid<M>, f: (a: A) => M): M {
    return this.foldRight(Eval.now(M.empty), (a, eb) =>
      M.combineEval_(f(a), eb),
    ).value;
  }

  /**
   * _O(n)_ Left-associative, strict version of {@link foldMap}.
   */
  public foldMapLeft<M>(M: Monoid<M>, f: (a: A) => M): M {
    return this.foldLeft(M.empty, (b, a) => M.combine_(b, f(a)));
  }

  /**
   * _O(n)_ Version of {@link foldMap} that accepts {@link MonoidK} instance.
   */
  public foldMapK<F, B>(
    F: MonoidK<F>,
    f: (v: A) => Kind<F, [B]>,
  ): Kind<F, [B]> {
    return this.foldMap(F.algebra<B>(), f);
  }

  // -- Traversing

  /**
   * Transform each element of the structure into an applicative action and
   * evaluate them left-to-right ignoring the results.
   *
   * {@link traverse_} uses {@link Applicative.map2Eval}` function of the provided
   * applicative `G` allowing for short-circuiting.
   */
  public traverse_<G>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [unknown]>,
  ): Kind<G, [void]> {
    const discard = () => {};
    return this.foldRight(Eval.now(G.unit), (x, r) =>
      G.map2Eval_(f(x), r, discard),
    ).value;
  }

  /**
   * Evaluate each applicative action of the structure left-to-right ignoring
   * their results.
   *
   * {@link sequence_} uses {@link Applicative.map2Eval} function of the provided
   * applicative `G` allowing for short-circuiting.
   */
  public sequence_<G>(
    this: OrdSet<Kind<G, [unknown]>>,
    G: Applicative<G>,
  ): Kind<G, [void]> {
    return this.traverse_(G, id);
  }

  // -- Misc

  public toString(): string {
    return `OrdSet(${this.toArray.map(String).join(', ')})`;
  }

  public equals<A>(
    this: OrdSet<A>,
    that: OrdSet<A>,
    K: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    const it = that.iterator;
    return this.view.foldRight(Eval.true, (l, eb) => {
      const nx = it.next();
      if (nx.done) return Eval.true;
      const r = nx.value;
      return K.notEquals(l, r) ? Eval.false : eb;
    }).value;
  }
}

// -- Algebra

export class Bin<A> extends _OrdSet<A> {
  public readonly tag = 'bin';
  public constructor(
    public readonly size: number,
    public readonly value: A,
    public readonly lhs: _OrdSet<A>,
    public readonly rhs: _OrdSet<A>,
  ) {
    super();
  }
}

function mkBin<A>(key: A, lhs: OrdSet<A>, rhs: OrdSet<A>): Bin<A> {
  return new Bin(1 + lhs.size + rhs.size, key, lhs, rhs);
}

export const Empty: OrdSet<never> & { readonly tag: 'empty' } =
  new (class Empty extends _OrdSet<never> {
    public readonly tag = 'empty';
    public readonly size: number = 0;
  })();
export type Empty = typeof Empty;
OrdSet.empty = Empty;

export type Node<A> = Bin<A> | Empty;

// -- Assertions

export const isValid = <A>(
  sa: OrdSet<A>,
  O: Ord<A> = Ord.fromUniversalCompare(),
): boolean => isOrdered(sa, O) && isBalanced(sa) && hasValidSize(sa);

export const isOrdered = <A>(
  sa: OrdSet<A>,
  O: Ord<A> = Ord.fromUniversalCompare(),
): boolean => {
  const bounded = (
    sa: OrdSet<A>,
    lo: (a: A) => boolean,
    hi: (a: A) => boolean,
  ): boolean => {
    const sn = sa as Node<A>;
    if (sn.tag === 'empty') return true;

    return (
      lo(sn.value) &&
      hi(sn.value) &&
      bounded(sn.lhs, lo, x => O.lt(x, sn.value)) &&
      bounded(sn.rhs, x => O.gt(x, sn.value), hi)
    );
  };

  return bounded(sa, constant(true), constant(true));
};

export const isBalanced = <A>(sa: OrdSet<A>): boolean => {
  const sn = sa as Node<A>;
  return sn.tag === 'empty'
    ? true
    : (sn.lhs.size + sn.rhs.size <= 1 ||
        (sn.lhs.size <= delta * sn.rhs.size &&
          sn.rhs.size <= delta * sn.rhs.size)) &&
        isBalanced(sn.lhs) &&
        isBalanced(sn.rhs);
};

export const hasValidSize = <A>(sa: OrdSet<A>): boolean => {
  const realSize = (sa: OrdSet<A>): number => {
    const sn = sa as Node<A>;
    return sn.tag === 'empty' ? 0 : realSize(sn.lhs) + 1 + realSize(sn.rhs);
  };
  return sa.size === realSize(sa);
};

// -- Private implementations

const delta = 3;
const ratio = 2;

function _balanceL<A>(x: A, l: OrdSet<A>, r: OrdSet<A>): OrdSet<A> {
  const ln = l as Node<A>;
  if (r.size === 0) {
    if (ln.tag === 'empty') {
      return new Bin(1, x, Empty, Empty);
    } else if (ln.size === 1) {
      return new Bin(2, x, l, Empty);
    } else if (ln.lhs.size === 0) {
      return new Bin(
        3,
        (ln.rhs as Bin<A>).value,
        new Bin(1, ln.value, Empty, Empty),
        new Bin(1, x, Empty, Empty),
      );
    } else if (ln.rhs.size === 0) {
      return mkBin(ln.value, ln.lhs, new Bin(1, x, Empty, Empty));
    }

    return ln.rhs.size < ratio * ln.lhs.size
      ? mkBin(ln.value, ln.lhs, mkBin(x, ln.rhs, Empty))
      : mkBin(
          (ln.rhs as Bin<A>).value,
          mkBin(ln.value, ln.lhs, (ln.rhs as Bin<A>).lhs),
          mkBin(x, (ln.rhs as Bin<A>).rhs, Empty),
        );
  }

  if (ln.tag === 'empty') {
    return mkBin(x, Empty, r);
  } else if (ln.size <= delta * r.size) {
    return mkBin(x, l, r);
  }

  return ln.rhs.size < ratio * ln.lhs.size
    ? mkBin(ln.value, ln.lhs, mkBin(x, ln.rhs, r))
    : mkBin(
        (ln.rhs as Bin<A>).value,
        mkBin(ln.value, ln.lhs, (ln.rhs as Bin<A>).lhs),
        mkBin(x, (ln.rhs as Bin<A>).rhs, r),
      );
}

function _balanceR<A>(x: A, l: OrdSet<A>, r: OrdSet<A>): OrdSet<A> {
  const rn = r as Node<A>;
  if (l.size === 0) {
    if (rn.tag === 'empty') {
      return new Bin(1, x, Empty, Empty);
    } else if (rn.size === 1) {
      return new Bin(2, x, Empty, r);
    } else if (rn.lhs.size === 0) {
      return mkBin(rn.value, new Bin(1, x, Empty, Empty), rn.rhs);
    } else if (rn.rhs.size === 0) {
      return new Bin(
        3,
        (rn.lhs as Bin<A>).value,
        mkBin(x, Empty, Empty),
        mkBin(rn.value, Empty, Empty),
      );
    }

    return rn.lhs.size < ratio * rn.rhs.size
      ? mkBin(rn.value, mkBin(x, Empty, rn.lhs), rn.rhs)
      : mkBin(
          (rn.lhs as Bin<A>).value,
          mkBin(x, Empty, (rn.lhs as Bin<A>).lhs),
          mkBin(rn.value, (rn.lhs as Bin<A>).rhs, rn.rhs),
        );
  }

  if (rn.tag === 'empty') {
    return mkBin(x, l, Empty);
  } else if (rn.size <= delta * l.size) {
    return mkBin(x, l, r);
  }

  return rn.lhs.size < ratio * rn.rhs.size
    ? mkBin(rn.value, mkBin(x, l, rn.lhs), rn.rhs)
    : mkBin(
        (rn.lhs as Bin<A>).value,
        mkBin(x, l, (rn.lhs as Bin<A>).lhs),
        mkBin(rn.value, (rn.lhs as Bin<A>).rhs, rn.rhs),
      );
}

const _link = <A>(x: A, l: OrdSet<A>, r: OrdSet<A>): OrdSet<A> => {
  const ln = l as Node<A>;
  if (ln.tag === 'empty') return _insertMin(x, r);
  const rn = r as Node<A>;
  if (rn.tag === 'empty') return _insertMax(x, l);

  if (delta * ln.size < rn.size)
    return _balanceL(rn.value, _link(x, ln, rn.lhs), rn.rhs);
  else if (delta * rn.size < ln.size)
    return _balanceR(ln.value, ln.lhs, _link(x, ln.rhs, rn));
  else return mkBin(x, ln, rn);
};

const _merge = <A>(l: OrdSet<A>, r: OrdSet<A>): OrdSet<A> => {
  const ln = l as Node<A>;
  if (ln.tag === 'empty') return r;
  const rn = r as Node<A>;
  if (rn.tag === 'empty') return l;

  if (delta * ln.size < rn.size)
    return _balanceL(rn.value, _merge(ln, rn.lhs), rn.rhs);
  else if (delta * rn.size < ln.size)
    return _balanceR(ln.value, ln.lhs, _merge(ln.rhs, rn));
  else return _glue(ln, rn);
};

const _insertMax = <A>(x: A, sa: OrdSet<A>): OrdSet<A> => {
  const sn = sa as Node<A>;
  return sn.tag === 'empty'
    ? mkBin(x, Empty, Empty)
    : _balanceR(sn.value, sn.lhs, _insertMax(x, sn.rhs));
};
const _insertMin = <A>(x: A, sa: OrdSet<A>): OrdSet<A> => {
  const sn = sa as Node<A>;
  return sn.tag === 'empty'
    ? mkBin(x, Empty, Empty)
    : _balanceL(sn.value, _insertMin(x, sn.lhs), sn.rhs);
};

const _glue = <A>(l: OrdSet<A>, r: OrdSet<A>): OrdSet<A> => {
  const ln = l as Node<A>;
  if (ln.tag === 'empty') return r;
  const rn = r as Node<A>;
  if (rn.tag === 'empty') return l;

  if (ln.size > rn.size) {
    const { value: lx, lhs: ll, rhs: lr } = ln;
    const { x, s } = _getMaxView(lx, ll, lr);
    return _balanceR(x, s, r);
  } else {
    const { value: rx, lhs: rl, rhs: rr } = rn;
    const { x, s } = _getMinView(rx, rl, rr);
    return _balanceL(x, l, s);
  }
};

type MinView<A> = { x: A; s: OrdSet<A> };
const _getMinView = <A>(x: A, ls: OrdSet<A>, rs: OrdSet<A>): MinView<A> => {
  const sn = ls as Node<A>;
  if (sn.tag === 'empty') return { x, s: rs };

  const { value, lhs, rhs } = sn;
  const view = _getMinView(value, lhs, rhs);
  return { ...view, s: _balanceR(x, view.s, rs) };
};

type MaxView<A> = { x: A; s: OrdSet<A> };
const _getMaxView = <A>(x: A, ls: OrdSet<A>, rs: OrdSet<A>): MaxView<A> => {
  const sn = rs as Node<A>;
  if (sn.tag === 'empty') return { x, s: ls };

  const { value, lhs, rhs } = sn;
  const view = _getMaxView(value, lhs, rhs);
  return { ...view, s: _balanceL(x, ls, view.s) };
};

type Pair<A, B> = { readonly fst: A; readonly snd: B };
function Pair<A, B>(fst: A, snd: B): Pair<A, B> {
  return { fst, snd };
}

class OrdSetIterator<A> implements Iterator<A> {
  private rhss: Bin<A>[] = [];
  private cur: Node<A>;
  public constructor(cur: OrdSet<A>) {
    this.cur = cur as Node<A>;
  }

  public next(): IteratorResult<A> {
    const rhss = this.rhss;
    let cur = this.cur;
    while (cur.tag !== 'empty') {
      rhss.push(cur);
      cur = cur.lhs as Node<A>;
    }
    if (rhss.length === 0) return { done: true, value: undefined };

    const { value, rhs } = rhss.pop()!;
    this.cur = rhs as Node<A>;
    return { done: false, value };
  }
}

class OrdSetReversedIterator<A> implements Iterator<A> {
  private lhss: Bin<A>[] = [];
  private cur: Node<A>;
  public constructor(cur: OrdSet<A>) {
    this.cur = cur as Node<A>;
  }

  public next(): IteratorResult<A> {
    const lhss = this.lhss;
    let cur = this.cur;
    while (cur.tag !== 'empty') {
      lhss.push(cur);
      cur = cur.rhs as Node<A>;
    }
    if (lhss.length === 0) return { done: true, value: undefined };

    const { value, lhs } = lhss.pop()!;
    this.cur = lhs as Node<A>;
    return { done: false, value };
  }
}

// -- Instances

const setEq = cached(<A>(E: Eq<A>) =>
  Eq.of<OrdSet<A>>({ equals: (x, y) => x.equals(y, E) }),
);

const setMonoid = cached(<A>(O: Ord<A>) =>
  CommutativeMonoid.of<OrdSet<A>>({
    empty: Empty,
    combine_: (x, y) => x.union(y, O),
    combineEval_: (x, ey) => (x.isEmpty ? ey : ey.map(y => x.union(y, O))),
  }),
);

const intersectionSemigroup = cached(<A>(O: Ord<A>) =>
  CommutativeSemigroup.of<OrdSet<A>>({
    combine_: (x, y) => x.intersect(y, O),
    combineEval_: (x, ey) =>
      x.isEmpty ? Eval.now(OrdSet.empty) : ey.map(y => x.intersect(y, O)),
  }),
);

const setFoldable = lazy(() =>
  Foldable.of<OrdSetF>({
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(xs: OrdSet<A>, f: (a: A) => M): M =>
        xs.foldMap(M, f),
    foldLeft_: (xs, z, f) => xs.foldLeft(z, f),
    foldRight_: (xs, z, f) => xs.foldRight(z, f),
    iterator: xs => xs.iterator,
    toArray: xs => xs.toArray,
    isEmpty: xs => xs.isEmpty,
    nonEmpty: xs => xs.nonEmpty,
    size: xs => xs.size,
  }),
);

OrdSet.Eq = setEq;
OrdSet.Monoid = setMonoid;
OrdSet.CommutativeMonoid = setMonoid;
OrdSet.Foldable = setFoldable();

OrdSet.Intersection = {
  Semigroup: intersectionSemigroup,
  CommutativeSemigroup: intersectionSemigroup,
} as const;

// -- HKT

export interface OrdSetF extends TyK<[unknown]> {
  [$type]: OrdSet<TyVar<this, 0>>;
}
