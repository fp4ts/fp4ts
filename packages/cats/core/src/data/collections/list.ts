// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $type,
  Eval,
  id,
  Kind,
  lazy,
  throwError,
  tupled,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { Compare, Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { Align } from '../../align';
import { Alternative } from '../../alternative';
import { Applicative } from '../../applicative';
import { Apply, TraverseStrategy } from '../../apply';
import { CoflatMap } from '../../coflat-map';
import { EqK } from '../../eq-k';
import { Foldable } from '../../foldable';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { MonadPlus } from '../../monad-plus';
import { Monad } from '../../monad';
import { MonoidK } from '../../monoid-k';
import { TraversableFilter } from '../../traversable-filter';
import { Unzip } from '../../unzip';

import { Either, Left, Right } from '../either';
import { isIdentityTC } from '../identity';
import { Ior } from '../ior';
import { None, Option, Some } from '../option';

import { Map } from './map';
import { Set as CSet } from './set';
import { View } from './view';
import { NonEmptyList } from './non-empty-list';
import { Seq } from './seq';

/**
 * Immutable, strict linked-list collection of ordered elements `A`.
 *
 * For lazy variants, see `View<A>` and `LazyList<A>`.
 */
export type List<A> = _List<A>;
export const List = function <A>(...xs: readonly A[]): List<A> {
  return List.fromArray(xs);
};

/**
 * Creates an empty `List`:
 *
 * ```typescript
 * > List.empty
 * // List()
 * ```
 */
List.empty = null as any as List<never>; // = Nil below

List.cons = <A>(x: A, xs: List<A>): List<A> => new Cons(x, xs);

/**
 * Construct a singleton `List`.
 */
List.singleton = <A>(x: A): List<A> => new Cons(x, Nil);

/**
 * Create a list of numbers starting at `from` lower bounds and ended by `to - 1`.
 *
 * @examples
 *
 * ```typescript
 * > List.range(0, 5)
 * // List(0, 1, 2, 3, 4)
 *
 * > List.range(5, 5)
 * // List()
 *
 * > List.range(5, 0)
 * // List()
 * ```
 */
List.range = (from: number, until: number): List<number> => {
  if (until <= from) return Nil;
  let xs: List<number> = Nil;
  for (let i = until - 1; i >= from; i--) {
    xs = new Cons(i, xs);
  }
  return xs;
};

/**
 * Dual to `foldRight` function: while `foldRight` reduces the structure into
 * a single result, `unfoldRight` build a list from the seed value `z` and a
 * function `f`. The build ends once function `f` returns `None`.
 *
 * @examples
 *
 * ```typescript
 * > List.unfoldRight(10, x => x > 0 ? Some([x, x - 1]) : None);
 * // List(10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
 * ```
 */
List.unfoldRight = <A, B>(z: B, f: (b: B) => Option<[A, B]>): List<A> => {
  const buf = new ListBuffer<A>();
  let x: A;
  let cur = f(z);
  while (cur.nonEmpty) {
    [x, z] = cur.get;
    buf.addOne(x);
    cur = f(z);
  }
  return buf.toList;
};

/**
 * Constructs a list from an array.
 */
List.fromArray = <A>(xs: readonly A[]): List<A> => {
  let rs = List.empty as List<A>;
  let idx = xs.length;
  while (idx-- > 0) {
    rs = new Cons(xs[idx], rs);
  }
  return rs;
};

/**
 * Constructs a list from an iterable collection.
 */
List.fromIterable = <A>(xs: Iterable<A>): List<A> =>
  xs instanceof _List ? xs : List.fromIterator(xs[Symbol.iterator]());

/**
 * Constructs a list from an iterator.
 */
List.fromIterator = <A>(it: Iterator<A>): List<A> =>
  ListBuffer.fromIterator(it).toList;

List.tailRecM_ = <A, B>(a: A, f: (a: A) => List<Either<A, B>>): List<B> => {
  const stack: List<Either<A, B>>[] = [f(a)];
  const buf = new ListBuffer<B>();

  let ptr = 0;
  while (ptr >= 0) {
    const xhd = stack[ptr];

    if (xhd === Nil) {
      stack.pop();
      ptr--;
      continue;
    }

    const nx = xhd.head;
    if (nx.isEmpty) {
      stack[ptr] = xhd.tail;
      stack.push(f(nx.getLeft));
      ptr++;
    } else {
      buf.addOne(nx.get);
      stack[ptr] = xhd.tail;
    }
  }

  return buf.toList;
};

export abstract class _List<out A> {
  readonly __void!: A;

  /**
   * _O(1)_ Extracts the first element of the list, which must be non-empty.
   *
   * @note This function is partial.
   *
   * @see headOption for a safe variant
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).head
   * // 1
   *
   * > List.empty.head
   * // Uncaught Error: List.head: empty List
   * ```
   */
  public abstract readonly head: A;

  /**
   * _O(1)_ Extracts the elements of the list which come after the initial head.
   * Equivalent to:
   *
   * ```typescript
   * xs.tail == xs.drop(1)
   * ```
   *
   * As such, it is safe to perform `tail` on empty lists as well.
   *
   * @examples
   *
   *```typescript
   * > List(1, 2, 3).tail
   * // List(2, 3)
   *
   * > List(1).tail
   * // List()
   *
   * > List.empty.tail
   * // List()
   * ```
   */
  public abstract readonly tail: List<A>;

  /**
   * _O(1)_ Safe version of the `head` which optionally returns the first element
   * of the list.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).head
   * // Some(1)
   *
   * > List.empty.head
   * // None
   * ```
   */
  public get headOption(): Option<A> {
    return (this as List<A>) === Nil ? None : Some(this.head);
  }

  /**
   * _O(1)_ Optionally decompose the list into its head and tail. Returns `None`
   * if empty.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).uncons
   * // Some([1, List(2, 3)])
   *
   * > List(42).uncons
   * // Some([42, List()])
   *
   * > List.empty.uncons
   * // None
   * ```
   */
  public get uncons(): Option<[A, List<A>]> {
    return (this as List<A>) === Nil ? None : Some([this.head, this.tail]);
  }

  /**
   * Alias for `uncons`.
   */
  public get popHead(): Option<[A, List<A>]> {
    return this.uncons;
  }

  /**
   * _O(n)_ Extracts the last element of the list, which must be non-empty.
   *
   * @note This is a partial function.
   *
   * @see lastOption for a safe variant
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).last
   * // 3
   *
   * > List(1).last
   * // 1
   *
   * > List.empty.last
   * // Uncaught Error: Nil.last
   * ```
   */
  public get last(): A {
    let xs = this as List<A>;
    if (xs === Nil) return throwError(new Error('Nil.last'));

    let prev: A | undefined;
    while (xs !== Nil) {
      prev = xs.head;
      xs = xs.tail;
    }
    return prev!;
  }

  /**
   * _O(n)_ Optionally extracts the last element of the list.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).last
   * // Some(3)
   *
   * > List(1).last
   * // Some(1)
   *
   * > List.empty.last
   * // None
   * ```
   */
  public get lastOption(): Option<A> {
    let xs = this as List<A>;
    if (xs === Nil) return None;

    let prev: A | undefined;
    while (xs !== Nil) {
      prev = xs.head;
      xs = xs.tail;
    }
    return Some(prev!);
  }

  /**
   * _O(n)_ Extract all elements of the list expect from the last one.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).init
   * // List(1, 2)
   *
   * > List(1).init
   * // List()
   *
   * > List.empty.init
   * // List()
   * ```
   */
  public get init(): List<A> {
    return this.dropRight(1);
  }

  /**
   * _O(n)_ Optionally extract init and the last element of the list.
   */
  public get popLast(): Option<[A, List<A>]> {
    let cur = this as List<A>;
    if (cur === Nil) return None;

    const buf = new ListBuffer<A>();
    while (cur.tail !== Nil) {
      buf.addOne(cur.head);
      cur = cur.tail;
    }

    return Some([cur.head, buf.toList]);
  }

  /**
   * _O(1)_ Returns `true` if the list is empty, or `false` otherwise.
   *
   * @examples
   *
   * ```typescript
   * > List.empty.isEmpty
   * // true
   *
   * > List(1).isEmpty
   * // false
   * ```
   */
  public get isEmpty(): boolean {
    return (this as List<A>) === Nil;
  }

  /**
   * _O(1)_ Negation of `isEmpty`:
   *
   * ```typescript
   * xs.nonEmpty == !xs.isEmpty
   * ```
   */
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }

  /**
   * _O(n)_ Returns the size of the list.
   *
   * @examples
   *
   * ```typescript
   * > List.empty.size
   * // 0
   *
   * > List(42)
   * // 1
   *
   * > List(1, 2, 3)
   * // 3
   * ```
   */
  public get size(): number {
    return this.foldLeft(0, (n, _) => n + 1);
  }

  /**
   * _O(1)_ Return a view of the list's elements. This function is typically used
   * to "fuse" transformations without creating intermediate structures:
   *
   * ```typescript
   * xs.map(f).filter(p) === xs.view.map(f).filter(p).toList
   * ```
   */
  public get view(): View<A> {
    return View.build((ez, f) => this.foldRight(ez, f));
  }

  /**
   * _O(n)_ Converts the list into an array.
   */
  public get toArray(): A[] {
    const rs: A[] = [];
    this.forEach(x => rs.push(x));
    return rs;
  }

  /**
   * _O(n)_ Converts the list into a sequence.
   */
  public get toSeq(): Seq<A> {
    return Seq.fromList(this);
  }

  /**
   * _O(1)_ Optionally coverts into a non-empty list.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).toNel
   * // Some(NonEmptyList(1, 2, 3))
   *
   * > List(42).toNel
   * // Some(NonEmptyList(42))
   *
   * > List.empty.toNel
   * // None
   * ```
   */
  public get toNel(): Option<NonEmptyList<A>> {
    return NonEmptyList.fromList(this);
  }

  /**
   * _O(1)_ Convert the list into an `Option`, returning `Some(head)` in case of
   * an non-empty list, or `None` otherwise.
   *
   * `xs.toOption` is equivalent to `xs.headOption`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).toOption
   * // Some(1)
   *
   * > List(42).toOption
   * // Some(42)
   *
   * > List.empty.toOption
   * // None
   * ```
   */
  public get toOption(): Option<A> {
    return this.headOption;
  }

  /**
   * _O(1)_ Convert the list into an `Either`, returning `Right(head)` in case of
   * an non-empty list, or `Left(left)` otherwise.
   *
   * Equivalent to:
   *
   * `xs.toRight(left)` is equivalent to `xs.toOption.toRight(left)`
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).toRight(() => 42)
   * // Right(1)
   *
   * > List(1).toRight(() => 42)
   * // Right(1)
   *
   * > List.empty.toRight(() => 42)
   * // Left(42)
   * ```
   */
  public toRight<E>(left: () => E): Either<E, A> {
    return (this as List<A>) === Nil ? Left(left()) : Right(this.head);
  }

  /**
   * _O(1)_ Convert the list into an `Either`, returning `Left(head)` in case of
   * an non-empty list, or `Right(right)` otherwise.
   *
   * Equivalent to:
   *
   * `xs.toLeft(right)` is equivalent to `xs.toOption.toLeft(right)`
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).toLeft(() => 42)
   * // Left(1)
   *
   * > List(1).toLeft(() => 42)
   * // Left(1)
   *
   * > List.empty.toLeft(() => 42)
   * // Right(42)
   * ```
   */
  public toLeft<B>(right: () => B): Either<A, B> {
    return (this as List<A>) === Nil ? Right(right()) : Left(this.head);
  }

  /**
   * _O(n)_ Converts the list into a `Set` using provided `Ord<A>` instance, or
   * `Ord.fromUniversalCompare()` if not provided.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).toSet()
   * // Set(1, 2, 3)
   *
   * > List(1, 2, 2, 3, 3).toSet()
   * // Set(1, 2, 3)
   *
   * > List.empty.toSet()
   * // Set()
   * ```
   */
  public toSet<A>(
    this: List<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): CSet<A> {
    // TODO: use dedicated List constructor
    return this.foldLeft(CSet.empty as CSet<A>, (s, x) => s.insert(x, O));
  }

  /**
   * _O(n)_ Converts the list of tuples `[K, V] into a `Map` using provided
   * `Ord<A>` instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * @examples
   *
   * ```typescript
   * > List([1, 'a'], [2, 'b'], [3, 'c']).toMap()
   * // Map([1, 'a'], [2, 'b'], [3, 'c'])
   *
   * > List([1, 'a'], [2, 'b'], [2, 'c'], [3, 'd'], [3, 'd']).toMap()
   * // Map([1, 'a'], [2, 'c'], [3, 'd'])
   *
   * > List.empty.toMap()
   * // Map()
   * ```
   */
  public toMap<K, V>(
    this: List<[K, V]>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Map<K, V> {
    // TODO: use dedicated List constructor
    return this.foldLeft(Map.empty as Map<K, V>, (s, [k, v]) =>
      s.insert(k, v, O),
    );
  }

  /**
   * _O(1)_ Returns an iterator of the elements of the list.
   *
   * @examples
   *
   * ```typescript
   * > const it = List.empty.iterator
   * > it.next()
   * // { value: undefined, done: true }
   *
   * > const it = List(1, 2).iterator
   * > it.next()
   * // { value: 1, done: false }
   * > it.next()
   * // { value: 2, done: false }
   * > it.next()
   * // { value: undefined, done: true }
   * ```
   */
  public get iterator(): Iterator<A> {
    let cur = this as List<A>;
    return {
      next() {
        if (cur === Nil) return { done: true, value: undefined };
        const value = cur.head;
        cur = cur.tail;
        return { done: false, value };
      },
    };
  }

  public [Symbol.iterator](): Iterator<A> {
    return this.iterator;
  }

  /**
   * _O(n)_ Returns a reversed iterator of the elements of the list.
   *
   * @examples
   *
   * ```typescript
   * > const it = List.empty.iterator
   * > it.next()
   * // { value: undefined, done: true }
   *
   * > const it = List(1, 2).iterator
   * > it.next()
   * // { value: 2, done: false }
   * > it.next()
   * // { value: 1, done: false }
   * > it.next()
   * // { value: undefined, done: true }
   * ```
   */
  public get reverseIterator(): Iterator<A> {
    return this.reverse.iterator;
  }

  /**
   * _O(1)_ Prepend an element `x` at the beginning of the list.
   *
   * @examples
   *
   * ```typescript
   * > List.empty.prepend(42)
   * // List(42)
   *
   * > List(1, 2, 3).prepend(42)
   * // List(42, 1, 2, 3)
   * ```
   */
  public prepend<A>(this: List<A>, x: A): List<A> {
    return new Cons(x, this);
  }

  /**
   * Alias for `prepend`.
   */
  public cons<A>(this: List<A>, x: A): List<A> {
    return this.prepend(x);
  }

  /**
   * _O(n)_ Appends an element `x` at the end of the list.
   *
   * @examples
   *
   * ```typescript
   * > List.empty.append(42)
   * // List(42)
   *
   * > List(1, 2, 3).append(42)
   * // List(1, 2, 3, 42)
   * ```
   */
  public append<A>(this: List<A>, x: A): List<A> {
    return this.concat(new Cons(x, Nil));
  }

  /**
   * _O(n)_ Returns `true` if for all elements of the list satisfy the predicate
   * `p`, or `false` otherwise.
   *
   * ```typescript
   * xs.all(p) === !xs.any(x => !p(x))
   * ```
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).all(() => true)
   * // true
   *
   * > List(1, 2, 3).all(x => x < 3)
   * // false
   *
   * > List.empty.all(() => false)
   * // true
   * ```
   */
  public all<B extends A>(p: (a: A) => a is B): this is List<B>;
  public all(p: (a: A) => boolean): boolean;
  public all(p: (a: A) => boolean): boolean {
    let xs = this as List<A>;
    while (xs !== Nil) {
      if (!p(xs.head)) return false;
      xs = xs.tail;
    }
    return true;
  }

  /**
   * _O(n)_ Returns `true` if for at least one element of the list satisfy the
   * predicate `p`, or `false` otherwise.
   *
   * ```typescript
   * xs.any(p) == !xs.all(x => !p(x))
   * ```
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).any(() => true)
   * // true
   *
   * > List(1, 2, 3).any(x => x < 10)
   * // false
   *
   * > List.empty.any(() => true)
   * // false
   * ```
   */
  public any(p: (a: A) => boolean): boolean {
    let xs = this as List<A>;
    while (xs !== Nil) {
      if (p(xs.head)) return true;
      xs = xs.tail;
    }
    return false;
  }

  /**
   * _O(n)_ Returns number of elements of the list for which satisfy the
   * predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).count(x => x >= 2)
   * // 2
   *
   * > List.empty.count(x => true)
   * // 0
   * ```
   */
  public count(p: (a: A) => boolean): number {
    return this.foldLeft(0, (x, a) => (p(a) ? x + 1 : x));
  }

  /**
   * _O(n)_ Returns max element of the non-empty list, using the provided `Ord<A>`
   * instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * @note This function is partial.
   *
   * @see maxBy for user-supplied comparison function.
   * @see maxOption for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).max()
   * // 3
   *
   * > List.empty.max()
   * // Uncaught Error: Nil.max
   * ```
   */
  public max<A>(this: List<A>, O: Ord<A> = Ord.fromUniversalCompare()): A {
    if ((this as List<A>) === Nil) throw new Error('Nil.max');
    return this.maxBy(O.compare);
  }

  /**
   * Version of `max` function using a user-supplied comparator `cmp`.
   *
   * @note This function is partial.
   *
   * @see maxByOption for a safe variant.
   */
  public maxBy(cmp: (l: A, r: A) => Compare): A {
    if ((this as List<A>) === Nil) throw new Error('Nil.maxBy');
    return this.foldLeft1((max, x) => (cmp(x, max) === Compare.GT ? x : max));
  }

  /**
   * _O(n)_ Optionally returns max element of the empty list, using the provided
   * `Ord<A>` instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * @see maxOptionBy for user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).maxOption()
   * // Some(3)
   *
   * > List.empty.maxOption()
   * // None
   * ```
   */
  public maxOption<A>(
    this: List<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Option<A> {
    return this.maxOptionBy(O.compare);
  }

  /**
   * Version of `maxOption` function using a user-supplied comparator `cmp`.
   */
  public maxOptionBy(cmp: (l: A, r: A) => Compare): Option<A> {
    if ((this as List<A>) === Nil) return None;
    return Some(this.maxBy(cmp));
  }

  /**
   * _O(n)_ Returns min element of the non-empty list, using the provided `Ord<A>`
   * instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * @note This function is partial.
   *
   * @see maxBy for user-supplied comparison function.
   * @see minOption for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).min()
   * // 1
   *
   * > List.empty.min()
   * // Uncaught Error: Nil.min
   * ```
   */
  public min<A>(this: List<A>, O: Ord<A> = Ord.fromUniversalCompare()): A {
    if ((this as List<A>) === Nil) throw new Error('Nil.min');
    return this.minBy(O.compare);
  }

  /**
   *Version of `min` function using a user-supplied comparator `cmp`.
   *
   * @note This function is partial.
   *
   * @see minOptionBy for a safe variant.
   */
  public minBy(this: List<A>, cmp: (l: A, r: A) => Compare): A {
    if ((this as List<A>) === Nil) throw new Error('Nil.minBy');
    return this.foldLeft1((min, x) => (cmp(x, min) === Compare.LT ? x : min));
  }

  /**
   * _O(n)_ Optionally returns min element of the empty list, using the provided
   * `Ord<A>` instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * @see maxOptionBy for user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).minOption()
   * // Some(1)
   *
   * > List.empty.minOption()
   * // None
   * ```
   */
  public minOption<A>(
    this: List<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Option<A> {
    return this.minOptionBy(O.compare);
  }

  /**
   * Version of `minOption` function using a user-supplied comparator `cmp`.
   */
  public minOptionBy<A>(
    this: List<A>,
    cmp: (l: A, r: A) => Compare,
  ): Option<A> {
    if (this === Nil) return None;
    return Some(this.minBy(cmp));
  }

  /**
   * _O(n)_ Returns sum of the elements of the list.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4, 5).sum()
   * // 15
   *
   * > List.empty.sum()
   * // 0
   * ```
   */
  public sum(this: List<number>): number {
    return this.foldLeft(0, (n, x) => n + x);
  }

  /**
   * _O(n)_ Returns product of the elements of the list.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).product()
   * // 120
   *
   * > View.empty.product()
   * // 1
   * ```
   */
  public product(this: List<number>): number {
    return this.foldLeft(0, (n, x) => n * x);
  }

  // -- Sub-lists

  /**
   * Returns prefix of length `n` of the given list if the size of the list is
   * `< n`, otherwise the list itself.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4).take(3)
   * // List(1, 2, 3)
   *
   * > List(1, 2).take(3)
   * // List(1, 2)
   *
   * > List.empty.take(3)
   * // List()
   *
   * > List(1, 2).take(-1)
   * // List()
   * ```
   */
  public take(n: number): List<A> {
    let xs = this as List<A>;
    if (xs === Nil || n-- <= 0) return Nil;

    const h = new Cons(xs.head, Nil);
    let t = h;
    xs = xs.tail;
    while (xs !== Nil && n-- > 0) {
      const nx = new Cons(xs.head, Nil);
      t.tail = nx;
      t = nx;
      xs = xs.tail;
    }
    return h;
  }

  /**
   * Returns suffix of the given list after the first `n` elements.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4).drop(3)
   * // List(3)
   *
   * > List(1, 2).drop(3)
   * // List(1, 2)
   *
   * > List.empty.drop(3)
   * // List()
   *
   * > List(1, 2).drop(-1)
   * // List(1, 2)
   * ```
   */
  public drop(n: number): List<A> {
    let xs = this as List<A>;
    while (xs !== Nil && n-- > 0) {
      xs = xs.tail;
    }
    return xs;
  }

  /**
   * Combination of `drop` and `take`, equivalent to:
   *
   * ```typescript
   * xs.slice(from, until) === xs.drop(from).take(until - from);
   * ```
   */
  public slice(from: number, until: number): List<A> {
    from = Math.max(from, 0);
    until = Math.max(until, 0);
    return this.drop(from).take(until - from);
  }

  /**
   * Return a tuple where the first element if the list's prefix of size `n`
   * and the second element is its remainder.
   *
   * `xs.splitAt(n)` is equivalent to `[xs.take(n), xs.drop(n)]
   *
   * ```typescript
   * > List(1, 2, 3).splitAt(1)
   * // [List(1), List(2, 3)]
   * ```
   */
  public splitAt(n: number): [List<A>, List<A>] {
    let xs = this as List<A>;
    const b = new ListBuffer<A>();
    while (xs !== Nil && n-- > 0) {
      b.addOne(xs.head);
      xs = xs.tail;
    }
    return [b.toList, xs];
  }

  /**
   * Returns a longest prefix of elements satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4, 1, 2, 3, 4).takeWhile(x => x < 3)
   * // List(1, 2)
   *
   * > List(1, 2, 3).takeWhile(x => x < 5)
   * // List(1, 2, 3)
   *
   * > List(1, 2, 3).takeWhile(x => x < 0)
   * // List()
   * ```
   */
  public takeWhile<B extends A>(p: (a: A) => a is B): List<B>;
  public takeWhile(p: (a: A) => boolean): List<A>;
  public takeWhile(p: (a: A) => boolean): List<A> {
    let xs = this as List<A>;
    const b = new ListBuffer<A>();

    while (xs !== Nil && p(xs.head)) {
      b.addOne(xs.head);
      xs = xs.tail;
    }
    return b.toList;
  }

  /**
   * Returns a remainder of the list after removing its longer prefix satisfying
   * the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4, 1, 2, 3, 4).dropWhile(x => x < 3)
   * // List(3, 4, 1, 2, 3, 4)
   *
   * > List(1, 2, 3).dropWhile(x => x < 5)
   * // List()
   *
   * > List(1, 2, 3).dropWhile(x => x < 0)
   * // List(1, 2, 3)
   * ```
   */
  public dropWhile(p: (a: A) => boolean): List<A> {
    let xs = this as List<A>;
    while (xs !== Nil && p(xs.head)) {
      xs = xs.tail;
    }
    return xs;
  }

  /**
   * Returns a tuple where the first element is the longest prefix satisfying
   * the predicate `p` and the second is its remainder.
   *
   * `xs.span(p)` is equivalent to `[xs.takeWhile(p), xs.dropWhile(p)]`
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4, 1, 2, 3, 4).span(x => x < 3)
   * // [List(1, 2), List(3, 4, 1, 2, 3, 4)]
   *
   * > List(1, 2, 3).span(_ => true)
   * // [List(1, 2, 3), List()]
   *
   * > List(1, 2, 3).span(_ => false)
   * // [List(), List(1, 2, 3)]
   * ```
   */
  public span<B extends A>(p: (a: A) => a is B): [List<B>, List<A>];
  public span(p: (a: A) => boolean): [List<A>, List<A>];
  public span(p: (a: A) => boolean): [List<A>, List<A>] {
    let xs = this as List<A>;
    const b = new ListBuffer<A>();

    while (xs !== Nil && p(xs.head)) {
      b.addOne(xs.head);
      xs = xs.tail;
    }
    return [b.toList, xs];
  }

  /**
   * Returns suffix of length `n` of the given list if the size of the list is
   * `< n`, otherwise the list itself.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4).takeRight(3)
   * // List(2, 3, 4)
   *
   * > List(1, 2).takeRight(3)
   * // List(1, 2)
   *
   * > List.empty.takeRight(3)
   * // List()
   *
   * > List(1, 2).takeRight(-1)
   * // List()
   * ```
   */
  public takeRight(n: number): List<A> {
    let lag = this as List<A>;
    let lead = this.drop(n);
    while (lead !== Nil) {
      lag = lag.tail;
      lead = lead.tail;
    }
    return lag;
  }

  /**
   * Returns prefix of the given list after the last `n` elements.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4).dropRight(3)
   * // List(1)
   *
   * > List(1, 2).dropRight(3)
   * // List(1, 2)
   *
   * > List.empty.dropRight(3)
   * // List()
   *
   * > List(1, 2).dropRight(-1)
   * // List(1, 2)
   * ```
   */
  public dropRight(n: number): List<A> {
    let xs = this as List<A>;
    let lead = this.drop(n);
    const b = new ListBuffer<A>();
    while (lead !== Nil) {
      b.addOne(xs.head);
      xs = xs.tail;
      lead = lead.tail;
    }
    return b.toList;
  }

  /**
   * _O(n^2)_ Returns a view of of all possible prefixes of the list, shortest
   * first.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).inits().toArray
   * // [List(), List(1), List(1, 2), List(1, 2, 3)]
   * ```
   */
  public inits(): View<List<A>> {
    return View.build((ez, g) => {
      let taken = 0;
      return this.foldRight(
        Eval.defer(() => g(this, ez)),
        (_a, eb) => g(this.take(taken++), eb),
      );
    });
  }

  /**
   * _O(n)_ Returns a view of of all possible suffixes of the list, longest
   * first.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).inits().toArray
   * // [List(1, 2, 3), List(2, 3), List(3), List()]
   * ```
   */
  public tails(): View<List<A>> {
    return View.build((ez, g) => {
      let xs = this as List<A>;
      return this.foldRight(
        Eval.defer(() => g(Nil, ez)),
        (_a, eb) => {
          const next = g(xs, eb);
          xs = xs !== Nil ? xs.tail : xs;
          return next;
        },
      );
    });
  }

  // -- Searching

  /**
   * _O(n)_ Returns `true` if the list contains the element `a`, or `false`
   * otherwise.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).elem(2)
   * // true
   *
   * > List(1, 2, 3).elem(-1)
   * // false
   *
   * > List([1, 2], [2, 3]).elem(
   * >   [1, 2],
   * >   Eq.tuple(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
   * > )
   * // true
   * ```
   */
  public elem<A>(
    this: List<A>,
    a: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let xs = this;
    while (xs !== Nil) {
      if (E.equals(xs.head, a)) return true;
      xs = xs.tail;
    }
    return false;
  }

  /**
   * Negation of `elem`:
   *
   * ```typescript
   * xs.notElem(x) === !xs.elem(x)
   * ```
   */
  public notElem<A>(
    this: List<A>,
    a: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    return !this.elem(a, E);
  }

  /**
   * _O(n)_ Looks up a key in the association list.
   *
   * @examples
   *
   * ```typescript
   * > List([1, 'one'], [2, 'two'], [3, 'three']).lookup(2)
   * // Some('two')
   *
   * > List([1, 'one']).lookup(2)
   * // None
   *
   * > List.empty.lookup(2)
   * // None
   * ```
   */
  public lookup<K, V>(
    this: List<readonly [K, V]>,
    k: K,
    E: Eq<K> = Eq.fromUniversalEquals(),
  ): Option<V> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let xs = this;
    while (xs !== Nil) {
      const hd = xs.head;
      if (E.equals(hd[0], k)) return Some(hd[1]);
      xs = xs.tail;
    }
    return None;
  }

  /**
   * _O(n)_ Optionally returns the first element of the structure matching the
   * predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > List(0, 10, 20, 30, 40, 50).find(x => x > 42)
   * // Some(50)
   *
   * > List(1, 2, 3).find(x => x < 0)
   * // None
   * ```
   */
  public find<B extends A>(p: (a: A) => a is B): Option<B>;
  public find(p: (a: A) => boolean): Option<A>;
  public find(p: (a: A) => boolean): Option<A> {
    let xs = this as List<A>;
    while (xs !== Nil) {
      const hd = xs.head;
      if (p(hd)) return Some(hd);
      xs = xs.tail;
    }
    return None;
  }

  /**
   * _O(n)_ Returns a list where all elements of the original list satisfy the
   * predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4).filter(x => x % 2 === 0)
   * // List(2, 4)
   *
   * > List.range(1).filter(x => x % 2 === 0).take(3)
   * // List(2, 4, 6)
   * ```
   */
  public filter<B extends A>(p: (a: A) => a is B): List<B>;
  public filter(p: (a: A) => boolean): List<A>;
  public filter(p: (a: A) => boolean): List<A> {
    return this.filterNoneIn(p, false);
  }

  /**
   * _O(n)_ Returns a list where all elements of the original list do not satisfy
   * the predicate `p`.
   *
   * `xs.filterNot(p)` is equivalent to `xs.filter(x => !p(x))`
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4).filterNot(x => x % 2 === 0)
   * // List(1, 3)
   *
   * > List.range(1).filterNot(x => x % 2 === 0).take(3)
   * // List(1, 3, 5)
   * ```
   */
  public filterNot(p: (a: A) => boolean): List<A> {
    return this.filterNoneIn(p, true);
  }

  // -- Ref: https://github.com/scala/scala/blob/v2.13.9/src/library/scala/collection/immutable/List.scala#L502

  private filterNoneIn<A>(p: (a: A) => boolean, isFlipped: boolean): List<A> {
    let xs = this as any as List<A>;
    while (xs !== Nil) {
      if (p(xs.head) !== isFlipped) {
        return _List._filterAllIn(xs, xs.tail, p, isFlipped);
      }
      xs = xs.tail;
    }
    return Nil;
  }

  private static _filterAllIn<A>(
    start: List<A>,
    rem: List<A>,
    p: (a: A) => boolean,
    isFlipped: boolean,
  ): List<A> {
    while (rem !== Nil) {
      if (p(rem.head) === isFlipped) {
        return _List._filterPartialFill(start, rem, p, isFlipped);
      }
      rem = rem.tail;
    }
    return start;
  }

  private static _filterPartialFill<A>(
    origStart: List<A>,
    firstMiss: List<A>,
    p: (a: A) => boolean,
    isFlipped: boolean,
  ): List<A> {
    const newHead = new Cons(origStart.head, Nil);
    let toProcess = origStart.tail;
    let currLast = newHead;

    while (toProcess !== firstMiss) {
      const tmp = new Cons(toProcess.head, Nil);
      currLast.tail = tmp;
      currLast = tmp;
      toProcess = toProcess.tail;
    }

    let next = firstMiss.tail;
    let nextToCopy = next;
    while (next !== Nil) {
      const x = next.head;
      if (p(x) !== isFlipped) {
        next = next.tail;
      } else {
        while (nextToCopy !== next) {
          const tmp = new Cons(nextToCopy.head, Nil);
          currLast.tail = tmp;
          currLast = tmp;
          nextToCopy = nextToCopy.tail;
        }
        nextToCopy = next.tail;
        next = next.tail;
      }
    }

    if (nextToCopy !== Nil) {
      currLast.tail = nextToCopy;
    }

    return newHead;
  }

  /**
   * _O(n)_ A version of `map` which removes elements of the original list.
   *
   * If the function `f` is a combination of a predicate `p: (a: A) => boolean`
   * that determines whether or not a particular element should be kept in the
   * resulting list, and a transformation `g: (a: A) => B`, then `xs.collect(f)`
   * is equivalent to `xs.filter(p).map(f)`.
   *
   * @examples
   *
   * ```typescript
   * > List('1', 'Foo', '3')
   * >   .collect(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * // List(1, 3)
   * ```
   */
  public collect<B>(f: (a: A) => Option<B>): List<B> {
    let xs = this as List<A>;
    const b = new ListBuffer<B>();

    while (xs !== Nil) {
      const r = f(xs.head);
      if (r.nonEmpty) {
        b.addOne(r.get);
      }
      xs = xs.tail;
    }
    return b.toList;
  }

  /**
   * _O(n)_ A version of `collect` which drops the remainder of the list starting
   * with the first element for which the function `f` returns `None`.
   *
   * If the function `f` is a combination of a predicate `p: (a: A) => boolean`
   * that determines whether or not a particular element should be kept in the
   * resulting list, and a transformation `g: (a: A) => B`, then
   * `xs.collectWhile(f)` is equivalent to `xs.takeWhile(p).map(f)`.
   *
   * @examples
   *
   * ```typescript
   * > List('1', 'Foo', '3')
   * >   .collectWhile(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * // List(1)
   * ```
   */
  public collectWhile<B>(f: (a: A) => Option<B>): List<B> {
    let xs = this as List<A>;
    const b = new ListBuffer<B>();

    while (xs !== Nil) {
      const r = f(xs.head);
      if (r.isEmpty) return b.toList;

      b.addOne(r.get);
      xs = xs.tail;
    }
    return b.toList;
  }

  /**
   * _O(n)_ Returns a tuple where the first element is a list containing the
   * elements which satisfy the predicate `p` and the second one which contains
   * the rest of them.
   *
   * `xs.partition(p)` is equivalent to `[xs.filter(p), xs.filterNot(p)]`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4, 5, 6).partition(x => x % 2 === 0)
   * // [List(2, 4, 6), List(1, 3, 5)]
   * ```
   */
  public partition<B extends A>(p: (a: A) => a is B): [List<B>, List<A>];
  public partition(p: (a: A) => boolean): [List<A>, List<A>];
  public partition(p: (a: A) => boolean): [List<A>, List<A>] {
    if ((this as List<A>) === Nil) return [Nil, Nil];
    const s = this.partitionSingleSign(p);
    return s < 2
      ? s === 0
        ? [this, Nil]
        : [Nil, this]
      : this.partitionImpl(p);
  }

  /**
   * This method return 0, 1, 2 for when all values return either false, true,
   * or mixed results for the given predicate.
   *
   *  - 0: all values returned false
   *  - 1: all values returned true
   *  - 2: mixed results
   */
  private partitionSingleSign(p: (a: A) => boolean): number {
    const fst = p(this.head);
    let xs = this.tail;
    while (xs !== Nil) {
      if (fst !== p(xs.head)) return 2; // mixed initial and last value
      xs = xs.tail;
    }
    return fst ? 0 /* left */ : 1 /* right */;
  }

  private partitionImpl(p: (a: A) => boolean): [List<A>, List<A>] {
    let xs = this as List<A>;
    const lb = new ListBuffer<A>();
    const rb = new ListBuffer<A>();

    while (xs !== Nil) {
      const hd = xs.head;
      if (p(hd)) {
        lb.addOne(hd);
      } else {
        rb.addOne(hd);
      }
      xs = xs.tail;
    }
    return [lb.toList, rb.toList];
  }

  /**
   * _O(n)_ Returns a tuple where the first element corresponds to the elements
   * of the list returning `Left<L>` by applying the function `f`, and the second
   * one those that return `Right<R>`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4, 5, 6).partitionWith(x =>
   * >   x % 2 === 0 ? Left(x % 2) : Right(String(x))
   * > )
   * // [List(1, 2, 3), List('1', '3', '5')]
   * ```
   */
  public partitionWith<L, R>(f: (a: A) => Either<L, R>): [List<L>, List<R>] {
    let xs = this as List<A>;
    const lb = new ListBuffer<L>();
    const rb = new ListBuffer<R>();

    while (xs !== Nil) {
      const lr = f(xs.head);
      if (lr.isEmpty) {
        lb.addOne(lr.getLeft);
      } else {
        rb.addOne(lr.get);
      }
      xs = xs.tail;
    }
    return [lb.toList, rb.toList];
  }

  // -- Indexing

  /**
   * _O(n)_ Returns an element at the index `idx`.
   *
   * @note This function is partial.
   *
   * @see getOption for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).get(0)
   * // 1
   *
   * > List(1, 2, 3).get(2)
   * // 3
   *
   * > List(1, 2, 3).get(3)
   * // Uncaught Error: IndexOutOfBounds
   *
   * > List(1, 2, 3).get(-1)
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public get(idx: number): A {
    if (idx < 0) return iob();
    let xs = this as List<A>;
    while (xs !== Nil && idx > 0) {
      xs = xs.tail;
      idx--;
    }
    return xs !== Nil && idx === 0 ? xs.head : iob();
  }
  /**
   * Alias for `get`.
   */
  public '!!'(idx: number): A {
    return this.get(idx);
  }

  /**
   * _O(n)_ Optionally returns an element at the index `idx`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).getOption(0)
   * // Some(1)
   *
   * > List(1, 2, 3).getOption(2)
   * // Some(3)
   *
   * > List(1, 2, 3).getOption(3)
   * // None
   *
   * > List(1, 2, 3).getOption(-1)
   * // None
   * ```
   */
  public getOption(idx: number): Option<A> {
    if (idx < 0) return None;
    let xs = this as List<A>;
    while (xs !== Nil && idx > 0) {
      xs = xs.tail;
      idx--;
    }
    return xs !== Nil && idx === 0 ? Some(xs.head) : None;
  }
  /**
   * Alias for `getOption`.
   */
  public '!?'(idx: number): Option<A> {
    return this.getOption(idx);
  }

  /**
   * _O(n)_ Replace an element at the index `idx` with the new value `x`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > List('a', 'b', 'c').replaceAt(0, 'x')
   * // List('x', 'b', 'c')
   *
   * > List('a', 'b', 'c').replaceAt(2, 'x')
   * // List('a', 'b', 'x')
   *
   * > List('a', 'b', 'c').replaceAt(3, 'x')
   * // Uncaught Error: IndexOutOfBounds
   *
   * > List('a', 'b', 'c').replaceAt(-1, 'x')
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public replaceAt<A>(this: List<A>, idx: number, x: A): List<A> {
    return this.modifyAt(idx, _ => x);
  }

  /**
   * _O(n)_ Transforms an element at the index `idx` using the function `f`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > List('a', 'b', 'c').modifyAt(0, c => c.toUpperCase())
   * // List('A', 'b', 'c')
   *
   * > List('a', 'b', 'c').modifyAt(2, c => c.toUpperCase())
   * // List('a', 'b', 'C')
   *
   * > List('a', 'b', 'c').modifyAt(3, c => c.toUpperCase())
   * // Uncaught Error: IndexOutOfBounds
   *
   * > List('a', 'b', 'c').modifyAt(-1, c => c.toUpperCase())
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public modifyAt<A>(this: List<A>, idx: number, f: (a: A) => A): List<A> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let xs = this;
    if (xs === Nil || idx < 0) return iob();
    if (idx === 0) return new Cons(f(xs.head), xs.tail);

    const h = new Cons(xs.head, Nil);
    xs = xs.tail;
    idx--;
    let t = h;
    while (xs !== Nil && idx > 0) {
      const nx = new Cons(xs.head, Nil);
      t.tail = nx;
      t = nx;
      xs = xs.tail;
      idx--;
    }
    if (xs === Nil || idx !== 0) return iob();
    t.tail = new Cons(f(xs.head), xs.tail);
    return h;
  }

  /**
   * _O(n)_ Inserts an element `x` at the index `idx` shifting the remainder of
   * the list.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > List('a', 'b', 'c').insertAt(0, 'x')
   * // List('x', 'a', 'b', 'c')
   *
   * > List('a', 'b', 'c').insertAt(2, 'x')
   * // List('a', 'b', 'x', 'c')
   *
   * > List('a', 'b', 'c').insertAt(3, 'x')
   * // List('a', 'b', 'c', 'x')
   *
   * > List('a', 'b', 'c').insertAt(4, 'x')
   * // Uncaught Error: IndexOutOfBounds
   *
   * > List('a', 'b', 'c').insertAt(-1, 'x')
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public insertAt<A>(this: List<A>, idx: number, x: A): List<A> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let xs = this;
    if (idx === 0) return new Cons(x, xs);
    if (xs === Nil || idx < 0) return iob();

    const h = new Cons(xs.head, Nil);
    xs = xs.tail;
    idx--;
    let t = h;
    while (xs !== Nil && idx > 0) {
      const nx = new Cons(xs.head, Nil);
      t.tail = nx;
      t = nx;
      xs = xs.tail;
      idx--;
    }
    if (idx !== 0) return iob();
    t.tail = new Cons(x, xs);
    return h;
  }

  /**
   * _O(n)_ Removes an element `x` at the index `idx`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > List('a', 'b', 'c').removeAt(0).toArray
   * // ['b', 'c']
   *
   * > List('a', 'b', 'c').removeAt(2).toArray
   * // ['a', 'b']
   *
   * > List('a', 'b', 'c').removeAt(3).toArray
   * // Uncaught Error: IndexOutOfBounds
   *
   * > List('a', 'b', 'c').removeAt(-1).toArray
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public removeAt(idx: number): List<A> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let xs = this as List<A>;
    if (xs === Nil || idx < 0) return iob();
    if (idx === 0) return xs.tail;

    const h = new Cons(xs.head, Nil);
    xs = xs.tail;
    idx--;
    let t = h;
    while (xs !== Nil && idx > 0) {
      const nx = new Cons(xs.head, Nil);
      t.tail = nx;
      t = nx;
      xs = xs.tail;
      idx--;
    }
    if (xs === Nil || idx !== 0) return iob();
    t.tail = xs.tail;
    return h;
  }

  /**
   * _O(n)_ Returns the first index of on occurrence of the element `x` in the
   * list, or `None` when it does not exist.
   *
   * @see elemIndices to get indices of _all_ occurrences of the element `x`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 1, 2, 3).elemIndex(1)
   * // Some(0)
   *
   * > List(1, 2, 3).elemIndex(3)
   * // Some(2)
   *
   * > List(1, 2, 3).elemIndex(0)
   * // None
   * ```
   */
  public elemIndex<A>(
    this: List<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Option<number> {
    return this.findIndex(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns the indices of all occurrence of the element `x` in the list.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 1, 2, 3).elemIndices(1)
   * // List(0, 3)
   *
   * > List(1, 2, 3).elemIndices(3)
   * // List(2)
   *
   * > List(1, 2, 3).elemIndices(0)
   * // List()
   * ```
   */
  public elemIndices<A>(
    this: List<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): List<number> {
    return this.findIndices(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns index of the first element satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 1, 2, 3).findIndex(x => x > 1)
   * // Some(1)
   *
   * > List(1, 2, 3).findIndex(x => x === 3)
   * // Some(2)
   *
   * > List(1, 2, 3).findIndex(x => x > 20)
   * // None
   * ```
   */
  public findIndex(p: (a: A) => boolean): Option<number> {
    let xs = this as List<A>;
    let idx = 0;
    while (xs !== Nil) {
      if (p(xs.head)) return Some(idx);
      xs = xs.tail;
      idx++;
    }
    return None;
  }

  /**
   * _O(n)_ Returns indices of all elements satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 1, 2, 3).findIndices(x => x > 1)
   * // List(1, 2, 4, 5)
   *
   * > List(1, 2, 3).findIndices(x => x === 3)
   * // List(2)
   *
   * > List(1, 2, 3).findIndices(x => x > 20)
   * // List()
   * ```
   */
  public findIndices(p: (a: A) => boolean): List<number> {
    let xs = this as List<A>;
    let idx = 0;
    const b = new ListBuffer<number>();
    while (xs !== Nil) {
      if (p(xs.head)) {
        b.addOne(idx);
      }
      xs = xs.tail;
      idx++;
    }
    return b.toList;
  }

  // -- Combining and transforming

  /**
   * _O(n)_ Returns list with elements in reversed order.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).reverse
   * // List(3, 2, 1)
   *
   * > List(42).reverse
   * // List(42)
   *
   * > List.empty.reverse
   * // List()
   * ```
   */
  public get reverse(): List<A> {
    let xs = this as List<A>;
    let rs = Nil as List<A>;
    while (xs !== Nil) {
      rs = new Cons(xs.head, rs);
      xs = xs.tail;
    }
    return rs;
  }

  /**
   * _O(n1)_ Appends all elements of the second list.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).concat(List(4, 5, 6))
   * // List(1, 2, 3, 4, 5, 6)
   * ```
   */
  public concat<A>(this: List<A>, that: List<A>): List<A> {
    let xs = this as List<A>;
    if (xs === Nil) return that;

    const h = new Cons(xs.head, Nil);
    let t = h;
    xs = xs.tail;
    while (xs !== Nil) {
      const nx = new Cons(xs.head, Nil);
      t.tail = nx;
      t = nx;
      xs = xs.tail;
    }

    t.tail = that;
    return h;
  }
  /**
   * Alias for `concat`.
   */
  public '++'<A>(this: List<A>, that: List<A>): List<A> {
    return this.concat(that);
  }

  /**
   * _O(n)_ Returns a new list by transforming each element using the function
   * `f`.
   *
   * @examples
   *
   * ```typescript
   * > List('a', 'b', 'c').map(x => x.toUpperCase())
   * // List('A', 'B', 'C')
   *
   * > List.empty.map(() => { throw new Error(); })
   * // List()
   *
   * > List.range(1, 3).map(x => x + 1)
   * // List(2, 3, 4)
   * ```
   */
  public map<B>(f: (a: A) => B): List<B> {
    let xs = this as List<A>;
    if (xs === Nil) return Nil;

    const h = new Cons(f(xs.head), Nil);
    let t = h;
    xs = xs.tail;
    while (xs !== Nil) {
      const nx = new Cons(f(xs.head), Nil);
      t.tail = nx;
      t = nx;
      xs = xs.tail;
    }

    return h;
  }

  /**
   * _O(m + n)_ Returns a list by transforming combination of elements from
   * both lists using the function `f`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2).map2(List('a', 'b'), tupled)
   * // List([1, 'a'], [1, 'b'], [2, 'a'], [2, 'b'])
   * ```
   */
  public map2<B, C>(that: List<B>, f: (a: A, b: B) => C): List<C> {
    if ((this as List<A>) === Nil) return Nil;
    return this.flatMap(x => that.map(y => f(x, y)));
  }

  /**
   * Lazy version of `map2`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2).map2Eval(Eval.now(List('a', 'b')), tupled).value
   * // List([1, 'a'], [1, 'b'], [2, 'a'], [2, 'b'])
   *
   * > List.empty.map2Eval(Eval.bottom(), tupled).value
   * // List()
   * ```
   */
  public map2Eval<B, C>(
    that: Eval<List<B>>,
    f: (a: A, b: B) => C,
  ): Eval<List<C>> {
    return (this as List<A>) === Nil
      ? Eval.now(Nil)
      : that.map(ys => this.map2(ys, f));
  }

  /**
   * Returns a new list by transforming each element using the function `f` and
   * concatenating their results.
   *
   * @examples
   *
   * ```typescript
   * > List(View.range(1), View.range(10), View.range(100))
   * >   .flatMap(xs => xs.take(3).toList)
   * // List(1, 2, 3, 10, 11, 12, 100, 101, 102)
   * ```
   */
  public flatMap<B>(f: (a: A) => List<B>): List<B> {
    let xs = this as List<A>;
    let h: Cons<B> | undefined;
    let t: Cons<B> | undefined;

    while (xs !== Nil) {
      let bs = f(xs.head);

      while (bs !== Nil) {
        const nx = new Cons(bs.head, Nil);
        if (!t) {
          h = nx;
        } else {
          t!.tail = nx;
        }
        t = nx;

        bs = bs.tail;
      }

      xs = xs.tail;
    }

    return h ?? Nil;
  }

  /**
   * Returns a new list concatenating its nested lists.
   *
   * `xss.flatten()` is equivalent to `xss.flatMap(id)`.
   */
  public flatten<A>(this: List<List<A>>): List<A> {
    return this.flatMap(id);
  }

  /**
   * _O(n)_ Create a new list by transforming each of its non-empty tails using
   * a function `f`.
   *
   * @examples
   *
   * ```typescript
   * > List('a', 'b', 'c').coflatMap(xs => xs.size)
   * // List(3, 2, 1)
   * ```
   */
  public coflatMap<B>(f: (xs: List<A>) => B): List<B> {
    let xs = this as List<A>;
    const b = new ListBuffer<B>();
    while (xs !== Nil) {
      b.addOne(f(xs));
      xs = xs.tail;
    }
    return b.toList;
  }

  /**
   * _O(n)_ Inserts the given separator `sep` in between each of the elements of
   * the list.
   *
   * @examples
   *
   * ```typescript
   * > List('a', 'b', 'c').intersperse(',')
   * // List('a', ',', 'b', ',', 'c')
   * ```
   */
  public intersperse<A>(this: List<A>, sep: A): List<A> {
    if (this === Nil) return Nil;
    const h = new Cons(this.head, Nil);
    let t = h;
    let xs = this.tail;

    while (xs !== Nil) {
      const tx = new Cons(xs.head, Nil);
      t.tail = new Cons(sep, tx);
      t = tx;
      xs = xs.tail;
    }
    return h;
  }

  /**
   * _O(n * m)_ Transposes rows and columns of the list.
   *
   * @note This function is total, which means that in case some rows are shorter
   * than others, their elements are skipped in the result.
   *
   * @examples
   *
   * ```typescript
   * > List(List(1, 2, 3), List(4, 5, 6)).transpose()
   * // List(List(1, 4), List(2, 5), List(3, 6))
   *
   * > List(List(10, 11), List(20), List(), List(30, 31, 32)).transpose()
   * // List(List(10, 20, 30), List(11, 31), List(32))
   * ```
   */
  public transpose<A>(this: List<List<A>>): List<List<A>> {
    if (this === Nil) return Nil;

    const bs: ListBuffer<A>[] = [];
    let bsSz = 0;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let xss = this;
    while (xss !== Nil) {
      let i = 0;
      let xs = xss.head;
      while (xs !== Nil) {
        if (i >= bsSz) {
          bs.push(new ListBuffer<A>());
          bsSz++;
        }
        bs[i].addOne(xs.head);
        xs = xs.tail;
        i++;
      }
      xss = xss.tail;
    }

    return List.fromArray(bs.map(b => b.toList));
  }

  /**
   * Returns a view of all subsequences.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).subsequences().toArray
   * // [List(), List(1), List(2), List(1, 2), List(3), List(1, 3), List(2, 3), List(1, 2, 3)]
   * ```
   */
  public subsequences(): View<List<A>> {
    return this.nonEmptySubsequences().prepend(List.empty);
  }

  private nonEmptySubsequences(): View<List<A>> {
    if ((this as List<A>) === Nil) return View.empty;
    return View.build((ez, g) =>
      g(
        new Cons(this.head, Nil),
        Eval.defer(() =>
          this.tail.nonEmptySubsequences().foldRight(ez, (ys, r) =>
            g(
              ys,
              Eval.defer(() => g(new Cons(this.head, ys), r)),
            ),
          ),
        ),
      ),
    );
  }

  // -- Zips

  /**
   * _O(min(n, m))_ Returns a list of pairs of corresponding elements of each
   * list.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).zip(List('a', 'b', 'c'))
   * // List([1, 'a'], [2, 'b'], [3, 'c'])
   *
   * > List(1, 2, 3).zip(List('a', 'b'))
   * // List([1, 'a'], [2, 'b'])
   *
   * > List('a', 'b').zip(List(1, 2, 3))
   * // List(['a', 1], ['b', 2])
   *
   * > List.empty.zip(List(1, 2, 3))
   * // List()
   *
   * > List(1, 2, 3).zip(List.empty)
   * // List()
   * ```
   */
  public zip<B>(that: List<B>): List<[A, B]> {
    return this.zipWith(that, tupled);
  }

  /**
   * Lazy version of `zip` that returns a `View`.
   */
  public zipView<B>(that: List<B>): View<[A, B]> {
    return this.zipWithView(that, tupled);
  }

  /**
   * _O(min(n, m))_ A version of `zip` that takes a user-supplied zipping
   * function `f`.
   *
   * ```typescript
   * xs.zipWith(ys, tupled) === xs.zip(ys)
   * xs.zipWith(ys, f) === xs.zip(ys).map(([x, y]) => f(x, y))
   * ```
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).zipWith(List(4, 5, 6), (x, y) => x + y)
   * // List(5, 7, 9)
   * ```
   */
  public zipWith<B, C>(ys: List<B>, f: (a: A, b: B) => C): List<C> {
    let xs = this as List<A>;
    const rs = new ListBuffer<C>();
    while (xs !== Nil && ys !== Nil) {
      rs.addOne(f(xs.head, ys.head));
      xs = xs.tail;
      ys = ys.tail;
    }
    return rs.toList;
  }

  /**
   * Lazy version of `zipWith` that returns a `View`.
   */
  public zipWithView<B, C>(that: List<B>, f: (a: A, b: B) => C): View<C> {
    return View.build((ez, g) =>
      this.foldRight2(that, ez, (x, y, r) => g(f(x, y), r)),
    );
  }

  /**
   * _O(n)_ Returns a list where each element is zipped with its index in the
   * resulting list.
   *
   * @examples
   *
   * ```typescript
   * > List('a', 'b', 'c').zipWithIndex
   * // List(['a', 0], ['a', 1], ['a', 2])
   *
   * > List(1, 2, 3, 4, 5, 6).filter(x => x % 2 === 0).zipWithIndex.take(3)
   * // List([2, 0], [4, 1], [6, 2])
   *
   * > List(1, 2, 3, 4, 5, 6).zipWithIndex.filter(([x]) => x % 2 === 0).take(3)
   * // List([2, 1], [4, 3], [6, 5])
   * ```
   */
  public get zipWithIndex(): List<[A, number]> {
    let idx = 0;
    return this.map(x => [x, idx++]);
  }

  /**
   * _O(max(n, m))__ Version of `zip` that pads the shorter of the two lists
   * with default values.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).zipAll(List('a', 'b', 'c'), 0, 'x')
   * // List([1, 'a'], [2, 'b'], [3, 'c'])
   *
   * > List(1, 2, 3).zipAll(List('a', 'b'), 0, 'x')
   * // List([1, 'a'], [2, 'b'], [3, 'x'])
   *
   * > List(1, 2).zipAll(List('a', 'b', 'c'), 0, 'x')
   * // List([1, 'a'], [2, 'b'], [0, 'c'])
   * ```
   */
  public zipAll<A, B>(
    this: List<A>,
    that: List<B>,
    defaultX: A,
    defaultY: B,
  ): List<[A, B]> {
    return this.zipAllWith(that, defaultX, defaultY, tupled);
  }

  /**
   * _O(max(m, n))_ A version of `zipAll` that takes a user-supplied zipping
   * function `f`.
   */
  public zipAllWith<A, B, C>(
    this: List<A>,
    ys: List<B>,
    defaultX: A,
    defaultY: B,
    f: (a: A, b: B) => C,
  ): List<C> {
    let xs = this as List<A>;
    const b = new ListBuffer<C>();

    while (xs !== Nil && ys !== Nil) {
      b.addOne(f(xs.head, ys.head));
      xs = xs.tail;
      ys = ys.tail;
    }

    while (xs !== Nil) {
      b.addOne(f(xs.head, defaultY));
      xs = xs.tail;
    }
    while (ys !== Nil) {
      b.addOne(f(defaultX, ys.head));
      ys = ys.tail;
    }

    return b.toList;
  }

  public align<B>(that: List<B>): List<Ior<A, B>> {
    return this.map(Some).zipAllWith(
      that.map(Some),
      None,
      None,
      (l, r) => Ior.fromOptions(l, r).get,
    );
  }

  /**
   * Version of `zip` working on three lists.
   */
  public zip3<B, C>(ys: List<B>, zs: List<C>): List<[A, B, C]> {
    return this.zipWith3(ys, zs, tupled);
  }

  /**
   * Version of `zipView` working on three lists.
   */
  public zipView3<B, C>(ys: List<B>, zs: List<C>): View<[A, B, C]> {
    return this.zipWithView3(ys, zs, tupled);
  }

  /**
   * Version of `zipWith` working on three lists.
   */
  public zipWith3<B, C, D>(
    ys: List<B>,
    zs: List<C>,
    f: (a: A, b: B, c: C) => D,
  ): List<D> {
    let xs = this as List<A>;
    const rs = new ListBuffer<D>();
    while (xs !== Nil && ys !== Nil && zs !== Nil) {
      rs.addOne(f(xs.head, ys.head, zs.head));
      xs = xs.tail;
      ys = ys.tail;
      zs = zs.tail;
    }
    return rs.toList;
  }

  /**
   * Version of `zipWithView` working on three lists.
   */
  public zipWithView3<B, C, D>(
    ys: List<B>,
    zs: List<C>,
    f: (a: A, b: B, c: C) => D,
  ): View<D> {
    return View.build((ez, g) =>
      this.foldRight3(ys, zs, ez, (x, y, z, r) => g(f(x, y, z), r)),
    );
  }

  /**
   * Version of `zipAll` working on three lists.
   */
  public zipAll3<B, C>(
    ys: List<B>,
    zs: List<C>,
    defaultX: A,
    defaultY: B,
    defaultZ: C,
  ): List<[A, B, C]> {
    return this.zipAllWith3(ys, zs, defaultX, defaultY, defaultZ, tupled);
  }

  /**
   * Version of `zipAllWith` working on three lists.
   */
  public zipAllWith3<B, C, D>(
    ys: List<B>,
    zs: List<C>,
    defaultX: A,
    defaultY: B,
    defaultZ: C,
    f: (a: A, b: B, c: C) => D,
  ): List<D> {
    let xs = this as List<A>;
    const b = new ListBuffer<D>();

    while (xs !== Nil && ys !== Nil && zs !== Nil) {
      b.addOne(f(xs.head, ys.head, zs.head));
      xs = xs.tail;
      ys = ys.tail;
      zs = zs.tail;
    }

    while (xs !== Nil || ys !== Nil || zs !== Nil) {
      const x = xs !== Nil ? xs.head : defaultX;
      const y = ys !== Nil ? ys.head : defaultY;
      const z = zs !== Nil ? zs.head : defaultZ;
      b.addOne(f(x, y, z));
      xs = xs.tail;
      ys = ys.tail;
      zs = zs.tail;
    }

    return b.toList;
  }

  /**
   * _O(n)_ Transform a list of pairs into a list with its first components and
   * a list with its second components.
   *
   * @examples
   *
   * ```typescript
   * > List(['a', 1], ['b', 2], ['c', 3]).unzip()
   * // [List('a', 'b', 'c'), List(1, 2, 3)]
   * ```
   */
  public unzip<A, B>(this: List<readonly [A, B]>): [List<A>, List<B>] {
    return this.unzipWith(id);
  }

  /**
   * _O(n)_ Transform a list into a tuple of list by transforming contents of the
   * original into tuples.
   *
   * @examples
   *
   * ```typescript
   * > const quotRem = (x: number, y: number): [number, number] =>
   * >   [x / y | 0, x % y];
   * > List(1, 2, 3, 4).unzipWith(x => quoteRem(x, 2))
   * // [List(0, 1, 1, 2), List(1, 0, 1, 0)]
   * ```
   */
  public unzipWith<B, C>(f: (a: A) => readonly [B, C]): [List<B>, List<C>] {
    let xs = this as List<A>;
    if (xs === Nil) return [Nil, Nil];

    const l = new ListBuffer<B>();
    const r = new ListBuffer<C>();
    while (xs !== Nil) {
      const ab = f(xs.head);
      l.addOne(ab[0]);
      r.addOne(ab[1]);
      xs = xs.tail;
    }
    return [l.toList, r.toList];
  }

  /**
   * Version of `unzip` producing three lists.
   */
  public unzip3<A, B, C>(
    this: List<readonly [A, B, C]>,
  ): [List<A>, List<B>, List<C>] {
    return this.unzipWith3(id);
  }

  /**
   * Version of `unzipWith` producing three lists.
   */
  public unzipWith3<B, C, D>(
    f: (a: A) => readonly [B, C, D],
  ): [List<B>, List<C>, List<D>] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let xs = this as List<A>;
    if (xs === Nil) return [Nil, Nil, Nil];

    const l = new ListBuffer<B>();
    const m = new ListBuffer<C>();
    const r = new ListBuffer<D>();
    while (xs !== Nil) {
      const ab = f(xs.head);
      l.addOne(ab[0]);
      m.addOne(ab[1]);
      r.addOne(ab[2]);
      xs = xs.tail;
    }
    return [l.toList, m.toList, r.toList];
  }

  private foldRight2<B, C>(
    ys: List<B>,
    ez: Eval<C>,
    f: (a: A, b: B, ec: Eval<C>) => Eval<C>,
  ): Eval<C> {
    return this.foldRight(ez, (x, ec) => {
      if (ys === Nil) return ez;
      const y = ys.head;
      ys = ys.tail;
      return f(x, y, ec);
    });
  }

  private foldRight3<B, C, D>(
    ys: List<B>,
    zs: List<C>,
    ez: Eval<D>,
    f: (a: A, b: B, c: C, ed: Eval<D>) => Eval<D>,
  ): Eval<D> {
    return this.foldRight(ez, (x, ec) => {
      if (ys === Nil || zs === Nil) return ez;
      const y = ys.head;
      ys = ys.tail;
      const z = zs.head;
      zs = zs.tail;
      return f(x, y, z, ec);
    });
  }

  // -- Scans

  /**
   * _O(n)_ Returns a view of cumulative results reduced from left:
   *
   * `List(x1, x2, ...).scanLeft(z, f)` is equivalent to `List(z, f(z, x1), f(f(z, x1), x2), ...)`
   *
   *
   * Relationship with `foldLeft`:
   *
   * `xs.scanLeft(z, f).last == xs.foldLeft(z, f)`
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).scanLeft(0, (z, x) => z + x)
   * // List(0, 1, 3, 6)
   *
   * > List.empty.scanLeft(42, (z, x) => z + x)
   * // List(42)
   *
   * > List.range(1, 5).scanLeft(100, (x, y) => x - y)
   * // List(100, 99, 97, 94, 90)
   * ```
   */
  public scanLeft<B>(z: B, f: (b: B, a: A) => B): List<B> {
    let xs = this as List<A>;
    const h = new Cons(z, Nil);
    let t = h;
    while (xs !== Nil) {
      z = f(z, xs.head);
      const nx = new Cons(z, Nil);
      t.tail = nx;
      t = nx;
      xs = xs.tail;
    }
    return h;
  }

  /**
   * Variant of `scanLeft` with no initial value.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).scanLeft1((z, x) => z + x)
   * // List(1, 3, 6)
   *
   * > List.empty.scanLeft1((z, x) => z + x)
   * // List()
   *
   * > List.range(1, 5).scanLeft1((x, y) => x - y)
   * // List(1, -1, -4, -8)
   */
  public scanLeft1<A>(this: List<A>, f: (res: A, a: A) => A): List<A> {
    return this === Nil ? Nil : this.tail.scanLeft(this.head, f);
  }

  /**
   * _O(n)_ Right-to-left dual of `scanLeft`.
   *
   * @see foldRight_ for strict version.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).scanRight_(0, (x, z) => x + z)
   * // List(6, 5, 3, 0)
   *
   * > List.empty.scanRight_(42, (x, z) => x + z)
   * // List(42)
   *
   * > List.range(1, 5).scanRight_(100, (x, z) => x - z)
   * // List(98, -97, 99, -96, 100)
   * ```
   */
  public scanRight<B>(
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): Eval<List<B>> {
    if ((this as List<A>) === Nil) return ez.map(z => new Cons(z, Nil));
    const eqs = Eval.defer(() => this.tail.scanRight(ez, f)).memoize;
    return f(
      this.head,
      eqs.map(qs => qs.head),
    ).flatMap(hd => eqs.map(qs => new Cons(hd, qs)));
  }

  /**
   * Version of `scanRight` with no initial value.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).scanRight1_((x, z) => x + z)
   * // List(6, 5, 3)
   *
   * > List.empty.scanRight1_((x, z) => x + z)
   * // List()
   *
   * > List.range(1, 5).scanRight1_((x, z) => x - z)
   * // List(-2, 3, -1, 4)
   * ```
   */
  public scanRight1<A>(
    this: List<A>,
    f: (a: A, er: Eval<A>) => Eval<A>,
  ): Eval<List<A>> {
    if (this === Nil) return Eval.now(Nil);
    const go = (xs: List<A>): Eval<List<A>> => {
      if (xs.tail === Nil) return Eval.now(xs);
      const eqs = Eval.defer(() => go(xs.tail)).memoize;
      return f(
        xs.head,
        eqs.map(qs => qs.head),
      ).flatMap(hd => eqs.map(qs => new Cons(hd, qs)));
    };
    return go(this);
  }

  /**
   * _O(n)_ Right-to-left dual of `scanLeft`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).scanRight_(0, (x, z) => x + z)
   * // List(6, 5, 3, 0)
   *
   * > List.empty.scanRight_(42, (x, z) => x + z)
   * // List(42)
   *
   * > List.range(1, 5).scanRight_(100, (x, z) => x - z)
   * // List(98, -97, 99, -96, 100)
   * ```
   */
  public scanRight_<B>(z: B, f: (a: A, b: B) => B): List<B> {
    let xs = this.reverse;
    let rs: List<B> = new Cons(z, Nil);
    while (xs !== Nil) {
      z = f(xs.head, z);
      rs = new Cons(z, rs);
      xs = xs.tail;
    }
    return rs;
  }

  /**
   * Version of `scanRight_` with no initial value.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).scanRight1_((x, z) => x + z)
   * // List(6, 5, 3)
   *
   * > List.empty.scanRight1_((x, z) => x + z)
   * // List()
   *
   * > List.range(1, 5).scanRight1_((x, z) => x - z)
   * // List(-2, 3, -1, 4)
   * ```
   */
  public scanRight1_<A>(this: List<A>, f: (a: A, res: A) => A): List<A> {
    if (this === Nil) return Nil;
    let xs = this.reverse;
    let z = xs.head;
    xs = xs.tail;
    let rs: List<A> = new Cons(z, Nil);
    while (xs !== Nil) {
      z = f(xs.head, z);
      rs = new Cons(z, rs);
      xs = xs.tail;
    }
    return rs;
  }

  // -- Set operations

  /**
   * _O(n^2)_ Removes duplicate elements from the list.
   *
   * @see distinctBy for the user supplied equality check.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4, 3, 2, 1, 2, 4, 3, 5).distinct()
   * // List(1, 2, 3, 4, 5)
   * ```
   */
  public distinct<A>(this: List<A>, E?: Eq<A>): List<A> {
    return E ? this.distinctBy(E.equals) : this.distinctPrim();
  }

  /**
   * Version of `distinct` function using a user-supplied equality check `eq`.
   */
  public distinctBy(eq: (x: A, y: A) => boolean): List<A> {
    let xs = this as List<A>;
    const seen: A[] = [];
    const r = new ListBuffer<A>();

    while (xs !== Nil) {
      const x = xs.head;
      if (!seen.some(y => eq(x, y))) {
        r.addOne(x);
        seen.push(x);
      }
      xs = xs.tail;
    }
    return r.toList;
  }

  private distinctPrim(): List<A> {
    let xs = this as List<A>;
    const seen: Set<A> = new Set();
    const r = new ListBuffer<A>();

    while (xs !== Nil) {
      const x = xs.head;
      if (!seen.has(x)) {
        r.addOne(x);
        seen.add(x);
      }
      xs = xs.tail;
    }
    return r.toList;
  }

  /**
   * _O(n)_ Removes the first occurrence of `x` in the list.
   *
   * @see removeBy for the use-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 1, 2, 3).remove(1)
   * // List(2, 3, 1, 2, 3)
   *
   * > List(2, 3).remove(1)
   * // List(2, 3)
   *
   * > List().remove(1)
   * // List()
   * ```
   */
  public remove<A>(
    this: List<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): List<A> {
    return this.removeBy(x, E.equals);
  }

  /**
   * Version of `remove` function using a user-supplied equality check `eq`.
   */
  public removeBy<A>(
    this: List<A>,
    x: A,
    eq: (x: A, y: A) => boolean,
  ): List<A> {
    const toRemove = this.findToRemove(x, eq);
    if (toRemove === Nil) return this; // we have not found an element to remove
    if (toRemove === this) return this.tail;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const h = new Cons(this.head, Nil);
    let xs = this.tail;
    let t = h;

    while (xs !== toRemove) {
      const nx = new Cons(xs.head, Nil);
      t.tail = nx;
      t = nx;
      xs = xs.tail;
    }
    t.tail = xs.tail;
    return h;
  }

  private findToRemove<A>(
    this: List<A>,
    x: A,
    eq: (x: A, y: A) => boolean,
  ): List<A> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let xs = this;
    while (xs !== Nil && !eq(xs.head, x)) {
      xs = xs.tail;
    }
    return xs;
  }

  /**
   * _O(n * m)_ A non-associative collection difference. `difference` removes
   * first occurrence of each element of `that` in the current list.
   *
   * `xs.concat(ys).difference(xs) === ys`
   *
   * @see differenceBy for the user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 1, 2, 3).difference(List(2, 3))
   * // List(1, 1, 2, 3)
   *
   * > List(1, 2, 3, 1, 2, 3).difference(List(1, 1, 2))
   * // List(3, 2, 3)
   *
   * > List.range(1, 9).difference(List(1, 2, 3))
   * // List(4, 5, 6, 7, 8)
   * ```
   */
  public difference<A>(
    this: List<A>,
    that: List<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): List<A> {
    return this.differenceBy(that, E.equals);
  }

  /**
   * Alias for `difference`.
   */
  public '\\'<A>(
    this: List<A>,
    that: List<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): List<A> {
    return this.difference(that, E);
  }

  /**
   * Version of `difference` that uses user-supplied equality check `eq`.
   */
  public differenceBy<A>(
    this: List<A>,
    that: List<A>,
    eq: (x: A, y: A) => boolean,
  ): List<A> {
    return that.foldLeft(this, (xs, x) => xs.removeBy(x, eq));
  }

  /**
   * _O(max(n, m) * m)_ Creates a union of two lists.
   *
   * Duplicates and the elements from the first list are removed from the second
   * one. But if there are duplicates in the original list, they are present in
   * the result as well.
   *
   * @see unionBy for the user-supplied equality check.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).union(List(2, 3, 4))
   * // List(1, 2, 3, 4)
   *
   * > List(1, 2, 3).union(List(1, 2, 3, 3, 4))
   * // List(1, 2, 3, 4)
   *
   * > List(1, 1, 2, 3, 6).union(List(2, 3, 4))
   * // List(1, 1, 2, 3, 6, 4)
   *
   * > List.range(1).union(List.range(1)).take(5)
   * // List(1, 2, 3, 4, 5)
   *
   * > List(1, 2, 3).union(List.rage(1)).take(5)
   * // List(1, 2, 3, 4, 5)
   * ```
   */
  public union<A>(this: List<A>, that: List<A>, E?: Eq<A>): List<A> {
    return E ? this.unionBy(that, E.equals) : this.unionPrim(that);
  }

  /**
   * Version of `union` that uses a user-supplied equality check `eq`.
   */
  public unionBy<A>(
    this: List<A>,
    that: List<A>,
    eq: (x: A, y: A) => boolean,
  ): List<A> {
    return this.concat(
      this.foldLeft(that.distinctBy(eq), (xs, x) => xs.removeBy(x, eq)),
    );
  }

  private unionPrim<A>(this: List<A>, that: List<A>): List<A> {
    return this.concat(
      this.foldLeft(that.distinctPrim(), (xs, x) => xs.remove(x)),
    );
  }

  /**
   * _O(n * m)_ Creates an intersection of two lists. If the first list contains
   * duplicates so does the second
   *
   * @see intersectBy for a user-supplied equality check.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4).intersect(List(2, 4, 6, 8))
   * // List(2, 4)
   *
   * > List(1, 1, 2, 3).intersect(List(1, 2, 2, 5))
   * // List(1, 1, 2)
   * ```
   */
  public intersect<A>(
    this: List<A>,
    that: List<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): List<A> {
    return this.intersectBy(that, E.equals);
  }

  /**
   * Version of `intersect` that uses user-supplied equality check `eq`.
   */
  public intersectBy<A>(
    this: List<A>,
    that: List<A>,
    eq: (x: A, y: A) => boolean,
  ): List<A> {
    return this.filter(x => that.any(y => eq(x, y)));
  }

  // -- Folds

  /**
   * Apply `f` to each element of the view for its side-effect.
   *
   * @examples
   *
   * ```typescript
   * > let acc = 0;
   * > List(1, 2, 3, 4, 5).forEach(x => acc += x)
   * > acc
   * // 15
   * ```
   */
  public forEach(f: (a: A) => void): void {
    let xs = this as List<A>;
    while (xs !== Nil) {
      f(xs.head);
      xs = xs.tail;
    }
  }

  /**
   * Apply a left-associative operator `f` to each element of the `List` reducing
   * the list from left to right:
   *
   * ```typescript
   * List(x1, x2, ..., xn) === f( ... f(f(z, x1), x2), ... xn)
   * ```
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4, 5).foldLeft(0, (x, y) => x + y)
   * // 15
   *
   * > List.empty.foldLeft(42, (x, y) => x + y)
   * // 42
   * ```
   */
  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    let xs = this as List<A>;
    while (xs !== Nil) {
      z = f(z, xs.head);
      xs = xs.tail;
    }
    return z;
  }

  /**
   * Version of `foldLeft` without initial value and therefore it can be applied
   * only to non-empty structures.
   *
   * @note This function is partial.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).foldLeft1((x, y) => x + y)
   * // 6
   *
   * > List.empty.foldLeft1((x, y) => x + y)
   * // Uncaught Error: List.foldLeft1: empty List
   * ```
   */
  public foldLeft1<A>(this: List<A>, f: (res: A, x: A) => A): A {
    return this === Nil
      ? throwError(new Error('Nil.foldLeft1'))
      : this.tail.foldLeft(this.head, f);
  }

  /**
   * Apply a right-associative operator `f` to each element of the `List`,
   * reducing the list from right to left lazily:
   *
   * ```typescript
   * List(x1, x2, ..., xn).foldRight(z, f) === f(x1, Eval.defer(() => f(x2, ... Eval.defer(() => f(xn, z), ... ))))
   * ```
   *
   * @see foldRight_ for the strict, non-short-circuiting version.
   *
   * @examples
   *
   * ```typescript
   * > List(false, true, false).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
   * // true
   *
   * > List(false).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
   * // false
   *
   * > List(true).foldRight(Eval.bottom(), (x, r) => x ? Eval.true : r).value
   * // true
   * ```
   */
  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    let xs = this as List<A>;
    const go: Eval<B> = Eval.defer(() => {
      if (xs === Nil) return ez;
      const x = xs.head;
      xs = xs.tail;
      return f(x, go);
    });
    return go;
  }

  /**
   * Version of `foldRight` without initial value and therefore it can be applied
   * only to non-empty structures.
   *
   * @note This function is partial.
   *
   * @see foldRight1_ for the strict, non-short-circuiting version.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).foldRight1((x, ey) => ey.map(y => x + y)).value
   * // 6
   *
   * > List.empty.foldRight1((x, ey) => ey.map(y => x + y)).value
   * // Uncaught Error: Nil.foldRight1
   * ```
   */
  public foldRight1<A>(
    this: List<A>,
    f: (a: A, ea: Eval<A>) => Eval<A>,
  ): Eval<A> {
    let xs = this as List<A>;
    const go: Eval<A> = Eval.defer(() => {
      if (xs === Nil) return throwError(new Error('Nil.foldRight1'));
      if (xs.tail === Nil) return Eval.now(xs.head);

      const x = xs.head;
      xs = xs.tail;
      return f(x, go);
    });
    return go;
  }

  /**
   * Strict, non-short-circuiting version of the `foldRight`.
   */
  public foldRight_<B>(z: B, f: (a: A, b: B) => B): B {
    let xs = this.reverse;
    while (xs !== Nil) {
      z = f(xs.head, z);
      xs = xs.tail;
    }
    return z;
  }

  /**
   * Strict, non-short-circuiting version of the `foldRight1`.
   */
  public foldRight1_<A>(this: List<A>, f: (x: A, res: A) => A): A {
    if (this === Nil) throw new Error('Nil.foldRight1_');
    let xs = this.reverse;
    let z = xs.head;
    xs = xs.tail;
    while (xs !== Nil) {
      z = f(xs.head, z);
      xs = xs.tail;
    }
    return z;
  }

  /**
   * Right associative, lazy fold mapping each element of the structure into a
   * monoid `M` and combining their results using `combineEval`.
   *
   * `xs.folMap(M, f)` is equivalent to `xs.foldRight(Eval.now(M.empty), (a, eb) => M.combineEval_(f(a), eb)).value`
   *
   * @see foldMapK for a version accepting a `MonoidK` instance
   * @see foldMapLeft for a left-associative, strict variant
   *
   * @examples
   *
   * ```typescript
   * > List(1, 3, 5).foldMap(Monoid.addition, id)
   * // 9
   *
   * > List(1, 3, 5).foldMap(Monoid.product, id)
   * // 15
   * ```
   */
  public foldMap<M>(M: Monoid<M>, f: (a: A) => M): M {
    return this.foldRight(Eval.now(M.empty), (a, eb) =>
      M.combineEval_(f(a), eb),
    ).value;
  }

  /**
   * Version of `foldMap` that accepts `MonoidK` instance.
   */
  public foldMapK<F>(F: MonoidK<F>) {
    return <B>(f: (a: A) => Kind<F, [B]>) => this.foldMap(F.algebra<B>(), f);
  }

  /**
   * Left-associative, strict version of `foldMap`.
   */
  public foldMapLeft<M>(M: Monoid<M>, f: (a: A) => M): M {
    return this.foldLeft(M.empty, (b, a) => M.combine_(b, f(a)));
  }

  // -- Sorted Lists

  /**
   * _O(n * log(n))_ Return sorted list.
   *
   * @see sortBy for user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 6, 4, 3, 2, 5).sort()
   * // List(1, 2, 3, 4, 5, 6)
   * ```
   */
  public sort<A>(
    this: List<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): List<A> {
    return this.sortBy(O.compare);
  }

  /**
   * _O(n * log(n))_ Return a list sorted by comparing results of function `f`
   * applied to each of the element of the list.
   *
   * @examples
   *
   * ```typescript
   * > List([2, 'world'], [4, '!'], [1, 'Hello']).sortOn(([fst, ]) => fst)
   * // List([1, 'Hello'], [2, 'world'], [4, '!']])
   * ```
   */
  public sortOn<B>(
    f: (a: A) => B,
    O: Ord<B> = Ord.fromUniversalCompare(),
  ): List<A> {
    return this.sortBy((l, r) => O.compare(f(l), f(r)));
  }

  /**
   * Version of `sort` function using a user-supplied comparator `cmp`.
   */
  public sortBy(cmp: (l: A, r: A) => Compare): List<A> {
    return List.fromArray(this.toArray.sort((x, y) => cmp(x, y) - 1));
  }

  /**
   * _O(n)_ Inserts the element at the first position which is less, or equal to
   * the inserted element. In particular, if the list is sorted to begin with,
   * it will remain to be sorted.
   *
   * @see insertBy for user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 5, 6, 7).insert(4)
   * // List(1, 2, 3, 4, 5, 6, 7)
   * ```
   */
  public insert<A>(
    this: List<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): List<A> {
    return this.insertBy(x, O.compare);
  }

  /**
   * Version of `insert` function using a user-supplied comparator `cmp`.
   */
  public insertBy<A>(
    this: List<A>,
    x: A,
    cmp: (x: A, y: A) => Compare,
  ): List<A> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ys = this;
    if (ys === Nil) return new Cons(x, Nil);
    if (cmp(x, ys.head) !== Compare.GT) return new Cons(x, ys);

    const h = new Cons(ys.head, Nil);
    let t = h;
    ys = ys.tail;
    while (ys !== Nil && cmp(x, ys.head) === Compare.GT) {
      const nx = new Cons(ys.head, Nil);
      t.tail = nx;
      t = nx;
      ys = ys.tail;
    }
    t.tail = new Cons(x, ys);
    return h;
  }

  // -- Traversals

  /**
   * Transform each element of the structure into an applicative action and
   * evaluate them left-to-right combining their result into a `List`.
   *
   * `traverse` uses `map2Eval` function of the provided applicative `G` allowing
   * for short-circuiting.
   *
   * @see traverse_ for result-ignoring version.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3, 4).traverse(Option.Monad, Some)
   * // Some(List(1, 2, 3, 4))
   *
   * > List(1, 2, 3, 4).traverse(Option.Monad, _ => None)
   * // None
   * ```
   */
  public traverse<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [B]>,
  ): Kind<G, [List<B>]> {
    return isIdentityTC(G)
      ? (this.map(f) as any)
      : Apply.TraverseStrategy(G)(Rhs => this.traverseImpl(G, Rhs, f));
  }

  private traverseImpl<G, Rhs, B>(
    G: Applicative<G>,
    Rhs: TraverseStrategy<G, Rhs>,
    f: (a: A) => Kind<G, [B]>,
  ): Kind<G, [List<B>]> {
    const consF = (x: A, gys: Kind<Rhs, [Kind<G, [List<B>]>]>) =>
      Rhs.map2Rhs(f(x), gys, List.cons);

    return Rhs.toG(
      Rhs.defer(() =>
        this.foldRightTraverse(
          Rhs,
          Rhs.toRhs(() => G.pure(Nil as List<B>)),
          consF,
        ),
      ),
    );
  }

  /**
   * Evaluate each applicative action of the structure left-to-right and combine
   * their results.
   *
   * `xs.sequence(G)` is equivalent to `xs.traverse(G, id)`.
   *
   * `sequence` uses `map2Eval` function of the provided applicative `G` allowing
   * for short-circuiting.
   *
   * @see sequence_ for result-ignoring version.
   *
   * @examples
   *
   * ```View
   * > List(Some(1), Some(2), Some(3)).sequence(Option.Monad)
   * // Some(List(1, 2, 3))
   *
   * > List(Some(1), Some(2), None).sequence(Option.Monad)
   * // None
   * ```
   */
  public sequence<G, A>(
    this: List<Kind<G, [A]>>,
    G: Applicative<G>,
  ): Kind<G, [List<A>]> {
    return this.traverse(G, id);
  }

  /**
   * Transform each element of the structure into an applicative action and
   * evaluate them left-to-right ignoring the results.
   *
   * `traverse_` uses `map2Eval` function of the provided applicative `G` allowing
   * for short-circuiting.
   */
  public traverse_<G>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [unknown]>,
  ): Kind<G, [void]> {
    const discard = (): void => {};

    return isIdentityTC(G)
      ? (this.forEach(f) as any)
      : this.foldRight(Eval.now(G.unit), (x, eb) =>
          G.map2Eval_(f(x), eb, discard),
        ).value;
  }

  /**
   * Evaluate each applicative action of the structure left-to-right ignoring
   * their results.
   *
   * `sequence_` uses `map2Eval` function of the provided applicative `G` allowing
   * for short-circuiting.
   */
  public sequence_<G>(
    this: List<Kind<G, [unknown]>>,
    G: Applicative<G>,
  ): Kind<G, [void]> {
    return this.traverse_(G, id);
  }

  /**
   * Version of `traverse` which removes elements of the original list.
   *
   * @examples
   *
   * ```typescript
   * > const m: Map<number, string> = Map([1, 'one'], [3, 'three'])
   * > List(1, 2, 3).traverseFilter(
   * >   Monad.Eval,
   * >   k => Eval.now(m.lookup(k)),
   * > ).value
   * // List('one', 'three')
   * ```
   */
  public traverseFilter<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [Option<B>]>,
  ): Kind<G, [List<B>]> {
    return isIdentityTC(G)
      ? (this.collect(f as any) as any)
      : Apply.TraverseStrategy(G)(Rhs => this.traverseFilterImpl(G, Rhs, f));
  }

  private traverseFilterImpl<G, Rhs, B>(
    G: Applicative<G>,
    Rhs: TraverseStrategy<G, Rhs>,
    f: (a: A) => Kind<G, [Option<B>]>,
  ): Kind<G, [List<B>]> {
    const consF = (x: A, gys: Kind<Rhs, [Kind<G, [List<B>]>]>) =>
      Rhs.map2Rhs(f(x), gys, (oy, ys) =>
        oy.isEmpty ? ys : new Cons(oy.get, ys),
      );

    return Rhs.toG(
      Rhs.defer(() =>
        this.foldRightTraverse(
          Rhs,
          Rhs.toRhs(() => G.pure(Nil as List<B>)),
          consF,
        ),
      ),
    );
  }

  private foldRightTraverse<F, Rhs, B>(
    Rhs: TraverseStrategy<F, Rhs>,
    ez: Kind<Rhs, [Kind<F, [B]>]>,
    f: (a: A, eb: Kind<Rhs, [Kind<F, [B]>]>) => Kind<Rhs, [Kind<F, [B]>]>,
  ): Kind<Rhs, [Kind<F, [B]>]> {
    let xs = this as List<A>;
    const go: Kind<Rhs, [Kind<F, [B]>]> = Rhs.defer(() => {
      if (xs === Nil) return ez;
      const x = xs.head;
      xs = xs.tail;
      return f(x, go);
    });
    return go;
  }

  // -- Strings

  /**
   * Given a list of strings, combine them into a single string separated by the
   * separator `sep`.
   *
   * @examples
   *
   * ```typescript
   * > List(1, 2, 3).join()
   * // '1,2,3'
   *
   * > List('a', 'b', 'c').join(' ')
   * // 'a b c'
   *
   * > List('a', 'b', 'c').join('')
   * // 'abc'
   * ```
   */
  public join(this: List<string>, sep: string = ','): string {
    if (this === Nil) return '';
    return this.tail.foldLeft(this.head, (r, x) => r + sep + x);
  }

  public toString(): string {
    return `List(${this.map(String).join(',')})`;
  }

  // -- Misc

  /**
   * _O(1)_ Conditionally execute either `onNil` or `onCons` functions
   * destructuring potentially empty list into its head and tail.
   */
  public abstract fold<B, C = B>(
    onNil: () => B,
    onCons: (head: A, tail: List<A>) => C,
  ): B | C;

  public equals<A>(
    this: List<A>,
    that: List<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    if (this === that) return true;
    if (this === Nil || that === Nil) return false;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let xs = this;
    let ys = that;
    while (xs !== Nil && ys !== Nil && xs !== ys) {
      if (E.notEquals(xs.head, ys.head)) return false;
      xs = xs.tail;
      ys = ys.tail;
    }
    return xs === ys;
  }
}

