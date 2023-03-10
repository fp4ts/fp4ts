// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Align,
  Applicative,
  Apply,
  Compare,
  Const,
  Either,
  Eq,
  Foldable,
  FoldableWithIndex,
  Functor,
  FunctorFilter,
  FunctorWithIndex,
  Identity,
  IdentityF,
  Ior,
  isConstTC,
  isIdentityTC,
  Iter,
  Monoid,
  MonoidK,
  None,
  Option,
  Ord,
  Some,
  TraversableFilter,
  TraversableWithIndex,
  TraverseStrategy,
  Unzip,
} from '@fp4ts/cats';
import {
  $,
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
import { LazyList, LazyListStep } from './lazy-list';
import { List } from './list';
import { View } from './view';

/**
 * Immutable, strict, finite map (or dictionary) from keys `K` to values `V`.
 *
 * Port of Haskell's [Data.Map](https://hackage.haskell.org/package/containers-0.6.7/docs/src/Data.Map.Internal.html)
 */
export type OrdMap<K, V> = _OrdMap<K, V>;
export const OrdMap = function <K, V>(
  ...xs: readonly (readonly [K, V])[]
): OrdMap<K, V> {
  return xs.reduce((xs, [k, v]) => xs.insert(k, v), Empty as OrdMap<K, V>);
};

/**
 * _O(1)_ Creates an empty `OrdMap`.
 *
 * ```typescript
 * > OrdMap.empty
 * // OrdMap()
 * ```
 */
OrdMap.empty = null as any as OrdMap<never, never>; // defined below

function singleton<K, V>(k: K, v: V): OrdMap<K, V> {
  return new Bin(1, k, v, Empty, Empty);
}

/**
 * _O(1)_ Creates a map with a single element.
 *
 * ```typescript
 * > OrdMap.singleton(1, 'a')
 * // OrdMap([1, 'a'])
 * ```
 */
OrdMap.singleton = singleton;

// -- Construction from arrays

/**
 * _O(n * log(n))_ Build a map from an array of key/value pairs. If the keys in
 * the array are ordered, linear-time (_O(n)_) implementation is used instead.
 *
 * @see {@link OrdMap.fromArrayWith} for a building array with a custom combining
 *                                   function
 * @see {@link OrdMap.fromDistinctAscArray}
 *
 * @examples
 *
 * ```typescript
 * > OrdMap.fromArray([])
 * // OrdMap()
 *
 * > OrdMap.fromArray([[5, 'a'], [3, 'b'], [5, 'c']])
 * // OrdMap([3, 'b'], [5, 'c'])
 *
 * > OrdMap.fromArray([[5, 'c'], [3, 'b'], [5, 'a']])
 * // OrdMap([3, 'b'], [5, 'a'])
 * ```
 */
OrdMap.fromArray = <K, V>(
  xs: readonly (readonly [K, V])[],
  O: Ord<K> = Ord.fromUniversalCompare(),
): OrdMap<K, V> => {
  switch (xs.length) {
    case 0:
      return Empty;
    case 1:
      return new Bin(1, xs[0][0], xs[0][1], Empty, Empty);
    default: {
      let i = 0;
      for (let l = xs.length - 1; i < l; i++) {
        if (O.gte(xs[i][0], xs[i + 1][0])) {
          return _fromArray(fromDistinctAscArray(xs, 0, i), xs, i, O);
        }
      }
      return fromDistinctAscArray(xs, 0, xs.length);
    }
  }
};

function _fromArray<K, V>(
  t: OrdMap<K, V>,
  xs: readonly (readonly [K, V])[],
  start: number,
  O: Ord<K>,
): OrdMap<K, V> {
  for (let i = start, l = xs.length; i < l; i++) {
    t = t.insert(xs[i][0], xs[i][1], O);
  }
  return t;
}

/**
 * _O(n * log(n))_ A version of {@link OrdMap.fromArray} that accepts a custom
 * combining function.
 *
 * @examples
 *
 * ```typescript
 * > OrdMap.fromArrayWith([[5, 'a'], [3, 'b'], [5, 'c']], (y, x) => x + y)
 * // OrdMap([3, 'b'], [5, 'ac'])
 * ```
 */
OrdMap.fromArrayWith = <K, V>(
  xs: readonly (readonly [K, V])[],
  f: (newV: V, old: V, k: K) => V,
  O: Ord<K> = Ord.fromUniversalCompare(),
): OrdMap<K, V> => {
  let m: OrdMap<K, V> = Empty;
  for (let i = 0, l = xs.length; i < l; i++) {
    m = m.insertWith(xs[i][0], xs[i][1], f, O);
  }
  return m;
};

/**
 * _O(n)_ Builds a map from an array of key/value pairs where keys are already
 * in an ascending order.
 *
 * @see {@link OrdMap.fromDistinctDescArray} for array with keys in descending order
 * @see {@link OrdMap.fromArray} for array with keys in no particular order
 */
OrdMap.fromDistinctAscArray = <K, V>(
  xs0: readonly (readonly [K, V])[],
): OrdMap<K, V> => fromDistinctAscArray(xs0, 0, xs0.length);

function fromDistinctAscArray<K, V>(
  xs: readonly (readonly [K, V])[],
  start: number,
  end: number,
): OrdMap<K, V> {
  if (start >= end) return Empty;
  if (end - start === 1) {
    const kv = xs[start];
    return new Bin(1, kv[0], kv[1], Empty, Empty);
  }

  const middle = ((start + end) / 2) | 0;
  const kv = xs[middle];
  const lhs = fromDistinctAscArray(xs, start, middle);
  const rhs = fromDistinctAscArray(xs, middle + 1, end);
  return mkBin(kv[0], kv[1], lhs, rhs);
}

/**
 * _O(n)_ Builds a map from an array of key/value pairs where keys are already
 * in an descending order.
 *
 * @see {@link Ord.fromDistinctAscArray} for array with keys in ascending order
 * @see {@link Ord.fromArray} for array with keys in no particular order
 */
OrdMap.fromDistinctDescArray = <K, V>(
  xs0: readonly (readonly [K, V])[],
): OrdMap<K, V> => fromDistinctDescArray(xs0, 0, xs0.length);

function fromDistinctDescArray<K, V>(
  xs: readonly (readonly [K, V])[],
  start: number,
  end: number,
): OrdMap<K, V> {
  if (start >= end) return Empty;
  if (end - start === 1) {
    const kv = xs[start];
    return new Bin(1, kv[0], kv[1], Empty, Empty);
  }

  const middle = ((start + end) / 2) | 0;
  const kv = xs[middle];
  const rhs = fromDistinctDescArray(xs, start, middle);
  const lhs = fromDistinctDescArray(xs, middle + 1, end);
  return mkBin(kv[0], kv[1], lhs, rhs);
}

// -- Construction from Lists

/**
 * _O(n * log(n))_ Build a map from a {@link List} of key/value pairs. If the keys
 * in the List are ordered, linear-time (_O(n)_) implementation is used instead.
 *
 * @see {@link OrdMap.fromListWith} for a building lList with a custom combining
 *                                   function
 * @see {@link OrdMap.fromDistinctAscList}
 *
 * @examples
 *
 * ```typescript
 * > OrdMap.fromArray(List.empty)
 * // OrdMap()
 *
 * > OrdMap.fromArray(List(5, 'a'], [3, 'b'], [5, 'c']))
 * // OrdMap([3, 'b'], [5, 'c'])
 *
 * > OrdMap.fromArray(List([5, 'c'], [3, 'b'], [5, 'a']))
 * // OrdMap([3, 'b'], [5, 'a'])
 * ```
 */
OrdMap.fromList = <K, V>(
  xs: List<readonly [K, V]>,
  O: Ord<K> = Ord.fromUniversalCompare(),
): OrdMap<K, V> => {
  if (xs.isEmpty) return Empty;
  const x = xs.head;
  if (xs.tail.isEmpty) return new Bin(1, x[0], x[1], Empty, Empty);
  if (O.gte(x[0], xs.tail.head[0]))
    return _fromList(Empty as OrdMap<K, V>, xs, O);

  let s = 1;
  let t: OrdMap<K, V> = new Bin(1, x[0], x[1], Empty, Empty);
  xs = xs.tail;

  while (xs.tail.nonEmpty) {
    const x = xs.head;
    if (notOrdered(x[0], xs.tail, O)) return _fromList(t, xs, O);
    const { fst, snd, thr } = createList(s, xs.tail, O);
    if (snd.isEmpty) return _fromList(_link(x[0], x[1], t, fst), thr, O);

    s = s << 1;
    t = _link(x[0], x[1], t, fst);
    xs = snd;
  }
  const y = xs.head;
  return _insertMax(y[0], y[1], t);
};

const _fromList = <K, V>(
  z: OrdMap<K, V>,
  xs: List<readonly [K, V]>,
  O: Ord<K>,
): OrdMap<K, V> => xs.foldLeft(z, (m, kv) => m.insert(kv[0], kv[1], O));

const notOrdered = <K, V>(
  k: K,
  kvs: List<readonly [K, V]>,
  O: Ord<K>,
): boolean => (kvs.isEmpty ? false : O.gte(k, kvs.head[0]));

type Triple<A, B, C> = { fst: A; snd: B; thr: C };
const Triple = <A, B, C>(fst: A, snd: B, thr: C): Triple<A, B, C> => ({
  fst,
  snd,
  thr,
});
function createList<K, V>(
  s: number,
  xs: List<readonly [K, V]>,
  O: Ord<K>,
): Triple<OrdMap<K, V>, List<readonly [K, V]>, List<readonly [K, V]>> {
  if (xs.isEmpty) return Triple(Empty, List.empty, List.empty);
  if (s === 1) {
    const kv = xs.head;
    return notOrdered(kv[0], xs.tail, O)
      ? Triple(new Bin(1, kv[0], kv[1], Empty, Empty), List.empty, xs.tail)
      : Triple(new Bin(1, kv[0], kv[1], Empty, Empty), xs.tail, List.empty);
  }

  const res = createList(s >> 1, xs, O);
  if (res.snd.isEmpty) return res;
  const { fst: l, snd: ys, thr } = res;
  const x = ys.head;
  if (ys.tail.isEmpty) {
    return Triple(_insertMax(x[0], x[1], l), List.empty, thr);
  }

  if (notOrdered(x[0], ys.tail, O)) {
    return Triple(l, List.empty, ys);
  }

  const { fst: r, snd: zs, thr: ws } = createList(s >> 1, ys.tail, O);
  return Triple(_link(x[0], x[1], l, r), zs, ws);
}

/**
 * _O(n * log(n))_ A version of {@link OrdMap.fromList} that accepts a custom
 * combining function.
 *
 * @examples
 *
 * ```typescript
 * > OrdMap.fromListWith(List([5, 'a'], [3, 'b'], [5, 'c']), (y, x) => x + y)
 * // OrdMap([3, 'b'], [5, 'ac'])
 * ```
 */
OrdMap.fromListWith = <K, V>(
  xs: List<readonly [K, V]>,
  f: (newV: V, old: V, k: K) => V,
  O: Ord<K> = Ord.fromUniversalCompare(),
): OrdMap<K, V> =>
  xs.foldLeft(Empty as OrdMap<K, V>, (m, kv) =>
    m.insertWith(kv[0], kv[1], f, O),
  );

/**
 * _O(n)_ Builds a map from a {@link List} of key/value pairs where keys are
 * already in an ascending order.
 *
 * @see {@link Ord.fromList} for List with keys in no particular order
 */
OrdMap.fromDistinctAscList = <K, V>(
  xs: List<readonly [K, V]>,
): OrdMap<K, V> => {
  if (xs.isEmpty) return Empty;

  const x = xs.head;
  let m: OrdMap<K, V> = new Bin(1, x[0], x[1], Empty, Empty);
  let s = 1;
  xs = xs.tail;

  while (xs.nonEmpty) {
    const x = xs.head;
    const res = createAscList(s, xs.tail);
    m = _link(x[0], x[1], m, res.fst);
    xs = res.snd;
    s = s << 1;
  }

  return m;
};

function createAscList<K, V>(
  s: number,
  xs: List<readonly [K, V]>,
): Pair<OrdMap<K, V>, List<readonly [K, V]>> {
  if (xs.isEmpty) return Pair(Empty, xs);

  if (s === 1) {
    const x = xs.head;
    return Pair(new Bin(1, x[0], x[1], Empty, Empty), xs.tail);
  }

  const res = createAscList(s >> 1, xs);
  if (res.snd.isEmpty) return res;
  const { fst: l, snd: ys } = res;
  const { fst: r, snd: zs } = createAscList(s >> 1, ys.tail);
  const y = ys.head;
  return Pair(_link(y[0], y[1], l, r), zs);
}

export abstract class _OrdMap<out K, out V> {
  readonly _K!: () => K;
  readonly _V!: () => V;

  /**
   * _O(1)_ Returns `true` is the map is empty, or `false` otherwise.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.isEmpty
   * // true
   *
   * > OrdMap.singleton(3, 'a')
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
   * _O(n)_ Returns the size of the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.size
   * // 0
   *
   * > OrdMap.singleton(3, 'b').size
   * // 1
   *
   * > OrdMap.fromArray([[5, 'a'], [3, 'b'], [5, 'c']]).size
   * // 2
   * ```
   */
  public abstract readonly size: number;

  /**
   * _O(1)_ Returns a {@link View} of the maps's key/value pairs.
   *
   * @note The complexity of this method, i.e., creating a view is constant as
   * the view is a lazy collection. Although it's traversal is _O(n)_.
   */
  public get view(): View<[K, V]> {
    return View.build((ez, g) =>
      this.foldRight(ez, (v, eb, k) => g([k, v], eb)),
    );
  }

  /**
   * _O(n)_ Converts the map into an array of its key/value pairs with the keys in
   * ascending order.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.toArray
   * // []
   *
   * > OrdMap.singleton(3, 'b').toArray
   * // [[3, 'b']]
   *
   * > OrdMap.fromArray([[5, 'a'], [3, 'b'], [5, 'c']]).toArray
   * // [[3, 'b'], [5, 'c']]
   * ```
   */
  public get toArray(): [K, V][] {
    const xs = new Array<[K, V]>(this.size);
    let idx = 0;
    this.forEach((v, k) => (xs[idx++] = [k, v]));
    return xs;
  }

  /**
   * _O(n)_ Converts the map into a {@link List} of its key/value pairs with the
   * keys in ascending order.
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
   * > OrdMap.fromArray([[5, 'a'], [3, 'b'], [5, 'c']]).toArray
   * // List([3, 'b'], [5, 'c'])
   * ```
   */
  public get toList(): List<[K, V]> {
    return this.foldRight_(List.empty as List<[K, V]>, (v, xs, k) =>
      xs.cons([k, v]),
    );
  }

  /**
   * _O(1)_ Converts the map into a {@link LazyList} of its key/value pairs with
   * the keys in ascending order.
   *
   * @note The complexity of this method, i.e., creating a lazy list is constant
   * as the lazy list is a lazy collection. Although it's traversal is _O(n)_.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.toArray
   * // LazyList()
   *
   * > OrdMap.singleton(3, 'b').toArray
   * // LazyList([3, 'b'])
   *
   * > OrdMap.fromArray([[5, 'a'], [3, 'b'], [5, 'c']]).toArray
   * // LazyList([3, 'b'], [5, 'c'])
   * ```
   */
  public get toLazyList(): LazyList<[K, V]> {
    return LazyList.fromStepEval(
      this.foldRight_(
        Eval.now(LazyList.NilStep as LazyListStep<[K, V]>),
        (v, exs, k) => Eval.now(LazyList.consStep([k, v], exs)),
      ),
    );
  }

  /**
   * _O(1)_ Returns an iterator of the map's key/value pairs in an ascending order.
   *
   * @note The complexity of this method, i.e., creating an iterator is constant
   * as the iterator is a lazy collection. Although it's traversal is _O(n)_.
   */
  public get iterator(): Iterator<[K, V]> {
    return new OrdMapIterator(this, (k, v) => [k, v]);
  }
  public [Symbol.iterator](): Iterator<[K, V]> {
    return this.iterator;
  }

  /**
   * _O(1)_ Returns an iterator of the map's key/value pairs in an descending order.
   *
   * @note The complexity of this method, i.e., creating an iterator is constant
   * as the iterator is a lazy collection. Although it's traversal is _O(n)_.
   */
  public get reverseIterator(): Iterator<[K, V]> {
    return new OrdMapReversedIterator(this, (k, v) => [k, v]);
  }

  /**
   * _O(n)_ Return an array of the map's keys in an ascending order.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.keys
   * // []
   *
   * > OrdMap.singleton(3, 'b').keys
   * // [3]
   *
   * > OrdMap.fromArray([[5, 'a'], [3, 'b'], [5, 'c']]).keys
   * // [3, 5]
   * ```
   */
  public get keys(): K[] {
    const xs = new Array<K>(this.size);
    let idx = 0;
    this.forEach((_, k) => (xs[idx++] = k));
    return xs;
  }

  /**
   * _O(1)_ Return a view of the map's keys in an ascending order.
   *
   * @note The complexity of this method, i.e., creating a view is constant as
   * the view is a lazy collection. Although it's traversal is _O(n)_.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.keysView.toArray
   * // []
   *
   * > OrdMap.singleton(3, 'b').keysView.toArray
   * // [3]
   *
   * > OrdMap.fromArray([[5, 'a'], [3, 'b'], [5, 'c']]).keysView.toArray
   * // [3, 5]
   * ```
   */
  public get keysView(): View<K> {
    return View.build((ez, g) => Iter.foldRight_(this.keysIterator, ez, g));
  }

  /**
   * _O(1)_ Return an iterator of map's keys in ascending order.
   *
   * @note The complexity of this method, i.e., creating an iterator is constant
   * as the iterator is a lazy collection. Although it's traversal is _O(n)_.
   */
  public get keysIterator(): Iterator<K> {
    return new OrdMapIterator(this, (k, _) => k);
  }

  /**
   * _O(n)_ Return an array of the map's values.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.values
   * // []
   *
   * > OrdMap.singleton(3, 'b').values
   * // ['b']
   *
   * > OrdMap.fromArray([[5, 'a'], [3, 'b'], [5, 'c']]).values
   * // ['b', 'c'']
   * ```
   */
  public get values(): V[] {
    const xs = new Array<V>(this.size);
    let idx = 0;
    this.forEach((v, _) => (xs[idx++] = v));
    return xs;
  }

  /**
   * _O(1)_ Return a view of the map's values.
   *
   * @note The complexity of this method, i.e., creating a view is constant as
   * the view is a lazy collection. Although it's traversal is _O(n)_.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.valuesView.toArray
   * // []
   *
   * > OrdMap.singleton(3, 'b').valuesView.toArray
   * // ['b']
   *
   * > OrdMap.fromArray([[5, 'a'], [3, 'b'], [5, 'c']]).valuesView.toArray
   * // ['b', 'c'']
   * ```
   */
  public get valuesView(): View<V> {
    return View.build((ez, g) => Iter.foldRight_(this.valuesIterator, ez, g));
  }

  /**
   * _O(1)_ Return a iterator of the map's values.
   *
   * @note The complexity of this method, i.e., creating an iterator is constant
   * as the iterator is a lazy collection. Although it's traversal is _O(n)_.
   */
  public get valuesIterator(): Iterator<V> {
    return new OrdMapIterator(this, (_, v) => v);
  }

  // -- Min-Max

  /**
   * _O(log(n))_ Returns a value associated with a minimal key of the map.
   *
   * @note This method is partial.
   *
   * @see {@link minOption} for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').min
   * // 'a'
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).min
   * // 'b'
   *
   * > OrdMap.empty.min
   * // Uncaught Error: OrdMap.empty.min
   * ```
   */
  public get min(): V {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty'
      ? throwError(new Error('OrdMap.empty.min'))
      : n.lhs.minSure(n.value);
  }

  /**
   * _O(log(n))_ Returns an optional value associated with a minimal key of the
   * map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').minOption
   * // Some('a')
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).minOption
   * // Some('b')
   *
   * > OrdMap.empty.minOption
   * // None
   * ```
   */
  public get minOption(): Option<V> {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty' ? None : Some(n.lhs.minSure(n.value));
  }

  private minSure<V>(this: OrdMap<K, V>, v: V): V {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty' ? v : n.lhs.minSure(n.value);
  }

  /**
   * _O(log(n))_ Returns a key/value pair with the minimal key of the map.
   *
   * @note This method is partial.
   *
   * @see {@link minWithKeyOption} for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').minWithKey
   * // [3, 'a']
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).minWithKey
   * // [1, 'b']
   *
   * > OrdMap.empty.minWithKey
   * // Uncaught Error: OrdMap.empty.minWithKey
   * ```
   */
  public get minWithKey(): [K, V] {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty'
      ? throwError(new Error('OrdMap.empty.minWithKey'))
      : n.lhs.minWithKeySure(n.key, n.value);
  }

  /**
   * _O(log(n))_ Returns an optional key/value pair with the minimal key of the
   * map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').minWithKeyOption
   * // Some([3, 'a'])
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).minWithKeyOption
   * // Some([1, 'b'])
   *
   * > OrdMap.empty.minWithKeyOption
   * // None
   * ```
   */
  public get minWithKeyOption(): Option<[K, V]> {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty'
      ? None
      : Some(n.lhs.minWithKeySure(n.key, n.value));
  }

  /**
   * _O(log(n))_ Removes the minimal key from the map, optionally returning its
   * associated value and the remainder of the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').popMin
   * // Some(['a', OrdMap()])
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).popMin
   * // Some(['b', OrdMap([3, 'a'], [5, 'c'])])
   *
   * > OrdMap.empty.popMin
   * // None
   * ```
   */
  public get popMin(): Option<[V, OrdMap<K, V>]> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return None;
    const { v, m } = _getMinView(n.key, n.value, n.lhs, n.rhs);
    return Some([v, m]);
  }

  /**
   * _O(log(n))_ Removes the minimal key from the map, optionally returning its
   * entry pair and the remainder of the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').popMinWithKey
   * // Some([[3, 'a'], OrdMap()])
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).popMinWithKey
   * // Some([[1, 'b'], OrdMap([3, 'a'], [5, 'c'])])
   *
   * > OrdMap.empty.popMinWithKey
   * // None
   * ```
   */
  public get popMinWithKey(): Option<[[K, V], OrdMap<K, V>]> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return None;
    const { k, v, m } = _getMinView(n.key, n.value, n.lhs, n.rhs);
    return Some([[k, v], m]);
  }

  /**
   * _O(log(n))_ Removes the minimal key from the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').removeMin
   * // OrdMap()]
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).removeMin
   * // OrdMap([3, 'a'], [5, 'c'])
   *
   * > OrdMap.empty.removeMin
   * // OrdMap()
   * ```
   */
  public get removeMin(): OrdMap<K, V> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Empty;
    return n.removeMinImpl();
  }
  private removeMinImpl(this: Bin<K, V>): OrdMap<K, V> {
    const l = this.lhs as Node<K, V>;
    return l.tag === 'empty'
      ? this.rhs
      : _balanceR(this.key, this.value, l.removeMinImpl(), this.rhs);
  }

  private minWithKeySure<K, V>(this: OrdMap<K, V>, k: K, v: V): [K, V] {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty' ? [k, v] : n.lhs.minWithKeySure(n.key, n.value);
  }

  /**
   * _O(log(n))_ Returns a value associated with a maximal key of the map.
   *
   * @note This method is partial.
   *
   * @see {@link maxOption} for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').max
   * // 'a'
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).max
   * // 'c'
   *
   * > OrdMap.empty.max
   * // Uncaught Error: OrdMap.empty.max
   * ```
   */
  public get max(): V {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty'
      ? throwError(new Error('OrdMap.empty.max'))
      : n.rhs.maxSure(n.value);
  }

  /**
   * _O(log(n))_ Returns an optional value associated with a maximal key of the
   * map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').maxOption
   * // Some('a')
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).maxOption
   * // Some('c')
   *
   * > OrdMap.empty.maxOption
   * // None
   * ```
   */
  public get maxOption(): Option<V> {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty' ? None : Some(n.rhs.maxSure(n.value));
  }

  private maxSure<V>(this: OrdMap<K, V>, v: V): V {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty' ? v : n.rhs.maxSure(n.value);
  }

  /**
   * _O(log(n))_ Returns a key/value pair with the maximal key of the map.
   *
   * @note This method is partial.
   *
   * @see {@link maxWithKeyOption} for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').maxWithKey
   * // [3, 'a']
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).maxWithKey
   * // [5, 'c']
   *
   * > OrdMap.empty.maxWithKey
   * // Uncaught Error: OrdMap.empty.maxWithKey
   * ```
   */
  public get maxWithKey(): [K, V] {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty'
      ? throwError(new Error('OrdMap.empty.maxWithKey'))
      : n.rhs.maxWithKeySure(n.key, n.value);
  }

  /**
   * _O(log(n))_ Returns an optional key/value pair with the maximal key of the
   * map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').maxWithKeyOption
   * // Some([3, 'a'])
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).maxWithKeyOption
   * // Some([5, 'c'])
   *
   * > OrdMap.empty.maxWithKeyOption
   * // None
   * ```
   */
  public get maxWithKeyOption(): Option<[K, V]> {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty'
      ? None
      : Some(n.rhs.maxWithKeySure(n.key, n.value));
  }

  /**
   * _O(log(n))_ Removes the maximal key from the map, optionally returning its
   * associated value and the remainder of the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').popMax
   * // Some(['a', OrdMap()])
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).popMax
   * // Some(['c', OrdMap([1, 'b'], [3, 'b'])])
   *
   * > OrdMap.empty.popMax
   * // None
   * ```
   */
  public get popMax(): Option<[V, OrdMap<K, V>]> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return None;
    const { v, m } = _getMaxView(n.key, n.value, n.lhs, n.rhs);
    return Some([v, m]);
  }

  /**
   * _O(log(n))_ Removes the maximal key from the map, optionally returning its
   * entry pair and the remainder of the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').popMaxWithKey
   * // Some([[3, 'a'], OrdMap()])
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).popMaxWithKey
   * // Some([[5, 'c'], OrdMap([1, 'a'], [3, 'a'])])
   *
   * > OrdMap.empty.popMaxWithKey
   * // None
   * ```
   */
  public get popMaxWithKey(): Option<[[K, V], OrdMap<K, V>]> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return None;
    const { k, v, m } = _getMaxView(n.key, n.value, n.lhs, n.rhs);
    return Some([[k, v], m]);
  }

  /**
   * _O(log(n))_ Removes the maximal key from the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(3, 'a').removeMax
   * // OrdMap()]
   *
   * > OrdMap([3, 'a'], [1, 'b'], [5, 'c']).removeMax
   * // OrdMap([1, 'a'], [3, 'a'])
   *
   * > OrdMap.empty.removeMax
   * // OrdMap()
   * ```
   */
  public get removeMax(): OrdMap<K, V> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Empty;
    return n.removeMaxImpl();
  }
  private removeMaxImpl(this: Bin<K, V>): OrdMap<K, V> {
    const r = this.rhs as Node<K, V>;
    return r.tag === 'empty'
      ? this.lhs
      : _balanceL(this.key, this.value, this.lhs, r.removeMaxImpl());
  }

  private maxWithKeySure<K, V>(this: OrdMap<K, V>, k: K, v: V): [K, V] {
    const n = this as any as Node<K, V>;
    return n.tag === 'empty' ? [k, v] : n.rhs.maxWithKeySure(n.key, n.value);
  }

  // -- Querying

  /**
   * _O(log(n))_ Returns `true` if the given key `k` is present in the map, or
   * `false` otherwise.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.empty.contains(42)
   * // false
   *
   * > OrdMap.singleton(42, 'a').contains(42)
   * // true
   * ```
   */
  public contains<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): boolean {
    return this.containsImpl(k, O);
  }
  private containsImpl<K>(this: OrdMap<K, V>, k: K, O: Ord<K>): boolean {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return false;
    switch (O.compare(k, n.key)) {
      case Compare.LT:
        return n.lhs.containsImpl(k, O);
      case Compare.GT:
        return n.rhs.containsImpl(k, O);
      case Compare.EQ:
        return true;
    }
  }

  /**
   * _O(log(n))_ Returns a value associated with the given key.
   *
   * @note This method is partial
   * @see {@link lookup} for a safe variant
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(1, 'a').get(1)
   * // 'a'
   *
   * > OrdMap([5, 'a'], [3, 'b'], [5, 'c']).get(5)
   * // 'c'
   *
   * > OrdMap([5, 'a'], [3, 'b'], [5, 'c']).get(1)
   * // 'b'
   *
   * > OrdMap([5, 'a'], [3, 'b'], [5, 'c']).get(42)
   * // Uncaught Error: OrdMap.get: no such element
   * ```
   */
  public get<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): V {
    return this.getImpl(k, O);
  }
  /**
   * Alias for {@link get}.
   */
  public '!!'<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): V {
    return this.get(k, O);
  }
  private getImpl<K>(this: OrdMap<K, V>, k: K, O: Ord<K>): V {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') throw new Error('OrdMap.get: no such element');
    switch (O.compare(k, n.key)) {
      case Compare.LT:
        return n.lhs.getImpl(k, O);
      case Compare.GT:
        return n.rhs.getImpl(k, O);
      case Compare.EQ:
        return n.value;
    }
  }

  /**
   * _O(log(n))_ Optionally returns a value associated with the given key.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.singleton(1, 'a').lookup(1)
   * // Some('a')
   *
   * > OrdMap([5, 'a'], [3, 'b'], [5, 'c']).lookup(5)
   * // Some('c')
   *
   * > OrdMap([5, 'a'], [3, 'b'], [5, 'c']).lookup(1)
   * // Some('b')
   *
   * > OrdMap([5, 'a'], [3, 'b'], [5, 'c']).lookup(42)
   * // None
   * ```
   */
  public lookup<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Option<V> {
    return this.lookupImpl(k, O);
  }
  /**
   * Alias for {@link lookup}.
   */
  public '!?'<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Option<V> {
    return this.lookup(k, O);
  }
  private lookupImpl<K>(this: OrdMap<K, V>, k: K, O: Ord<K>): Option<V> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return None;
    switch (O.compare(k, n.key)) {
      case Compare.LT:
        return n.lhs.lookupImpl(k, O);
      case Compare.GT:
        return n.rhs.lookupImpl(k, O);
      case Compare.EQ:
        return Some(n.value);
    }
  }

  /**
   * _O(log(n))_ Finds the largest key, smaller than the provided one, and returns
   * its corresponding key/value pair.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupLT(3)
   * // None
   *
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupLT(4)
   * // Some([3, 'a'])
   * ```
   */
  public lookupLT<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Option<[K, V]> {
    return this.lookupLTNone(k, O);
  }
  private lookupLTNone<K>(this: OrdMap<K, V>, k: K, O: Ord<K>): Option<[K, V]> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return None;

    const { key, value } = n;
    return O.lte(k, key)
      ? n.lhs.lookupLTNone(k, O)
      : n.rhs.lookupLTSome(k, key, value, O);
  }
  private lookupLTSome<K, V>(
    this: OrdMap<K, V>,
    k: K,
    kx: K,
    kv: V,
    O: Ord<K>,
  ): Option<[K, V]> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return Some([kx, kv]);

    const { key, value } = n;
    return O.lte(k, key)
      ? n.lhs.lookupLTSome(k, kx, kv, O)
      : n.rhs.lookupLTSome(k, key, value, O);
  }

  /**
   * _O(log(n))_ Finds the smallest key, larger than the provided one, and returns
   * its corresponding key/value pair.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupGT(5)
   * // None
   *
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupGT(4)
   * // Some([5, 'b'])
   * ```
   */
  public lookupGT<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Option<[K, V]> {
    return this.lookupGTNone(k, O);
  }
  private lookupGTNone<K>(this: OrdMap<K, V>, k: K, O: Ord<K>): Option<[K, V]> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return None;

    const { key, value } = n;
    return O.lt(k, key)
      ? n.lhs.lookupGTSome(k, key, value, O)
      : n.rhs.lookupGTNone(k, O);
  }
  private lookupGTSome<K, V>(
    this: OrdMap<K, V>,
    k: K,
    kx: K,
    kv: V,
    O: Ord<K>,
  ): Option<[K, V]> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return Some([kx, kv]);

    const { key, value } = n;
    return O.lt(k, key)
      ? n.lhs.lookupGTSome(k, key, value, O)
      : n.rhs.lookupGTSome(k, kx, kv, O);
  }

  /**
   * _O(log(n))_ Finds the largest key, smaller or equal than the provided one,
   * and returns its corresponding key/value pair.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupLE(2)
   * // None
   *
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupLE(3)
   * // Some([3, 'a'])
   *
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupLE(4)
   * // Some([3, 'a'])
   * ```
   */
  public lookupLE<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Option<[K, V]> {
    return this.lookupLENone(k, O);
  }
  private lookupLENone<K>(this: OrdMap<K, V>, k: K, O: Ord<K>): Option<[K, V]> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return None;

    const { key, value } = n;
    switch (O.compare(k, key)) {
      case Compare.LT:
        return n.lhs.lookupLENone(k, O);
      case Compare.EQ:
        return Some([key, value]);
      case Compare.GT:
        return n.rhs.lookupLESome(k, key, value, O);
    }
  }
  private lookupLESome<K, V>(
    this: OrdMap<K, V>,
    k: K,
    kx: K,
    kv: V,
    O: Ord<K>,
  ): Option<[K, V]> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return Some([kx, kv]);

    const { key, value } = n;
    switch (O.compare(k, key)) {
      case Compare.LT:
        return n.lhs.lookupLESome(k, kx, kv, O);
      case Compare.EQ:
        return Some([key, value]);
      case Compare.GT:
        return n.rhs.lookupLESome(k, key, value, O);
    }
  }

  /**
   * _O(log(n))_ Finds the smallest key, larger or equal than the provided one,
   * and returns its corresponding key/value pair.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupGE(6)
   * // None
   *
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupGE(5)
   * // Some([5, 'b'])
   *
   * > OrdMap.fromArray([[3, 'a'], [5, 'b']]).lookupGE(4)
   * // Some([5, 'b'])
   * ```
   */
  public lookupGE<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Option<[K, V]> {
    return this.lookupGENone(k, O);
  }
  private lookupGENone<K>(this: OrdMap<K, V>, k: K, O: Ord<K>): Option<[K, V]> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return None;

    const { key, value } = n;
    switch (O.compare(k, key)) {
      case Compare.LT:
        return n.lhs.lookupGESome(k, key, value, O);
      case Compare.EQ:
        return Some([key, value]);
      case Compare.GT:
        return n.rhs.lookupGENone(k, O);
    }
  }
  private lookupGESome<K, V>(
    this: OrdMap<K, V>,
    k: K,
    kx: K,
    kv: V,
    O: Ord<K>,
  ): Option<[K, V]> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return Some([kx, kv]);

    const { key, value } = n;
    switch (O.compare(k, key)) {
      case Compare.LT:
        return n.lhs.lookupGESome(k, key, value, O);
      case Compare.EQ:
        return Some([key, value]);
      case Compare.GT:
        return n.rhs.lookupGESome(k, kx, kv, O);
    }
  }

  // -- Insertion

  /**
   * _O(log(n))_ Inserts a new key/value pair in the map. If the key is already
   * present, its associated value is replaced with the provided one.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([5,'a'], [3,'b']).insert(5, 'x')
   * // OrdMap([3,'b'], [5,'x'])
   *
   * > OrdMap([5,'a'], [3,'b']).insert(7, 'x')
   * // OrdMap([3,'b'], [5,'a'], [7, 'x'])
   *
   * > OrdMap.empty.insert(42, 'x')
   * // OrdMap([42,'x'])
   * ```
   */
  public insert<K, V>(
    this: OrdMap<K, V>,
    k: K,
    v: V,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.insertImpl(k, v, O);
  }
  private insertImpl<K, V>(
    this: OrdMap<K, V>,
    k: K,
    v: V,
    O: Ord<K>,
  ): OrdMap<K, V> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return new Bin(1, k, v, Empty, Empty);

    const { key, value, lhs, rhs } = n;
    switch (O.compare(k, key)) {
      case Compare.LT: {
        const l = lhs.insertImpl(k, v, O);
        return l === n.lhs ? n : _balanceL(key, value, l, rhs);
      }
      case Compare.GT: {
        const r = rhs.insertImpl(k, v, O);
        return r === n.rhs ? n : _balanceR(key, value, lhs, r);
      }
      case Compare.EQ:
        return v === n.value ? n : new Bin(n.size, k, v, n.lhs, n.rhs);
    }
  }

  /**
   * _O(log(n))_ A variant of {@link insert} that takes a user-supplied combining
   * function `f`, with accepting `newValue`, `oldValue` and `key`, and returning
   * a resolved value to be placed in the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([5,'a'], [3,'b']).insertWith(5, 'x', (n, o) => `${n}|${o}`)
   * // OrdMap([3,'b'], [5,'x|a'])
   *
   * > OrdMap([5,'a'], [3,'b']).insertWith(7, 'x', (n, o) => `${n}|${o}`)
   * // OrdMap([3,'b'], [5,'a'], [7, 'x'])
   *
   * > OrdMap.empty.insertWith(42, 'x', (n, o) => `${n}|${o}`)
   * // OrdMap([42,'x'])
   * ```
   */
  public insertWith<K, V>(
    this: OrdMap<K, V>,
    k: K,
    v: V,
    f: (newV: V, old: V, k: K) => V,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.insertWithImpl(k, v, f, O);
  }
  private insertWithImpl<K, V>(
    this: OrdMap<K, V>,
    k: K,
    v: V,
    f: (newV: V, old: V, k: K) => V,
    O: Ord<K>,
  ): OrdMap<K, V> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return new Bin(1, k, v, Empty, Empty);

    const { key, value, lhs, rhs } = n;
    switch (O.compare(k, n.key)) {
      case Compare.LT:
        return _balanceL(key, value, lhs.insertWithImpl(k, v, f, O), rhs);
      case Compare.GT:
        return _balanceR(key, value, lhs, rhs.insertWithImpl(k, v, f, O));
      case Compare.EQ:
        return new Bin(n.size, key, f(v, value, key), lhs, rhs);
    }
  }

  /**
   * A right-bias version of {@link insert} used internally by the {@link union}
   * method.
   */
  private insertR<K, V>(
    this: OrdMap<K, V>,
    k: K,
    v: V,
    O: Ord<K>,
  ): OrdMap<K, V> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return new Bin(1, k, v, Empty, Empty);

    const { key, value, lhs, rhs } = n;
    switch (O.compare(k, n.key)) {
      case Compare.LT: {
        const l = lhs.insertR(k, v, O);
        return l === n.lhs ? n : _balanceL(key, value, l, rhs);
      }
      case Compare.GT: {
        const r = rhs.insertR(k, v, O);
        return r === n.rhs ? n : _balanceR(key, value, lhs, r);
      }
      case Compare.EQ:
        return n;
    }
  }

  /**
   * A version of {@link insertWith} that has reversed new and old values in the
   * combining function  used internally by the {@link unionWith} method.
   */
  private insertWithR<K, V>(
    this: OrdMap<K, V>,
    k: K,
    v: V,
    f: (old: V, newV: V, k: K) => V,
    O: Ord<K>,
  ): OrdMap<K, V> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return new Bin(1, k, v, Empty, Empty);

    const { key, value, lhs, rhs } = n;
    switch (O.compare(k, n.key)) {
      case Compare.LT:
        return _balanceL(key, value, lhs.insertWithR(k, v, f, O), rhs);
      case Compare.GT:
        return _balanceR(key, value, lhs, rhs.insertWithR(k, v, f, O));
      case Compare.EQ:
        return new Bin(n.size, key, f(value, v, key), lhs, rhs);
    }
  }

  // -- Remove/Update

  /**
   * _O(log(n))_ Removes an entry associated with the given key `k`. If the key
   * does not exist in the map, the original map is returned.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([1, 'a'], [3, 'b'], [5, 'c']).remove(3)
   * OrdMap([1, 'a'], [5, 'c'])
   *
   * > OrdMap([1, 'a'], [3, 'b'], [5, 'c']).remove(7)
   * OrdMap([1, 'a'], [3, 'b'], [5, 'c'])
   *
   * > OrdMap.empty.remove(7)
   * OrdMap()
   * ```
   */
  public remove<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.removeImpl(k, O);
  }
  private removeImpl<K>(this: OrdMap<K, V>, k: K, O: Ord<K>): OrdMap<K, V> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return Empty;

    const { key, value, lhs, rhs } = n;
    switch (O.compare(k, key)) {
      case Compare.LT: {
        const l = lhs.removeImpl(k, O);
        return l === lhs ? n : _balanceR(key, value, l, rhs);
      }
      case Compare.GT: {
        const r = rhs.removeImpl(k, O);
        return r === rhs ? n : _balanceL(key, value, lhs, r);
      }
      case Compare.EQ:
        return _glue(lhs, rhs);
    }
  }

  /**
   * _O(log(n))_ Update a value at the specific key with the result of the
   * provided function. When the key is not in the map, the original map is
   * returned.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([1, 'a'], [3, 'b'], [5, 'c']]).adjust(5, x => `new ${x}`)
   * // OrdMap([1, 'a'], [3, 'b'], [5, 'new c'])
   *
   * > OrdMap([1, 'a'], [3, 'b'], [5, 'c']]).adjust(7, x => `new ${x}`)
   * // OrdMap([1, 'a'], [3, 'b'], [5, 'c'])
   *
   * > OrdMap.empty.adjust(7, x => `new ${x}`)
   * // OrdMap()
   * ```
   */
  public adjust<K, V>(
    this: OrdMap<K, V>,
    k: K,
    f: (v: V, k: K) => V,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.adjustImpl(k, f, O);
  }
  private adjustImpl<K>(
    this: OrdMap<K, V>,
    k: K,
    f: (v: V, k: K) => V,
    O: Ord<K>,
  ): OrdMap<K, V> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return Empty;

    const { size, key, value, lhs, rhs } = n;
    switch (O.compare(k, key)) {
      case Compare.LT: {
        const l = lhs.adjustImpl(k, f, O);
        return l === lhs ? n : new Bin(size, key, value, l, rhs);
      }
      case Compare.GT: {
        const r = rhs.adjustImpl(k, f, O);
        return r === rhs ? n : new Bin(size, key, value, lhs, r);
      }
      case Compare.EQ: {
        const v = f(value, key);
        return value === v ? n : new Bin(size, key, v, lhs, rhs);
      }
    }
  }

  /**
   * _O(log(n))_ Updates the value associated with the give key with the result
   * of the function `f`. If the result is `Some(x)`, the returned value `x` is
   * associated with the given key, otherwise the entry is removed from the map.
   *
   * @examples
   *
   * ```typescript
   * > const f = (x: string) => x === 'a' ? None : Some(`new ${x}`})
   *
   * > OrdMap([1, 'a'], [3, 'b'], [5, 'c']]).adjust(3, f)
   * OrdMap([1, 'a'], [3, 'new b'], [5, 'c']])
   *
   * > OrdMap([1, 'a'], [3, 'b'], [5, 'c']]).adjust(1, f)
   * OrdMap([3, 'new b'], [5, 'c']])
   * ```
   */
  public update<K>(
    this: OrdMap<K, V>,
    k: K,
    f: (v: V, k: K) => Option<V>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.updateImpl(k, f, O);
  }
  private updateImpl<K>(
    this: OrdMap<K, V>,
    k: K,
    f: (v: V, k: K) => Option<V>,
    O: Ord<K>,
  ): OrdMap<K, V> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return Empty;

    const { size, key, value, lhs, rhs } = n;
    switch (O.compare(k, key)) {
      case Compare.LT: {
        const l = lhs.updateImpl(k, f, O);
        return l === lhs ? n : _balanceR(key, value, l, rhs);
      }
      case Compare.GT: {
        const r = rhs.updateImpl(k, f, O);
        return r === rhs ? n : _balanceL(key, value, lhs, r);
      }
      case Compare.EQ: {
        const ov = f(value, key);
        if (ov.isEmpty) return _glue(lhs, rhs);
        const v = ov.get;
        return value === v ? n : new Bin(size, key, v, lhs, rhs);
      }
    }
  }

  /**
   * _O(log(n))_ Updates the value associated with the given key `k`, or absence
   * thereof. Thus, {@link alter} can be used to insert, modify, or delete values
   * in the map.
   *
   * @examples
   *
   * ```typescript
   * > const f = _ => None
   *
   * > OrdMap([5, 'a'], [3, 'b']).alter(7, f)
   * // OrdMap([3, 'b'], [5, 'a'])
   *
   * > OrdMap([5, 'a'], [3, 'b']).alter(5, f)
   * // OrdMap([3, 'b'])
   *
   * > const g = _ => Some('c')
   *
   * > OrdMap([5, 'a'], [3, 'b']).alter(7, g)
   * // OrdMap([3, 'b'], [5, 'a'], [7, 'c'])
   *
   * > OrdMap([5, 'a'], [3, 'b']).alter(5, g)
   * // OrdMap([3, 'b'], [5, 'c'])
   * ```
   */
  public alter<K>(
    this: OrdMap<K, V>,
    k: K,
    f: (v: Option<V>, k: K) => Option<V>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.alterImpl(k, f, O);
  }
  private alterImpl<K>(
    this: OrdMap<K, V>,
    k: K,
    f: (v: Option<V>, k: K) => Option<V>,
    O: Ord<K>,
  ): OrdMap<K, V> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') {
      const ov = f(None, k);
      return ov.isEmpty ? Empty : new Bin(1, k, ov.get, Empty, Empty);
    }

    const { size, key, value, lhs, rhs } = n;
    switch (O.compare(k, key)) {
      case Compare.LT: {
        const l = lhs.alterImpl(k, f, O);
        return l === lhs ? n : _link(key, value, l, rhs);
      }
      case Compare.EQ: {
        const ov = f(Some(value), key);
        if (ov.isEmpty) return _link2(lhs, rhs);
        const v = ov.get;
        return value === v ? n : new Bin(size, key, v, lhs, rhs);
      }
      case Compare.GT: {
        const r = rhs.alterImpl(k, f, O);
        return r === rhs ? n : _link(key, value, lhs, r);
      }
    }
  }

  /**
   * _O(log(n))_ An effectful version of {@link alter}. {@link alterF} is the
   * most general operation when working with individual key/value pairs that may,
   * or may not be in the map as it permits insertion, update and deletion.
   *
   * {@link alterF} provides specialized implementations when for {@link Identity}
   * and {@link Const} functors:
   *
   * * `m.alterF(Identity.Functor, k, f) === m.alter(k, f)`
   * * `m.alterF(Const.Functor(), k, f) === f(m.lookup(k))`
   *
   */
  public alterF<F, K>(
    this: OrdMap<K, V>,
    F: Functor<F>,
    k: K,
    f: (v: Option<V>, k: K) => Kind<F, [Option<V>]>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Kind<F, [OrdMap<K, V>]> {
    return isIdentityTC(F)
      ? (this.alterImpl(k, f as any, O) as any)
      : isConstTC(F)
      ? f(this.lookupImpl(k, O), k)
      : this.alterFImpl(F, k, f, O);
  }
  private alterFImpl<F, K>(
    this: OrdMap<K, V>,
    F: Functor<F>,
    k: K,
    f: (v: Option<V>, k: K) => Kind<F, [Option<V>]>,
    O: Ord<K>,
  ): Kind<F, [OrdMap<K, V>]> {
    const v1 = this.lookupImpl(k, O);
    return F.map_(f(v1, k), v2 =>
      v1.isEmpty && v2.isEmpty
        ? this
        : v2.isEmpty
        ? this.removeImpl(k, O)
        : this.insertImpl(k, v2.get, O),
    );
  }

  // -- Union

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Returns a left-bias union of maps.
   * In case there are duplicate keys between the maps, the values from the `this`
   * map will be preserved.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([3, 'a'], [5, 'b']).union(OrdMap([5, 'B'], [7, 'C']))
   * // OrdMap([3, 'a'], [5, 'b'], [7, 'C'])
   * ```
   */
  public union<K, V>(
    this: OrdMap<K, V>,
    that: OrdMap<K, V>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.unionImpl(that, O);
  }
  private unionImpl<K, V>(
    this: OrdMap<K, V>,
    that: OrdMap<K, V>,
    O: Ord<K>,
  ): OrdMap<K, V> {
    const n1 = this as Node<K, V>;
    if (n1.tag === 'empty') return that;
    const n2 = that as Node<K, V>;
    if (n2.tag === 'empty') return this;

    if (n2.size === 1) return n1.insertR(n2.key, n2.value, O);
    if (n1.size === 1) return n2.insertImpl(n1.key, n1.value, O);

    const { lt: l2, gt: r2 } = n2.splitImpl(n1.key, O);
    const l1l2 = n1.lhs.unionImpl(l2, O);
    const r1r2 = n1.rhs.unionImpl(r2, O);

    return l1l2 === n1.lhs && r1r2 === n1.rhs
      ? n1
      : _link(n1.key, n1.value, l1l2, r1r2);
  }

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ A version of {@link union} using
   * a user-supplied combining function `f`.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([3, 'a'], [5, 'b']).unionWith(OrdMap([5, 'B'], [7, 'C']), (x, y) => x + y)
   * // OrdMap([3, 'a'], [5, 'bB'], [7, 'C'])
   * ```
   */
  public unionWith<K, V>(
    this: OrdMap<K, V>,
    that: OrdMap<K, V>,
    f: (l: V, r: V, k: K) => V,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.unionWithImpl(that, f, O);
  }
  private unionWithImpl<K, V>(
    this: OrdMap<K, V>,
    that: OrdMap<K, V>,
    f: (l: V, r: V, k: K) => V,
    O: Ord<K>,
  ): OrdMap<K, V> {
    const n1 = this as Node<K, V>;
    if (n1.tag === 'empty') return that;
    const n2 = that as Node<K, V>;
    if (n2.tag === 'empty') return this;

    if (n2.size === 1) return n1.insertWithR(n2.key, n2.value, f, O);
    if (n1.size === 1) return n2.insertWithImpl(n1.key, n1.value, f, O);

    const { lt: l2, gt: r2, ...r } = n2.splitLookupImpl(n1.key, O);
    const l1l2 = n1.lhs.unionWithImpl(l2, f, O);
    const r1r2 = n1.rhs.unionWithImpl(r2, f, O);

    const { key, value } = n1;
    return r.found
      ? _link(key, f(value, r.value, key), l1l2, r1r2)
      : _link(key, value, l1l2, r1r2);
  }

  // -- Difference

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Returns a difference of two maps.
   * The resulting maps contains key/value pairs of the first map, which keys
   * are not present in the second one.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([3, 'a'], [5, 'b'])['\\'](OrdMap([5, 'B'], [7, 'C']))
   * // OrdMap([3, 'a'])
   * ```
   */
  public difference<K, V1, V2>(
    this: OrdMap<K, V1>,
    that: OrdMap<K, V2>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V1> {
    return this.differenceImpl(that, O);
  }
  private differenceImpl<K, V1, V2>(
    this: OrdMap<K, V1>,
    that: OrdMap<K, V2>,
    O: Ord<K>,
  ): OrdMap<K, V1> {
    const n1 = this as Node<K, V1>;
    if (n1.tag === 'empty') return Empty;
    const n2 = that as Node<K, V2>;
    if (n2.tag === 'empty') return this;

    const { lt: l1, gt: r1 } = n1.splitImpl(n2.key, O);
    const l1l2 = l1.differenceImpl(n2.lhs, O);
    const r1r2 = r1.differenceImpl(n2.rhs, O);

    return l1l2.size + r1r2.size === n1.size ? n1 : _link2(l1l2, r1r2);
  }
  /**
   * Alias for {@link difference}
   */
  public '\\'<K, V1, V2>(
    this: OrdMap<K, V1>,
    that: OrdMap<K, V2>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V1> {
    return this.difference(that, O);
  }

  /**
   * _O(m + n)_ A version of the {@link difference} using a user-supplied combining
   * function `f`. Should the function return `None`, the element is removed from
   * the resulting set, otherwise its value is updated with the function's result.
   *
   * @examples
   *
   * ```typescript
   * > const f = (x, y) => x === 'b' ? None : Some(x + ':' + y)
   * > OrdMap([3, 'a'], [5, 'b']).differenceWith(OrdMap([3, 'A'], [5, 'B'], [7, 'C']), f)
   * // OrdMap([3, 'a:A'])
   * ```
   */
  public differenceWith<K, V1, V2>(
    this: OrdMap<K, V1>,
    that: OrdMap<K, V2>,
    f: (v1: V1, v2: V2, k: K) => Option<V1>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V1> {
    return this.mergeImpl(
      that,
      { missingSubtree: id, missingKey: (k, x) => Some(x) },
      { missingSubtree: _ => Empty, missingKey: _ => None },
      (k, v1, v2) => f(v1, v2, k),
      O,
    );
  }

  /**
   * _O(m + n)_ Calculates a symmetric difference of two maps
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([3, 'a'], [5, 'b'])['\\/'](OrdMap([5, 'B'], [7, 'C']))
   * // OrdMap([3, 'a'], [7, 'C'])
   * ```
   */
  public symmetricDifference<K, V>(
    this: OrdMap<K, V>,
    that: OrdMap<K, V>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.difference(that, O).union(that.difference(this));
  }
  /**
   * Alias for {@link symmetricDifference}.
   */
  public '\\//'<K, V>(
    this: OrdMap<K, V>,
    that: OrdMap<K, V>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.symmetricDifference(that, O);
  }

  // -- Intersection

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Returns an intersection of two maps.
   * The resulting maps contains key/value pairs of the first map, which keys
   * are present in the second one as well.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([3, 'a'], [5, 'b']).intersect(OrdMap([5, 'B'], [7, 'C']))
   * // OrdMap([5, 'b'])
   * ```
   */
  public intersect<K, V1, V2>(
    this: OrdMap<K, V1>,
    that: OrdMap<K, V2>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V1> {
    return this.intersectImpl(that, O);
  }
  private intersectImpl<K, V1, V2>(
    this: OrdMap<K, V1>,
    that: OrdMap<K, V2>,
    O: Ord<K>,
  ): OrdMap<K, V1> {
    const n1 = this as Node<K, V1>;
    if (n1.tag === 'empty') return Empty;
    const n2 = that as Node<K, V2>;
    if (n2.tag === 'empty') return Empty;

    const { lhs, rhs } = n1;
    const { lt: l2, found, gt: r2 } = n2.splitContainsImpl(n1.key, O);
    const l1l2 = lhs.intersectImpl(l2, O);
    const r1r2 = rhs.intersectImpl(r2, O);

    return found
      ? l1l2 === lhs && r1r2 === rhs
        ? n1
        : _link(n1.key, n1.value, l1l2, r1r2)
      : _link2(l1l2, r1r2);
  }

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ A version of {@link intersect}
   * which uses a user-supplied combining function `f`.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([3, 'a'], [5, 'b']).intersectWith(OrdMap([5, 'B'], [7, 'C']), (x, y) => x + ':' + y)
   * // OrdMap([5, 'b:B']])
   * ```
   */
  public intersectWith<K, V1, V2, C>(
    this: OrdMap<K, V1>,
    that: OrdMap<K, V2>,
    f: (v1: V1, v2: V2, k: K) => C,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, C> {
    return this.intersectWithImpl(that, f, O);
  }
  private intersectWithImpl<K, V1, V2, C>(
    this: OrdMap<K, V1>,
    that: OrdMap<K, V2>,
    f: (v1: V1, v2: V2, k: K) => C,
    O: Ord<K>,
  ): OrdMap<K, C> {
    const n1 = this as Node<K, V1>;
    if (n1.tag === 'empty') return Empty;
    const n2 = that as Node<K, V2>;
    if (n2.tag === 'empty') return Empty;

    const { lt, gt, ...r } = n2.splitLookupImpl(n1.key, O);
    const l1l2 = n1.lhs.intersectWithImpl(lt, f, O);
    const r1r2 = n1.rhs.intersectWithImpl(gt, f, O);

    return r.found
      ? _link(n1.key, f(n1.value, r.value, n1.key), l1l2, r1r2)
      : _link2(l1l2, r1r2);
  }

  // -- Disjoint

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Returns `true` if the key sets
   * of both maps are disjoint
   *
   * `m.disjoint(n)` is equivalent to `m.intersect(n).isEmpty`
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([3, 'a'], [5, 'b']).disjoint(OrdMap([5, 'B'], [7, 'C']))
   * // false
   *
   * > OrdMap([3, 'a'], [5, 'b']).disjoint(OrdMap([7, 'C']))
   * // true
   *
   * > OrdMap([3, 'a'], [5, 'b']).disjoint(OrdMap.empty)
   * // true
   *
   * > OrdMap.empty.disjoint(OrdMap.empty)
   * // true
   * ```
   */
  public disjoint<K, V>(
    this: OrdMap<K, V>,
    that: OrdMap<K, V>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): boolean {
    return this.disjointImpl(that, O);
  }
  private disjointImpl<K, V>(
    this: OrdMap<K, V>,
    that: OrdMap<K, V>,
    O: Ord<K>,
  ): boolean {
    const n1 = this as Node<K, V>;
    if (n1.tag === 'empty') return true;
    const n2 = that as Node<K, V>;
    if (n2.tag === 'empty') return true;

    if (n1.size === 1) return !that.containsImpl(n1.key, O);
    if (n2.size === 1) return !this.containsImpl(n2.key, O);

    const { lt: l, found, gt: r } = n2.splitContainsImpl(n1.key, O);

    return !found && n1.lhs.disjointImpl(l, O) && n1.rhs.disjointImpl(r, O);
  }

  // -- Merging

  /**
   * _O(m * log( (n + 1) / (m + 1) )), m <= n_ Merges two maps according to the
   * {@link WhenMissing} and {@link WhenMatched} strategies.
   */
  public merge<K, A, B, C>(
    this: OrdMap<K, A>,
    that: OrdMap<K, B>,
    lm: WhenMissing<IdentityF, K, A, C>,
    rm: WhenMissing<IdentityF, K, B, C>,
    f: WhenMatched<IdentityF, K, A, B, C>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, C> {
    return this.mergeImpl(that, lm, rm, f, O);
  }
  private mergeImpl<K, A, B, C>(
    this: OrdMap<K, A>,
    that: OrdMap<K, B>,
    lm: WhenMissing<IdentityF, K, A, C>,
    rm: WhenMissing<IdentityF, K, B, C>,
    f: WhenMatched<IdentityF, K, A, B, C>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, C> {
    const n1 = this as Node<K, A>;
    if (n1.tag === 'empty') return rm.missingSubtree(that);
    const n2 = that as Node<K, B>;
    if (n2.tag === 'empty') return lm.missingSubtree(this);

    const { key, value, lhs, rhs } = n1;
    const { lt, gt, ...r } = n2.splitLookupImpl(key, O);

    const l1l2 = lhs.mergeImpl(lt, lm, rm, f, O);
    const r1r2 = rhs.mergeImpl(gt, lm, rm, f, O);

    const c = r.found ? f(key, value, r.value) : lm.missingKey(key, value);
    return c.isEmpty ? _link2(l1l2, r1r2) : _link(key, c.get, l1l2, r1r2);
  }

  /**
   * An applicative version of {@link merge}.
   */
  public mergeA<F, K, A, B, C>(
    this: OrdMap<K, A>,
    F: Applicative<F>,
    that: OrdMap<K, B>,
    lm: WhenMissing<F, K, A, C>,
    rm: WhenMissing<F, K, B, C>,
    f: WhenMatched<F, K, A, B, C>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Kind<F, [OrdMap<K, C>]> {
    return isIdentityTC(F)
      ? (this.mergeImpl(that, lm as any, rm as any, f as any, O) as any)
      : Apply.TraverseStrategy(F)(Rhs =>
          Rhs.toG(this.mergeAImpl(F, Rhs, that, lm, rm, f, O)),
        );
  }

  private mergeAImpl<F, Rhs, K, A, B, C>(
    this: OrdMap<K, A>,
    F: Applicative<F>,
    Rhs: TraverseStrategy<F, Rhs>,
    that: OrdMap<K, B>,
    lm: WhenMissing<F, K, A, C>,
    rm: WhenMissing<F, K, B, C>,
    f: WhenMatched<F, K, A, B, C>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Kind<Rhs, [Kind<F, [OrdMap<K, C>]>]> {
    const n1 = this as Node<K, A>;
    if (n1.tag === 'empty') return Rhs.toRhs(() => rm.missingSubtree(that));
    const n2 = that as Node<K, B>;
    if (n2.tag === 'empty') return Rhs.toRhs(() => lm.missingSubtree(this));

    const { key, value, lhs, rhs } = n1;
    const { lt, gt, ...r } = n2.splitLookupImpl(key, O);

    const l1l2 = lhs.mergeAImpl(F, Rhs, lt, lm, rm, f, O);
    const r1r2 = rhs.mergeAImpl(F, Rhs, gt, lm, rm, f, O);

    const fc = r.found
      ? Rhs.toRhs(() => f(key, value, r.value))
      : Rhs.toRhs(() => lm.missingKey(key, value));

    return Rhs.map2(
      l1l2,
      Rhs.map2(fc, r1r2, (c, kc) => [c, kc] as const),
      (l, [c, r]) => (c.isEmpty ? _link2(l, r) : _link(key, c.get, l, r)),
    );
  }

  // -- Filter and partition

  public filter<K, K2 extends K>(
    this: OrdMap<K, V>,
    p: (v: V, k: K) => k is K2,
  ): OrdMap<K2, V>;
  public filter<V, V2 extends V>(
    this: OrdMap<K, V>,
    p: (v: V, k: K) => v is V2,
  ): OrdMap<K, V2>;
  public filter(p: (v: V, k: K) => boolean): OrdMap<K, V>;
  public filter(p: (v: V, k: K) => boolean): OrdMap<K, V> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Empty;

    const { size, key, value, lhs, rhs } = n;
    if (size === 1) return p(value, key) ? n : Empty;

    const l = lhs.filter(p);
    const r = rhs.filter(p);

    return p(value, key)
      ? l === lhs && r === rhs
        ? n
        : _link(key, value, l, r)
      : _link2(l, r);
  }

  public filterNot(p: (v: V, k: K) => boolean): OrdMap<K, V> {
    return this.filter((k, v) => !p(k, v));
  }

  public collect<B>(f: (v: V, k: K) => Option<B>): OrdMap<K, B> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Empty;

    const { size, key, value, lhs, rhs } = n;
    if (size === 1) {
      const x = f(value, key);
      return x.nonEmpty ? new Bin(1, key, x.get, Empty, Empty) : Empty;
    }

    const l = lhs.collect(f);
    const r = rhs.collect(f);

    const x = f(value, key);

    return x.nonEmpty ? _link(key, x.get, l, r) : _link2(l, r);
  }

  public partition(p: (v: V, k: K) => boolean): [OrdMap<K, V>, OrdMap<K, V>] {
    const { fst, snd } = this.partitionImpl(p);
    return [fst, snd];
  }
  public partitionImpl(
    p: (v: V, k: K) => boolean,
  ): Pair<OrdMap<K, V>, OrdMap<K, V>> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Pair(Empty, Empty);
    const { key, value, lhs, rhs } = n;
    const { fst: l1, snd: r1 } = lhs.partitionImpl(p);
    const { fst: l2, snd: r2 } = rhs.partitionImpl(p);
    return p(value, key)
      ? Pair(_link(key, value, l1, l2), _link2(r1, r2))
      : Pair(_link2(l1, l2), _link(key, value, r1, r2));
  }

  public partitionMap<L, R>(
    p: (v: V, k: K) => Either<L, R>,
  ): [OrdMap<K, L>, OrdMap<K, R>] {
    const { fst, snd } = this.partitionMapImpl(p);
    return [fst, snd];
  }
  public partitionMapImpl<L, R>(
    p: (v: V, k: K) => Either<L, R>,
  ): Pair<OrdMap<K, L>, OrdMap<K, R>> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Pair(Empty, Empty);
    const { key, value, lhs, rhs } = n;
    const { fst: l1, snd: r1 } = lhs.partitionMapImpl(p);
    const { fst: l2, snd: r2 } = rhs.partitionMapImpl(p);
    const lr = p(value, key);
    return lr.isEmpty
      ? Pair(_link(key, lr.getLeft, l1, l2), _link2(r1, r2))
      : Pair(_link2(l1, l2), _link(key, lr.get, r1, r2));
  }

  /**
   * _O(log(n))_ Returns a tuple `[m1, m2]`, where `m1` is a map with keys
   * smaller than the provided key `k`, and the `m2` with larger than `k`.
   */
  public split<K, V>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): [OrdMap<K, V>, OrdMap<K, V>] {
    const { lt, gt } = this.splitImpl(k, O);
    return [lt, gt];
  }
  private splitImpl<K, V>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K>,
  ): { lt: OrdMap<K, V>; gt: OrdMap<K, V> } {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return { lt: Empty, gt: Empty };

    const { key, value, lhs, rhs } = n;
    switch (O.compare(k, key)) {
      case Compare.LT: {
        const { lt, gt } = lhs.splitImpl(k, O);
        return { lt, gt: _link(key, value, gt, rhs) };
      }
      case Compare.GT: {
        const { lt, gt } = rhs.splitImpl(k, O);
        return { lt: _link(key, value, lhs, lt), gt };
      }
      case Compare.EQ:
        return { lt: lhs, gt: rhs };
    }
  }

  /**
   * _O(log(n))_ Returns a tripe `[m1, found, m2]`, where `m1` is a map with keys
   * smaller than the provided key `k`, and the `m2` with larger than `k`. The
   * `found` is a boolean which is `true` if `k` was part of the original map,
   * or `false` otherwise.
   */
  public splitContains<K, V>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): [OrdMap<K, V>, boolean, OrdMap<K, V>] {
    const { lt, found, gt } = this.splitContainsImpl(k, O);
    return [lt, found, gt];
  }
  private splitContainsImpl<K, V>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K>,
  ): { lt: OrdMap<K, V>; found: boolean; gt: OrdMap<K, V> } {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return { lt: Empty, found: false, gt: Empty };

    const cmp = O.compare(k, n.key);
    const { key, value, lhs, rhs } = n;
    switch (cmp) {
      case Compare.LT: {
        const { lt, found, gt } = lhs.splitContainsImpl(k, O);
        return { lt, found, gt: _link(key, value, gt, rhs) };
      }
      case Compare.GT: {
        const { lt, found, gt } = rhs.splitContainsImpl(k, O);
        return { lt: _link(key, value, lhs, lt), found, gt };
      }
      case Compare.EQ:
        return { lt: lhs, found: true, gt: rhs };
    }
  }

  /**
   * _O(log(n))_ Returns a tripe `[m1, value, m2]`, where `m1` is a map with keys
   * smaller than the provided key `k`, and the `m2` with larger than `k`. The
   * `value` is an optional value that is returned if `k` is present in the
   * original map.
   */
  public splitLookup<K, V>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): [OrdMap<K, V>, Option<V>, OrdMap<K, V>] {
    const { lt, gt, ...r } = this.splitLookupImpl(k, O);
    return r.found ? [lt, Some(r.value), gt] : [lt, None, gt];
  }
  private splitLookupImpl<K, V>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K>,
  ):
    | { lt: OrdMap<K, V>; found: true; value: V; gt: OrdMap<K, V> }
    | { lt: OrdMap<K, V>; found: false; value: undefined; gt: OrdMap<K, V> } {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') {
      return { lt: Empty, found: false, value: undefined, gt: Empty };
    }

    const cmp = O.compare(k, n.key);
    const { key, value, lhs, rhs } = n;
    switch (cmp) {
      case Compare.LT: {
        const { gt, ...xs } = lhs.splitLookupImpl(k, O);
        return { ...xs, gt: _link(key, value, gt, rhs) };
      }
      case Compare.GT: {
        const { lt, ...xs } = rhs.splitLookupImpl(k, O);
        return { lt: _link(key, value, lhs, lt), ...xs };
      }
      case Compare.EQ:
        return { lt: lhs, found: true, value: n.value, gt: rhs };
    }
  }

  // -- Mapping

  /**
   * _O(n)_ Transforms all elements of the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([1, 'a'], [3, 'b'], [5, 'c']).map(x => `${x}x`)
   * // OrdMap([1, 'ax'], [3, 'bx'], [5, 'cx'])
   * ```
   */
  public map<B>(f: (v: V, k: K) => B): OrdMap<K, B> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Empty;
    const { size, key, value, lhs, rhs } = n;
    return size === 1
      ? new Bin(1, key, f(value, key), Empty, Empty)
      : new Bin(size, key, f(value, key), lhs.map(f), rhs.map(f));
  }

  /**
   * _O(n)_ Threads an accumulating value through the map in ascending order.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([3, 'a'], [5, 'b']).mapAccumL('', (ac, v) => [v + 'x', ac + v])
   * // [OrdMap([3, 'ax'], [5, 'bx']), 'ab]
   * ```
   */
  public mapAccumL<V2, B>(
    ac: B,
    f: (b: B, v: V, k: K) => [V2, B],
  ): [OrdMap<K, V2>, B] {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return [Empty, ac];

    const { size, key, value, lhs, rhs } = n;
    const [l, acl] = lhs.mapAccumL(ac, f);
    const [v, acm] = f(acl, value, key);
    const [r, acr] = rhs.mapAccumL(acm, f);
    return [new Bin(size, key, v, l, r), acr];
  }

  /**
   * _O(n)_ Right-to-left dual of {@link mapAccumL}.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([3, 'a'], [5, 'b']).mapAccumL('', (ac, v) => [v + 'x', ac + v])
   * // [OrdMap([3, 'ax'], [5, 'bx']), 'ab]
   * ```
   */
  public mapAccumR<V2, B>(
    ac: B,
    f: (b: B, v: V, k: K) => [V2, B],
  ): [OrdMap<K, V2>, B] {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return [Empty, ac];

    const { size, key, value, lhs, rhs } = n;
    const [r, acr] = rhs.mapAccumR(ac, f);
    const [v, acm] = f(acr, value, key);
    const [l, acl] = lhs.mapAccumR(acm, f);
    return [new Bin(size, key, v, l, r), acl];
  }

  /**
   * _O(n * log(n))_ Transform keys of the map. The result map can be smaller if
   * the results of the function are not distinct.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([1, 'a'], [5, 'b']).mapKeys(x => String(x))
   * // OrdMap(['1', 'a'], ['5', 'b'])
   *
   * > OrdMap([1, 'a'], [5, 'b']).mapKeys(x => '')
   * // OrdMap(['', 'b'])
   * ```
   */
  public mapKeys<K2>(
    f: (k: K) => K2,
    O: Ord<K2> = Ord.fromUniversalCompare(),
  ): OrdMap<K2, V> {
    return this.mapKeysImpl(f, O);
  }
  private mapKeysImpl<K2>(f: (k: K) => K2, O: Ord<K2>): OrdMap<K2, V> {
    const xs = new Array<readonly [K2, V]>(this.size);
    let idx = 0;
    this.forEach((v, k) => (xs[idx++] = [f(k), v]));
    return OrdMap.fromArray(xs, O);
  }

  /**
   * _O(n * log(n))_ A version of {@link mapKeys} with a user-supplied combining
   * function `f`
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([1, 'a'], [5, 'b']).mapKeysWith(x => '', (y, x) => x + y)
   * // OrdMap(['', 'ab'])
   * ```
   */
  public mapKeysWith<K2, V>(
    this: OrdMap<K, V>,
    f: (k: K) => K2,
    c: (nevV: V, old: V) => V,
    O: Ord<K2> = Ord.fromUniversalCompare(),
  ): OrdMap<K2, V> {
    return this.mapKeysWithImpl(f, c, O);
  }
  private mapKeysWithImpl<K2, V>(
    this: OrdMap<K, V>,
    f: (k: K) => K2,
    c: (newV: V, old: V, k: K2) => V,
    O: Ord<K2>,
  ): OrdMap<K2, V> {
    const xs = new Array<readonly [K2, V]>(this.size);
    let idx = 0;
    this.forEach((v, k) => (xs[idx++] = [f(k), v]));
    return OrdMap.fromArrayWith(xs, c, O);
  }

  // -- Indexing

  /**
   * _O(log(n))_ Returns key/value element pair at zero-based `i`th index in
   * the ascending sequence of entries forming the map.
   *
   * @note This method is partial
   * @see {@link elemAtOption} for a safe option
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAt(0)
   * // [3, 'b']
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAt(1)
   * // [5, 'a']
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAt(2)
   * // [7, 'c']
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAt(3)
   * // Uncaught Error: OrdMap.elemAt: IndexOutOfBounds
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAt(-1)
   * // Uncaught Error: OrdMap.elemAt: IndexOutOfBounds
   * ```
   */
  public elemAt(i: number): [K, V] {
    return i < 0 || i >= this.size
      ? throwError(new Error('OrdMap.elemAt: IndexOutOfBounds'))
      : this.elemAtImpl(i);
  }
  private elemAtImpl(i: number): [K, V] {
    // invariant preserved by the check in the public method
    const n = this as any as Bin<K, V>;

    if (i === n.lhs.size) return [n.key, n.value];

    return i < n.lhs.size
      ? n.lhs.elemAtImpl(i)
      : n.rhs.elemAtImpl(i - n.lhs.size - 1);
  }

  /**
   * _O(log(n))_ Returns key/value element pair at zero-based `i`th index in
   * the ascending sequence of entries forming the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAtOption(0)
   * // Some([3, 'b'])
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAtOption(1)
   * // Some([5, 'a'])
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAtOption(2)
   * // Some([7, 'c'])
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAtOption(3)
   * // None
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).elemAtOption(-1)
   * // None
   * ```
   */
  public elemAtOption(i: number): Option<[K, V]> {
    return i < 0 || i >= this.size ? None : Some(this.elemAtImpl(i));
  }

  /**
   * _O(log(n))_ Return zero-based index of the given key in the sorted sequence
   * of keys contained by the map.
   *
   * ```typescript
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).keyIndex(3)
   * // Some(0)
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).keyIndex(5)
   * // Some(1)
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).keyIndex(7)
   * // Some(2)
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).keyIndex(2)
   * // None
   * ```
   */
  public keyIndex<K>(
    this: OrdMap<K, V>,
    k: K,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Option<number> {
    return this.keyIndexImpl(0, k, O);
  }
  private keyIndexImpl<K>(
    this: OrdMap<K, V>,
    s: number,
    k: K,
    O: Ord<K>,
  ): Option<number> {
    const n = this as Node<K, V>;
    if (n.tag === 'empty') return None;

    const { key, lhs, rhs } = n;
    switch (O.compare(k, key)) {
      case Compare.LT:
        return lhs.keyIndexImpl(s, k, O);
      case Compare.EQ:
        return Some(s + lhs.size);
      case Compare.GT:
        return rhs.keyIndexImpl(s + lhs.size + 1, k, O);
    }
  }

  /**
   * _O(n)_ Returns a zero-based index of the first key/value pair which value
   * returns `true` for the given predicate in the key-ordered sequence of entries
   * forming the map.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).findIndex(x => x < 5)
   * // Some(0)
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).findIndex(x => x > 5)
   * // Some(2)
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).findIndex(x => x < 1)
   * // None
   * ```
   */
  public findIndex(p: (v: V, k: K) => boolean): Option<number> {
    return this.findIndexImpl(0, p);
  }
  private findIndexImpl(s: number, p: (v: V, k: K) => boolean): Option<number> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return None;

    const { key, value, lhs, rhs } = n;
    const l = lhs.findIndexImpl(s, p);
    if (l.nonEmpty) return l;
    if (p(value, key)) return Some(s + lhs.size);
    return rhs.findIndexImpl(s + lhs.size + 1, p);
  }

  /**
   * _O(log(n))_ Take a given number of entries in key order in the ascending
   * order.
   *
   * `m.take(n)` is equivalent to `OrdMap.fromList(m.toList.take(n))`
   */
  public take(n: number): OrdMap<K, V> {
    return n >= this.size ? this : this.takeImpl(n);
  }
  private takeImpl(i: number): OrdMap<K, V> {
    if (i <= 0) return Empty;
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Empty;

    const { key, value, lhs, rhs } = n;
    if (i < lhs.size) return lhs.takeImpl(i);
    if (i > lhs.size)
      return _link(key, value, lhs, rhs.takeImpl(i - lhs.size - 1));
    return lhs;
  }

  /**
   * _O(log(n))_ Drop a given number of entries in key order in the ascending
   * order.
   *
   * `m.drop(n)` is equivalent to `OrdMap.fromList(m.toList.drop(n))`
   */
  public drop(n: number): OrdMap<K, V> {
    return n >= this.size ? Empty : this.dropImpl(n);
  }
  private dropImpl(i: number): OrdMap<K, V> {
    if (i <= 0) return this;
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Empty;

    const { key, value, lhs, rhs } = n;
    if (i < lhs.size) return _link(key, value, lhs.dropImpl(i), rhs);
    if (i > lhs.size) return rhs.dropImpl(i - lhs.size - 1);
    return _insertMin(key, value, rhs);
  }

  /**
   * _O(log(n))_ Split the map at the particular index.
   *
   * `m.splitAt(n)` is equivalent to `[m.take(n), m.drop(n)]`
   */
  public splitAt(n: number): [OrdMap<K, V>, OrdMap<K, V>] {
    if (n >= this.size) return [this, Empty];
    const { fst, snd } = this.splitAtImpl(n);
    return [fst, snd];
  }
  private splitAtImpl(i: number): Pair<OrdMap<K, V>, OrdMap<K, V>> {
    if (i <= 0) return Pair(Empty, this);
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Pair(Empty, Empty);

    const { key, value, lhs, rhs } = n;
    if (i < lhs.size) {
      const { fst, snd } = lhs.splitAtImpl(i);
      return Pair(fst, _link(key, value, snd, rhs));
    }
    if (i > lhs.size) {
      const { fst, snd } = rhs.splitAtImpl(i - lhs.size - 1);
      return Pair(_link(key, value, lhs, fst), snd);
    }
    return Pair(lhs, _insertMin(key, value, rhs));
  }

  /**
   * _O(log(n))_ Take a given number of entries in key order in the descending
   * order.
   *
   * `m.takeRight(n)` is equivalent to `OrdMap.fromList(m.toList.takeRight(n))`
   */
  public takeRight(n: number): OrdMap<K, V> {
    if (n <= 0) return Empty;
    if (n >= this.size) return this;
    return this.drop(this.size - n);
  }

  /**
   * _O(log(n))_ Drop a given number of entries in key order in the descending
   * order.
   *
   * `m.dropRight(n)` is equivalent to `OrdMap.fromList(m.toList.dropRight(n))`
   */
  public dropRight(n: number): OrdMap<K, V> {
    if (n <= 0) return this;
    if (n >= this.size) return Empty;
    return this.take(this.size - n);
  }

  /**
   * _O(log(n))_ Adjust a value at the zero-based index of the key-ordered entries
   * forming the map.
   *
   * @note This method is partial
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).modifyAt(0, x => x + 'x')
   * // OrdMap([3, 'bx'], [5, 'a'], [7, 'c'])
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).modifyAt(1, x => x + 'x')
   * // OrdMap([3, 'b'], [5, 'ax'], [7, 'c'])
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).modifyAt(42, x => x + 'x')
   * // Uncaught Error: OrdMap.modifyAt: IndexOutOfBounds
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).modifyAt(-1, x => x + 'x')
   * // Uncaught Error: OrdMap.modifyAt: IndexOutOfBounds
   * ```
   */
  public modifyAt<V>(
    this: OrdMap<K, V>,
    i: number,
    f: (v: V, k: K) => V,
  ): OrdMap<K, V> {
    return i < 0 || i >= this.size
      ? throwError(new Error('OrdMap.modifyAt: IndexOutOfBounds'))
      : this.modifyAtImpl(i, f);
  }
  private modifyAtImpl<V>(
    this: OrdMap<K, V>,
    i: number,
    f: (v: V, k: K) => V,
  ): OrdMap<K, V> {
    // invariant preserved by the check in the public method
    const { size, key, value, lhs, rhs } = this as Bin<K, V>;
    if (i === lhs.size) return new Bin(size, key, f(value, key), lhs, rhs);

    return i < lhs.size
      ? new Bin(size, key, value, lhs.modifyAtImpl(i, f), rhs)
      : new Bin(size, key, value, lhs, rhs.modifyAtImpl(i - lhs.size - 1, f));
  }

  /**
   * _O(log(n))_ Update a value at the zero-based index of the key-ordered entries
   * forming the map.
   *
   * @note This method is partial
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).modifyAt(0, x => Some(x + 'x'))
   * // OrdMap([3, 'bx'], [5, 'a'], [7, 'c'])
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).modifyAt(1, x => None)
   * // OrdMap([3, 'b'], [7, 'c'])
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).modifyAt(42, x => Some(x + 'x'))
   * // Uncaught Error: OrdMap.modifyAt: IndexOutOfBounds
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).modifyAt(-1, x => None)
   * // Uncaught Error: OrdMap.modifyAt: IndexOutOfBounds
   * ```
   */
  public updateAt<V>(
    this: OrdMap<K, V>,
    i: number,
    f: (v: V, k: K) => Option<V>,
  ): OrdMap<K, V> {
    return i < 0 || i >= this.size
      ? throwError(new Error('OrdMap.updateAt: IndexOutOfBounds'))
      : this.updateAtImpl(i, f);
  }
  private updateAtImpl<V>(
    this: OrdMap<K, V>,
    i: number,
    f: (v: V, k: K) => Option<V>,
  ): OrdMap<K, V> {
    // invariant preserved by the check in the public method
    const { size, key, value, lhs, rhs } = this as Bin<K, V>;
    if (i === lhs.size) {
      const v = f(value, key);
      return v.isEmpty ? _glue(lhs, rhs) : new Bin(size, key, v.get, lhs, rhs);
    }

    return i < lhs.size
      ? _balanceR(key, value, lhs.updateAtImpl(i, f), rhs)
      : _balanceL(key, value, lhs, rhs.updateAtImpl(i - lhs.size - 1, f));
  }

  /**
   * _O(log(n))_ Removes an entry at the zero-based index of the key-ordered
   * entries forming the map.
   *
   * @note This method is partial
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).removeAt(0)
   * // OrdMap([5, 'a'], [7, 'c'])
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).removeAt(1)
   * // OrdMap([3, 'b'], [7, 'c'])
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).removeAt(42)
   * // Uncaught Error: OrdMap.removeAt: IndexOutOfBounds
   *
   * > OrdMap([5, 'a'], [3, 'b'], [7, 'c']).removeAt(-1)
   * // Uncaught Error: OrdMap.removeAt: IndexOutOfBounds
   * ```
   */
  public removeAt(i: number): OrdMap<K, V> {
    return i < 0 || i >= this.size
      ? throwError(new Error('OrdMap.removeAt: IndexOutOfBounds'))
      : this.removeAtImpl(i);
  }
  private removeAtImpl(i: number): OrdMap<K, V> {
    // invariant preserved by the check in the public method
    const { key, value, lhs, rhs } = this as any as Bin<K, V>;
    if (i === lhs.size) return _glue(lhs, rhs);

    return i < lhs.size
      ? _balanceR(key, value, lhs.removeAtImpl(i), rhs)
      : _balanceL(key, value, lhs, rhs.removeAtImpl(i - lhs.size - 1));
  }

  // -- Zipping

  /**
   * _O(n)_ Transform a map into a pair of maps by decomposing each of the tuple
   * values from the original map into its corresponding ones.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([1, ['a', 'b']], [2, ['c', 'd']]).unzip()
   * // [OrdMap([1, 'a'], [2, 'c']), OrdMap([1, 'b'], [2, 'd'])]
   * ```
   */
  public unzip<B, C>(
    this: OrdMap<K, readonly [B, C]>,
  ): [OrdMap<K, B>, OrdMap<K, C>] {
    return this.unzipWith(id);
  }

  /**
   * _O(n)_ Transform a map into a pair of maps by decomposing each of values
   * from the original map into its corresponding ones using a function `f` to
   * separate them into components.
   *
   * @examples
   *
   * ```typescript
   * > OrdMap([1, ['ab']], [2, ['cd']]).unzipWith(s => [s[0], s[1]])
   * // [OrdMap([1, 'a'], [2, 'c']), OrdMap([1, 'b'], [2, 'd'])]
   * ```
   */
  public unzipWith<B, C>(
    f: (v: V, k: K) => readonly [B, C],
  ): [OrdMap<K, B>, OrdMap<K, C>] {
    const { fst, snd } = this.unzipWithImpl(f);
    return [fst, snd];
  }
  private unzipWithImpl<B, C>(
    f: (v: V, k: K) => readonly [B, C],
  ): Pair<OrdMap<K, B>, OrdMap<K, C>> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Pair(Empty, Empty);

    const { size, key, value } = n;
    if (size === 1) {
      const bc = f(value, key);
      return Pair(
        new Bin(1, key, bc[0], Empty, Empty),
        new Bin(1, key, bc[1], Empty, Empty),
      );
    }

    const { fst: lb, snd: lc } = n.lhs.unzipWithImpl(f);
    const bc = f(value, key);
    const { fst: rb, snd: rc } = n.rhs.unzipWithImpl(f);
    return Pair(
      new Bin(size, key, bc[0], lb, rb),
      new Bin(size, key, bc[1], lc, rc),
    );
  }

  public align<K, A, B>(
    this: OrdMap<K, A>,
    that: OrdMap<K, B>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, Ior<A, B>> {
    return this.mergeImpl(
      that,
      {
        missingSubtree: kx => kx.map(a => Ior.Left(a)),
        missingKey: (k, x) => Some(Ior.Left(x)),
      },
      {
        missingSubtree: ky => ky.map(y => Ior.Right(y)),
        missingKey: (k, y) => Some(Ior.Right(y)),
      },
      (k, x, y) => Some(Ior.Both(x, y)),
      O,
    );
  }

  public zipAllWith<K, A, B, C>(
    this: OrdMap<K, A>,
    that: OrdMap<K, B>,
    defaultX: A,
    defaultY: B,
    f: (a: A, b: B, k: K) => C,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, C> {
    return this.mergeImpl(
      that,
      {
        missingSubtree: kx => kx.map((a, k) => f(a, defaultY, k)),
        missingKey: (k, x) => Some(f(x, defaultY, k)),
      },
      {
        missingSubtree: ky => ky.map((y, k) => f(defaultX, y, k)),
        missingKey: (k, y) => Some(f(defaultX, y, k)),
      },
      (k, x, y) => Some(f(x, y, k)),
      O,
    );
  }

  // -- Folds

  /**
   * _O(n)_ Apply `f` to each element of the map for its side-effect.
   *
   * @examples
   *
   * ```typescript
   * > let acc = '';
   * > OrdMap([1, 'a'], [2, 'b']).forEach(x => acc += x)
   * > acc
   * // 'ab'
   * ```
   */
  public forEach(f: (v: V, k: K) => void): void {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return;
    if (n.size === 1) return f(n.value, n.key);
    const { key, value, lhs, rhs } = n;
    lhs.forEach(f);
    f(value, key);
    rhs.forEach(f);
  }

  /**
   * _O(n)_ Apply a left-associative operator `f` to each element of the map
   * reducing the map from left to right.
   */
  public foldLeft<B>(z: B, f: (b: B, v: V, k: K) => B): B {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return z;
    if (n.size === 1) return f(z, n.value, n.key);
    const l = n.lhs.foldLeft(z, f);
    const m = f(l, n.value, n.key);
    return n.rhs.foldLeft(m, f);
  }

  /**
   * _O(n)_ Apply a right-associative operator `f` to each element of the map,
   * reducing the list from right to left lazily.
   *
   * @see {@link foldRight_} for a strict variant.
   */
  public foldRight<B>(
    ez: Eval<B>,
    f: (v: V, eb: Eval<B>, k: K) => Eval<B>,
  ): Eval<B> {
    return Iter.foldRight_(
      new OrdMapIterator(this, (k, v) => ({ k, v })),
      ez,
      (kv, eb) => f(kv.v, eb, kv.k),
    );
  }

  /**
   * _O(n)_ Strict, non-short-circuiting version of the {@link foldRight}.
   */
  public foldRight_<B>(z: B, f: (v: V, b: B, k: K) => B): B {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return z;
    if (n.size === 1) return f(n.value, z, n.key);
    const r = n.rhs.foldRight_(z, f);
    const m = f(n.value, r, n.key);
    return n.lhs.foldRight_(m, f);
  }

  /**
   * _O(n)_ Right associative, lazy fold mapping each element of the structure
   * into a monoid `M` and combining their results using `combineEval`.
   *
   * @see foldMapK for a version accepting a `MonoidK` instance
   * @see foldMapLeft for a left-associative, strict variant
   */
  public foldMap<M>(M: Monoid<M>, f: (v: V, k: K) => M): M {
    return this.foldRight(Eval.now(M.empty), (v, eb, k) =>
      M.combineEval_(f(v, k), eb),
    ).value;
  }

  /**
   * _O(n)_ Left-associative, strict version of {@link foldMap}.
   */
  public foldMapLeft<M>(M: Monoid<M>, f: (v: V, k: K) => M): M {
    return this.foldLeft(M.empty, (b, v, k) => M.combine_(b, f(v, k)));
  }

  /**
   * _O(n)_ Version of {@link foldMap} that accepts {@link MonoidK} instance.
   */
  public foldMapK<F, B>(
    F: MonoidK<F>,
    f: (v: V, k: K) => Kind<F, [B]>,
  ): Kind<F, [B]> {
    return this.foldMap(F.algebra<B>(), f);
  }

  // -- Traversals

  /**
   * _O(n)_ Transforms each element of the structure into an applicative action
   * and evaluate them left-to-right combining their result into a map.
   *
   * {@link traverse} uses {@link TraverseStrategy} of the provided applicative
   * `G` allowing for short-circuiting.
   *
   * @see {@link traverse_} for result-ignoring version.
   */
  public traverse<G, B>(
    G: Applicative<G>,
    f: (v: V, k: K) => Kind<G, [B]>,
  ): Kind<G, [OrdMap<K, B>]> {
    return isIdentityTC(G)
      ? (this.map(f) as any)
      : isConstTC(G)
      ? this.traverse_(G, f)
      : Apply.TraverseStrategy(G)(Rhs => Rhs.toG(this.traverseImpl(G, Rhs, f)));
  }

  /**
   * _O(n)_ Transforms each element of the structure into an applicative action
   * and evaluate them left-to-right ignoring the results.
   *
   * {@link traverse} uses {@link TraverseStrategy} of the provided applicative
   * `G` allowing for short-circuiting.
   */
  public traverse_<G>(
    G: Applicative<G>,
    f: (v: V, k: K) => Kind<G, [unknown]>,
  ): Kind<G, [void]> {
    const discard = () => {};
    return this.foldRight(Eval.now(G.unit), (v, eb, k) =>
      G.map2Eval_(f(v, k), eb, discard),
    ).value;
  }

  private traverseImpl<G, Rhs, B>(
    G: Applicative<G>,
    Rhs: TraverseStrategy<G, Rhs>,
    f: (v: V, k: K) => Kind<G, [B]>,
  ): Kind<Rhs, [Kind<G, [OrdMap<K, B>]>]> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Rhs.toRhs(() => G.pure(Empty));
    if (n.size === 1)
      return Rhs.toRhs(() =>
        G.map_(f(n.value, n.key), b => new Bin(1, n.key, b, Empty, Empty)),
      );

    return Rhs.map2(
      n.lhs.traverseImpl(G, Rhs, f),
      Rhs.defer(() =>
        Rhs.map2Rhs(
          f(n.value, n.key),
          Rhs.defer(() => n.rhs.traverseImpl(G, Rhs, f)),
          (b, rhs) => [b, rhs] as const,
        ),
      ),
      (lhs, [b, rhs]) => new Bin(n.size, n.key, b, lhs, rhs),
    );
  }

  /**
   * _O(n)_ Version of {@link traverse} which removes elements of the original
   * map.
   */
  public traverseFilter<G, B>(
    G: Applicative<G>,
    f: (v: V, k: K) => Kind<G, [Option<B>]>,
  ): Kind<G, [OrdMap<K, B>]> {
    return isIdentityTC(G)
      ? (this.collect(f as any) as any)
      : Apply.TraverseStrategy(G)(Rhs =>
          Rhs.toG(this.traverseFilterImpl(G, Rhs, f)),
        );
  }

  private traverseFilterImpl<G, Rhs, B>(
    G: Applicative<G>,
    Rhs: TraverseStrategy<G, Rhs>,
    f: (v: V, k: K) => Kind<G, [Option<B>]>,
  ): Kind<Rhs, [Kind<G, [OrdMap<K, B>]>]> {
    const n = this as any as Node<K, V>;
    if (n.tag === 'empty') return Rhs.toRhs(() => G.pure(Empty));
    if (n.size === 1)
      return Rhs.toRhs(() =>
        G.map_(f(n.value, n.key), ob => {
          if (ob.isEmpty) return Empty;
          const b = ob.get;
          return new Bin(1, n.key, b, Empty, Empty);
        }),
      );

    return Rhs.map2(
      n.lhs.traverseFilterImpl(G, Rhs, f),
      Rhs.defer(() =>
        Rhs.map2Rhs(
          f(n.value, n.key),
          Rhs.defer(() => n.rhs.traverseFilterImpl(G, Rhs, f)),
          (b, rhs) => [b, rhs] as const,
        ),
      ),
      (lhs, [b, rhs]) =>
        b.nonEmpty ? _link(n.key, b.get, lhs, rhs) : _link2(lhs, rhs),
    );
  }

  // -- Misc

  public toString(): string {
    return `OrdMap(${this.toArray
      .map(([k, v]) => `[${String(k)}, ${String(v)}]`)
      .join(', ')})`;
  }

  public equals<K, V>(
    this: OrdMap<K, V>,
    that: OrdMap<K, V>,
    K: Eq<K> = Eq.fromUniversalEquals(),
    V: Eq<V> = Eq.fromUniversalEquals(),
  ): boolean {
    const it = that.iterator;
    return this.view.foldRight(Eval.true, (l, eb) => {
      const nx = it.next();
      if (nx.done) return Eval.true;
      const r = nx.value;
      return K.notEquals(l[0], r[0]) || V.notEquals(l[1], r[1])
        ? Eval.false
        : eb;
    }).value;
  }
}