class Cons<A> extends _List<A> {
  public constructor(public readonly head: A, public tail: List<A>) {
    super();
  }

  public fold<B, C = B>(
    onNil: () => B,
    onCons: (head: A, tail: List<A>) => C,
  ): B | C {
    return onCons(this.head, this.tail);
  }
}

class _Nil extends _List<never> {
  public get head(): never {
    throw new Error('Nil.head');
  }

  public get tail(): List<never> {
    return this;
  }

  public fold<B, C = B>(
    onNil: () => B,
    onCons: (head: never, tail: List<never>) => C,
  ): B | C {
    return onNil();
  }
}

const Nil: List<never> = new _Nil();

List.empty = Nil as List<never>;

List.Eq = <A>(E: Eq<A>): Eq<List<A>> =>
  Eq.of({ equals: (l, r) => l.equals(r, E) });
List.EqK = null as any as EqK<ListF>;
List.Align = null as any as Align<ListF>;
List.Unzip = null as any as Unzip<ListF>;
List.MonoidK = null as any as MonoidK<ListF>;
List.Functor = null as any as Functor<ListF>;
List.FunctorFilter = null as any as FunctorFilter<ListF>;
List.Applicative = null as any as Applicative<ListF>;
List.Alternative = null as any as Alternative<ListF>;
List.Monad = null as any as Monad<ListF>;
List.MonadPlus = null as any as MonadPlus<ListF>;
List.CoflatMap = null as any as CoflatMap<ListF>;
List.Foldable = null as any as Foldable<ListF>;
List.TraversableFilter = null as any as TraversableFilter<ListF>;