// -- Algebra

class Bin<K, V> extends _OrdMap<K, V> {
  public readonly tag = 'bin';

  public constructor(
    public readonly size: number,
    public readonly key: K,
    public readonly value: V,
    public readonly lhs: OrdMap<K, V>,
    public readonly rhs: OrdMap<K, V>,
  ) {
    super();
  }
}

function mkBin<K, V>(
  key: K,
  value: V,
  lhs: OrdMap<K, V>,
  rhs: OrdMap<K, V>,
): Bin<K, V> {
  return new Bin(1 + lhs.size + rhs.size, key, value, lhs, rhs);
}

const Empty: OrdMap<never, never> & { readonly tag: 'empty' } =
  new (class Empty extends _OrdMap<never, never> {
    public readonly tag = 'empty';
    public readonly size: number = 0;
  })();
type Empty = typeof Empty;
OrdMap.empty = Empty;

type Node<K, V> = Bin<K, V> | Empty;

// -- Assertions

export const isValid = <K, V = never>(
  m: OrdMap<K, V>,
  O: Ord<K> = Ord.fromUniversalCompare(),
): boolean => isOrdered(m, O) && isBalanced(m) && hasValidSize(m);

export const isOrdered = <K, V>(m: OrdMap<K, V>, O: Ord<K>): boolean => {
  const bounded = (
    sa: OrdMap<K, V>,
    lo: (a: K) => boolean,
    hi: (a: K) => boolean,
  ): boolean => {
    const sn = sa as Node<K, V>;
    if (sn.tag === 'empty') return true;

    return (
      lo(sn.key) &&
      hi(sn.key) &&
      bounded(sn.lhs, lo, x => O.lt(x, sn.key)) &&
      bounded(sn.rhs, x => O.gt(x, sn.key), hi)
    );
  };

  return bounded(m, constant(true), constant(true));
};

export const isBalanced = <K, V>(m: OrdMap<K, V>): boolean => {
  const sn = m as Node<K, V>;
  return sn.tag === 'empty'
    ? true
    : (sn.lhs.size + sn.rhs.size <= 1 ||
        (sn.lhs.size <= delta * sn.rhs.size &&
          sn.rhs.size <= delta * sn.rhs.size)) &&
        isBalanced(sn.lhs) &&
        isBalanced(sn.rhs);
};

export const hasValidSize = <K, V>(m: OrdMap<K, V>): boolean => {
  const realSize = (m: OrdMap<K, V>): number => {
    const sn = m as Node<K, V>;
    return sn.tag === 'empty' ? 0 : realSize(sn.lhs) + 1 + realSize(sn.rhs);
  };
  return m.size === realSize(m);
};

// -- Private implementation

const delta = 3;
const ratio = 2;

function _balanceL<K, V>(
  k: K,
  x: V,
  l: OrdMap<K, V>,
  r: OrdMap<K, V>,
): OrdMap<K, V> {
  const ln = l as Node<K, V>;
  if (r.size === 0) {
    if (ln.tag === 'empty') {
      return new Bin(1, k, x, Empty, Empty);
    } else if (ln.size === 1) {
      return new Bin(2, k, x, ln, Empty);
    } else if (ln.lhs.size === 0) {
      return new Bin(
        3,
        (ln.rhs as Bin<K, V>).key,
        (ln.rhs as Bin<K, V>).value,
        new Bin(1, ln.key, ln.value, Empty, Empty),
        new Bin(1, k, x, Empty, Empty),
      );
    } else if (ln.rhs.size === 0) {
      return mkBin(ln.key, ln.value, ln.lhs, new Bin(1, k, x, Empty, Empty));
    }

    return ln.rhs.size < ratio * ln.lhs.size
      ? mkBin(ln.key, ln.value, ln.lhs, mkBin(k, x, ln.rhs, Empty))
      : mkBin(
          (ln.rhs as Bin<K, V>).key,
          (ln.rhs as Bin<K, V>).value,
          mkBin(ln.key, ln.value, ln.lhs, (ln.rhs as Bin<K, V>).lhs),
          mkBin(k, x, (ln.rhs as Bin<K, V>).rhs, Empty),
        );
  }

  if (ln.tag === 'empty') {
    return mkBin(k, x, Empty, r);
  } else if (ln.size <= delta * r.size) {
    return mkBin(k, x, l, r);
  }

  return ln.rhs.size < ratio * ln.lhs.size
    ? mkBin(ln.key, ln.value, ln.lhs, mkBin(k, x, ln.rhs, r))
    : mkBin(
        (ln.rhs as Bin<K, V>).key,
        (ln.rhs as Bin<K, V>).value,
        mkBin(ln.key, ln.value, ln.lhs, (ln.rhs as Bin<K, V>).lhs),
        mkBin(k, x, (ln.rhs as Bin<K, V>).rhs, r),
      );
}