const listEqK = lazy(() => EqK.of<ListF>({ liftEq: List.Eq }));
const listFunctor = lazy(() =>
  Functor.of<ListF>({ map_: (fa, f) => fa.map(f) }),
);
const listAlign = lazy(() =>
  Align.of<ListF>({
    ...listFunctor(),
    align_: (fa, fb) => fa.align(fb),
    zipAll: (fa, fb, a, b) => fa.zipAll(fb, a, b),
  }),
);
const listUnzip = lazy(() =>
  Unzip.of({
    ...listFunctor(),
    zip_: (xs, ys) => xs.zip(ys),
    zipWith_: (xs, ys, f) => xs.zipWith(ys, f),
    unzip: xs => xs.unzip(),
    unzipWith_: (xs, f) => xs.unzipWith(f),
  }),
);
const listFunctorFilter = lazy(() =>
  FunctorFilter.of<ListF>({
    ...listFunctor(),
    mapFilter_: (fa, f) => fa.collect(f),
    collect_: (fa, f) => fa.collect(f),
    filter_: <A>(fa: List<A>, f: (a: A) => boolean) => fa.filter(f),
    filterNot_: (fa, f) => fa.filterNot(f),
  }),
);
const listMonoidK = lazy(() =>
  MonoidK.of<ListF>({
    emptyK: () => List.empty,
    combineK_: (xs, ys) => xs['++'](ys),
  }),
);
const listApplicative = lazy(() =>
  Applicative.of<ListF>({
    ...listFunctor(),
    pure: List.singleton,
    ap_: (ff, fa) => ff.map2(fa, (f, a) => f(a)),
    map2_: (fa, fb, f) => fa.map2(fb, f),
    map2Eval_: (fa, efb, f) => fa.map2Eval(efb, f),
  }),
);
const listAlternative = lazy(() =>
  Alternative.of<ListF>({
    ...listMonoidK(),
    ...listApplicative(),
  }),
);
const listCoflatMap = lazy(() =>
  CoflatMap.of({
    ...listFunctor(),
    coflatMap_: (fa, f) => fa.coflatMap(f),
  }),
);
const listMonad = lazy(() =>
  Monad.of<ListF>({
    ...listApplicative(),
    flatMap_: (fa, f) => fa.flatMap(f),
    flatten: fa => fa.flatten(),
    tailRecM_: List.tailRecM_,
  }),
);
const listMonadPlus = lazy(() =>
  MonadPlus.of<ListF>({
    ...listMonad(),
    ...listAlternative(),
    ...listFunctorFilter(),
  }),
);
const listFoldable = lazy(() =>
  Foldable.of<ListF>({
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(fa: List<A>, f: (a: A) => M) =>
        fa.foldMap(M, f),
    foldMapLeft_:
      <M>(M: Monoid<M>) =>
      <A>(fa: List<A>, f: (a: A) => M) =>
        fa.foldMapLeft(M, f),
    foldLeft_: (fa, z, f) => fa.foldLeft(z, f),
    foldRight_: (fa, ez, f) => fa.foldRight(ez, f),
    isEmpty: xs => xs.isEmpty,
    nonEmpty: xs => xs.nonEmpty,
    size: xs => xs.size,
    all_: (xs, f) => xs.all(f),
    any_: (xs, f) => xs.any(f),
    count_: (xs, f) => xs.count(f),
    iterator: xs => xs.iterator,
    toArray: xs => xs.toArray,
  }),
);
const listTraversableFilter = lazy(() =>
  TraversableFilter.of<ListF>({
    ...listFoldable(),
    ...listFunctorFilter(),
    traverseFilter_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: List<A>, f: (a: A) => Kind<G, [Option<B>]>) =>
        fa.traverseFilter(G, f),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: List<A>, f: (a: A) => Kind<G, [B]>) =>
        fa.traverse(G, f),

    sequence:
      <G>(G: Applicative<G>) =>
      <A>(fa: List<Kind<G, [A]>>) =>
        fa.sequence(G),
  }),
);