function _balanceR<K, V>(
  k: K,
  x: V,
  l: OrdMap<K, V>,
  r: OrdMap<K, V>,
): OrdMap<K, V> {
  const rn = r as Node<K, V>;
  if (l.size === 0) {
    if (rn.tag === 'empty') {
      return new Bin(1, k, x, Empty, Empty);
    } else if (rn.size === 1) {
      return new Bin(2, k, x, Empty, rn);
    } else if (rn.lhs.size === 0) {
      return mkBin(rn.key, rn.value, new Bin(1, k, x, Empty, Empty), rn.rhs);
    } else if (rn.rhs.size === 0) {
      return new Bin(
        3,
        (rn.lhs as Bin<K, V>).key,
        (rn.lhs as Bin<K, V>).value,
        new Bin(1, k, x, Empty, Empty),
        new Bin(1, rn.key, rn.value, Empty, Empty),
      );
    }

    return rn.lhs.size < ratio * rn.rhs.size
      ? mkBin(rn.key, rn.value, mkBin(k, x, Empty, rn.lhs), rn.rhs)
      : mkBin(
          (rn.lhs as Bin<K, V>).key,
          (rn.lhs as Bin<K, V>).value,
          mkBin(k, x, Empty, (rn.lhs as Bin<K, V>).lhs),
          mkBin(rn.key, rn.value, (rn.lhs as Bin<K, V>).rhs, rn.rhs),
        );
  }

  if (rn.tag === 'empty') {
    return mkBin(k, x, l, Empty);
  } else if (rn.size <= delta * l.size) {
    return mkBin(k, x, l, r);
  }

  return rn.lhs.size < ratio * rn.rhs.size
    ? mkBin(rn.key, rn.value, mkBin(k, x, l, rn.lhs), rn.rhs)
    : mkBin(
        (rn.lhs as Bin<K, V>).key,
        (rn.lhs as Bin<K, V>).value,
        mkBin(k, x, l, (rn.lhs as Bin<K, V>).lhs),
        mkBin(rn.key, rn.value, (rn.lhs as Bin<K, V>).rhs, rn.rhs),
      );
}

const _link = <K, V>(
  k: K,
  x: V,
  l: OrdMap<K, V>,
  r: OrdMap<K, V>,
): OrdMap<K, V> => {
  const ln = l as Node<K, V>;
  if (ln.tag === 'empty') return _insertMin(k, x, r);
  const rn = r as Node<K, V>;
  if (rn.tag === 'empty') return _insertMax(k, x, l);

  if (delta * ln.size < rn.size)
    return _balanceL(rn.key, rn.value, _link(k, x, ln, rn.lhs), rn.rhs);
  else if (delta * rn.size < ln.size)
    return _balanceR(ln.key, ln.value, ln.lhs, _link(k, x, ln.rhs, rn));
  else return mkBin(k, x, ln, rn);
};

const _link2 = <K, V>(l: OrdMap<K, V>, r: OrdMap<K, V>): OrdMap<K, V> => {
  const ln = l as Node<K, V>;
  if (ln.tag === 'empty') return r;
  const rn = r as Node<K, V>;
  if (rn.tag === 'empty') return l;

  if (delta * ln.size < rn.size)
    return _balanceL(rn.key, rn.value, _link2(ln, rn.lhs), rn.rhs);
  else if (delta * rn.size < ln.size)
    return _balanceR(ln.key, ln.value, ln.lhs, _link2(ln.rhs, rn));
  else return _glue(ln, rn);
};