Object.defineProperty(List, 'EqK', {
  get() {
    return listEqK();
  },
});
Object.defineProperty(List, 'Functor', {
  get() {
    return listFunctor();
  },
});
Object.defineProperty(List, 'Align', {
  get() {
    return listAlign();
  },
});
Object.defineProperty(List, 'Unzip', {
  get() {
    return listUnzip();
  },
});
Object.defineProperty(List, 'FunctorFilter', {
  get() {
    return listFunctorFilter();
  },
});
Object.defineProperty(List, 'MonoidK', {
  get() {
    return listMonoidK();
  },
});
Object.defineProperty(List, 'Applicative', {
  get() {
    return listApplicative();
  },
});
Object.defineProperty(List, 'Alternative', {
  get() {
    return listAlternative();
  },
});
Object.defineProperty(List, 'CoflatMap', {
  get() {
    return listCoflatMap();
  },
});
Object.defineProperty(List, 'Monad', {
  get() {
    return listMonad();
  },
});
Object.defineProperty(List, 'MonadPlus', {
  get() {
    return listMonadPlus();
  },
});
Object.defineProperty(List, 'Foldable', {
  get() {
    return listFoldable();
  },
});
Object.defineProperty(List, 'TraversableFilter', {
  get() {
    return listTraversableFilter();
  },
});