const _insertMax = <K, V>(k: K, x: V, sa: OrdMap<K, V>): OrdMap<K, V> => {
  const sn = sa as Node<K, V>;
  return sn.tag === 'empty'
    ? new Bin(1, k, x, Empty, Empty)
    : _balanceR(sn.key, sn.value, sn.lhs, _insertMax(k, x, sn.rhs));
};
const _insertMin = <K, V>(k: K, x: V, sa: OrdMap<K, V>): OrdMap<K, V> => {
  const sn = sa as Node<K, V>;
  return sn.tag === 'empty'
    ? new Bin(1, k, x, Empty, Empty)
    : _balanceL(sn.key, sn.value, _insertMin(k, x, sn.lhs), sn.rhs);
};

const _glue = <K, V>(l: OrdMap<K, V>, r: OrdMap<K, V>): OrdMap<K, V> => {
  const ln = l as Node<K, V>;
  if (ln.tag === 'empty') return r;
  const rn = r as Node<K, V>;
  if (rn.tag === 'empty') return l;

  if (ln.size > rn.size) {
    const { key: lk, value: lx, lhs: ll, rhs: lr } = ln;
    const { k, v, m } = _getMaxView(lk, lx, ll, lr);
    return _balanceR(k, v, m, r);
  } else {
    const { key: rk, value: rx, lhs: rl, rhs: rr } = rn;
    const { k, v, m } = _getMinView(rk, rx, rl, rr);
    return _balanceL(k, v, l, m);
  }
};

type MinView<K, V> = { k: K; v: V; m: OrdMap<K, V> };
const _getMinView = <K, V>(
  k: K,
  v: V,
  lm: OrdMap<K, V>,
  rm: OrdMap<K, V>,
): MinView<K, V> => {
  const ln = lm as Node<K, V>;
  if (ln.tag === 'empty') return { k, v, m: rm };

  const { key, value, lhs, rhs } = ln;
  const view = _getMinView(key, value, lhs, rhs);
  return { ...view, m: _balanceR(k, v, view.m, rm) };
};

type MaxView<K, V> = { k: K; v: V; m: OrdMap<K, V> };
const _getMaxView = <K, V>(
  k: K,
  v: V,
  lm: OrdMap<K, V>,
  rm: OrdMap<K, V>,
): MaxView<K, V> => {
  const rn = rm as Node<K, V>;
  if (rn.tag === 'empty') return { k, v, m: lm };

  const { key, value, lhs, rhs } = rn;
  const view = _getMaxView(key, value, lhs, rhs);
  return { ...view, m: _balanceL(k, v, lm, view.m) };
};

class OrdMapIterator<K, V, A> implements Iterator<A> {
  private rhss: Bin<K, V>[] = [];
  private cur: Node<K, V>;
  public constructor(cur: OrdMap<K, V>, private f: (k: K, v: V) => A) {
    this.cur = cur as Node<K, V>;
  }