export class ListBuffer<A> {
  private first: List<A> = Nil;
  private last?: Cons<A>;
  private len: number = 0;

  private aliased: boolean = false;

  public get isEmpty(): boolean {
    return this.len === 0;
  }
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }

  public get toList(): List<A> {
    this.aliased = this.nonEmpty;
    return this.first;
  }

  private ensureUnAliased(): void {
    if (this.aliased) this.copyElems();
  }

  private copyElems(): void {
    const buf = ListBuffer.fromIterator(this.iterator());
    this.first = buf.first;
    this.last = buf.last;
    this.len = buf.len;
    this.aliased = false;
  }

  public *iterator(): Iterator<A> {
    if (this.isEmpty) return;

    let cur = this.first;
    const lst = this.last!;
    while (cur !== lst) {
      yield cur.head;
      cur = cur.tail;
    }
    yield cur.head;
  }

  public addOne(x: A): this {
    this.ensureUnAliased();
    const tmp = new Cons(x, Nil);
    if (this.len === 0) this.first = tmp;
    else this.last!.tail = tmp;

    this.last = tmp;
    this.len += 1;
    return this;
  }

  public addAll(xs: List<A>): this {
    return this.addAllIterable(xs.iterator);
  }

  public addAllIterable(it: Iterator<A>): this {
    const fst = it.next();
    if (!fst.done) {
      const fresh = ListBuffer.fromIterator(it);
      this.ensureUnAliased();
      if (this.isEmpty) this.first = new Cons(fst.value, fresh.first);
      else this.last!.tail = new Cons(fst.value, fresh.first);
      this.last = fresh.last;
      this.len += fresh.len;
    }
    return this;
  }

  public static fromIterator<A>(it: Iterator<A>): ListBuffer<A> {
    const buf = new ListBuffer<A>();
    const fst = it.next();

    if (!fst.done) {
      const first = new Cons(fst.value, Nil);
      let last = first;
      let len = 1;

      for (let i = it.next(); !i.done; i = it.next(), len++) {
        const tmp = new Cons(i.value, Nil);
        last.tail = tmp;
        last = tmp;
      }

      buf.first = first as any;
      buf.last = last;
      buf.len = len;
    }

    return buf;
  }
}

function iob(): never {
  throw new Error('IndexOutOfBounds');
}

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface ListF extends TyK<[unknown]> {
  [$type]: List<TyVar<this, 0>>;
}