  public next(): IteratorResult<A> {
    const rhss = this.rhss;
    let cur = this.cur;
    while (cur.tag !== 'empty') {
      rhss.push(cur);
      cur = cur.lhs as Node<K, V>;
    }
    if (rhss.length === 0) return { done: true, value: undefined };

    const { key, value, rhs } = rhss.pop()!;
    this.cur = rhs as Node<K, V>;
    return { done: false, value: this.f(key, value) };
  }
}

class OrdMapReversedIterator<K, V, A> implements Iterator<A> {
  private lhss: Bin<K, V>[] = [];
  private cur: Node<K, V>;
  public constructor(cur: OrdMap<K, V>, private f: (k: K, v: V) => A) {
    this.cur = cur as Node<K, V>;
  }

  public next(): IteratorResult<A> {
    const lhss = this.lhss;
    let cur = this.cur;
    while (cur.tag !== 'empty') {
      lhss.push(cur);
      cur = cur.rhs as Node<K, V>;
    }
    if (lhss.length === 0) return { done: true, value: undefined };

    const { key, value, lhs } = lhss.pop()!;
    this.cur = lhs as Node<K, V>;
    return { done: false, value: this.f(key, value) };
  }
}

type WhenMissing<F, K, X, Y> = {
  readonly missingSubtree: (m: OrdMap<K, X>) => Kind<F, [OrdMap<K, Y>]>;
  readonly missingKey: (k: K, x: X) => Kind<F, [Option<Y>]>;
};

type WhenMatched<F, K, X, Y, Z> = (k: K, x: X, y: Y) => Kind<F, [Option<Z>]>;

type Pair<A, B> = { readonly fst: A; readonly snd: B };
function Pair<A, B>(fst: A, snd: B): Pair<A, B> {
  return { fst, snd };
}

// -- Instances

const ordMapFunctorWithIndex = lazy(<K>() =>
  FunctorWithIndex.of<$<OrdMapF, [K]>, K>({
    mapWithIndex_: (fa, f) => fa.map(f),
  }),
) as <K>() => FunctorWithIndex<$<OrdMapF, [K]>, K>;

const ordMapFunctorFilter = lazy(<K>() =>
  FunctorFilter.of<$<OrdMapF, [K]>>({
    ...ordMapFunctorWithIndex<K>(),
    mapFilter_: (fa, f) => fa.collect(v => f(v)),
    collect_: (fa, f) => fa.collect(v => f(v)),
    filter_: <V>(fa: OrdMap<K, V>, f: (v: V) => boolean) =>
      fa.filter(v => f(v)),
    filterNot_: <V>(fa: OrdMap<K, V>, f: (v: V) => boolean) =>
      fa.filterNot(v => f(v)),
  }),
) as <K>() => FunctorFilter<$<OrdMapF, [K]>>;

const ordMapMonoidK = cached(<K>(O: Ord<K>) =>
  MonoidK.of<$<OrdMapF, [K]>>({
    combineK_: (fa, fb) => fa.union(fb, O),
    emptyK: () => Empty,
  }),
);

const ordMapFoldableWithIndex = lazy(<K>() =>
  FoldableWithIndex.of<$<OrdMapF, [K]>, K>({
    foldMapWithIndex_:
      <M>(M: Monoid<M>) =>
      <A>(fa: OrdMap<K, A>, f: (a: A, k: K) => M) =>
        fa.foldMap(M, f),
    foldRightWithIndex_: (fa, ez, f) => fa.foldRight(ez, f),
    foldLeftWithIndex_: (fa, z, f) => fa.foldLeft(z, f),
    isEmpty: fa => fa.isEmpty,
    nonEmpty: fa => fa.nonEmpty,
    size: fa => fa.size,
    toArray: fa => fa.values,
    iterator: fa => fa.valuesIterator,
  }),
) as <K>() => Foldable<$<OrdMapF, [K]>>;

const ordMapTraversableWithIndex = lazy(<K>() =>
  TraversableWithIndex.of<$<OrdMapF, [K]>, K>({
    ...ordMapFunctorWithIndex(),
    ...ordMapFoldableWithIndex(),

    traverseWithIndex_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: OrdMap<K, A>, f: (a: A, k: K) => Kind<G, [B]>) =>
        fa.traverse(G, f),
  }),
) as <K>() => TraversableWithIndex<$<OrdMapF, [K]>, K>;

const ordMapTraversableFilter = lazy(<K>() =>
  TraversableFilter.of<$<OrdMapF, [K]>>({
    ...ordMapTraversableWithIndex<K>(),

    traverseFilter_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: OrdMap<K, A>, f: (a: A) => Kind<G, [Option<B>]>) =>
        fa.traverseFilter(G, a => f(a)),
  }),
) as <K>() => TraversableFilter<$<OrdMapF, [K]>>;

const ordMapAlign = cached(<K>(O: Ord<K>) =>
  Align.of<$<OrdMapF, [K]>>({
    ...ordMapFunctorWithIndex<K>(),
    align_: (xs, ys) => xs.align(ys, O),
    zipAll: (fa, fb, a, b) => fa.zipAllWith(fb, a, b, (a, b) => [a, b]),
  }),
);

const ordMapUnzip = lazy(<K>() =>
  Unzip.of<$<OrdMapF, [K]>>({
    ...ordMapFunctorWithIndex<K>(),
    zipWith_: (xs, ys, f) => xs.intersectWith(ys, (a, b) => f(a, b)),
    unzipWith_: (xs, f) => xs.unzipWith(f),
    unzip: xs => xs.unzip(),
  }),
) as <K>() => Unzip<$<OrdMapF, [K]>>;

OrdMap.Eq = <K, V>(K: Eq<K>, V: Eq<V>): Eq<OrdMap<K, V>> =>
  Eq.of({ equals: (x, y) => x.equals(y, K, V) });
OrdMap.Functor = ordMapFunctorWithIndex;
OrdMap.FunctorWithIndex = ordMapFunctorWithIndex;
OrdMap.FunctorFilter = ordMapFunctorFilter;
OrdMap.MonoidK = ordMapMonoidK;
OrdMap.Foldable = ordMapFoldableWithIndex;
OrdMap.FoldableWithIndex = ordMapFoldableWithIndex;
OrdMap.Traversable = ordMapTraversableWithIndex;
OrdMap.TraversableWithIndex = ordMapTraversableWithIndex;
OrdMap.TraversableFilter = ordMapTraversableFilter;
OrdMap.Align = ordMapAlign;
OrdMap.Unzip = ordMapUnzip;

// -- HKT

export interface OrdMapF extends TyK<[unknown, unknown]> {
  [$type]: OrdMap<TyVar<this, 0>, TyVar<this, 1>>;
}
