// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $type,
  cached,
  Eval,
  id,
  Kind,
  lazy,
  throwError,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { Compare, Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { Alternative } from '../../alternative';
import { Applicative } from '../../applicative';
import { Apply, TraverseStrategy } from '../../apply';
import { CoflatMap } from '../../coflat-map';
import { EqK } from '../../eq-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Foldable } from '../../foldable';
import { MonadPlus } from '../../monad-plus';
import { Monad } from '../../monad';
import { MonoidK } from '../../monoid-k';
import { Traversable } from '../../traversable';
import { TraversableFilter } from '../../traversable-filter';
import { Unzip } from '../../unzip';

import { isIdentityTC } from '../identity';
import { Either, Left, Right } from '../either';
import { Option, None, Some } from '../option';

import { Map } from './map';
import { Set } from './set';
import { List } from './list';
import { View } from './view';

/**
 * General purpose, strict, finite sequence of elements `A`.
 */
export type Seq<A> = _Seq<A>;
export const Seq = function <A>(...xs: A[]): Seq<A> {
  return Seq.fromArray(xs);
};
Seq.empty = null as any as Seq<never>;

Seq.cons = <A>(x: A, tl: Seq<A>): Seq<A> => tl.prepend(x);

Seq.snoc = <A>(tl: Seq<A>, x: A): Seq<A> => tl.append(x);

Seq.singleton = <A>(x: A): Seq<A> => new Single(1, x);

Seq.range = (from: number, until: number): Seq<number> =>
  Seq.fromFunction(until - from, idx => from + idx);

Seq.fromArray = <A>(xs: A[]): Seq<A> => Seq.fromFunction(xs.length, i => xs[i]);

Seq.fromList = <A>(xs: List<A>): Seq<A> => Seq.fromArray(xs.toArray);

Seq.fromIterable = <A>(xs: Iterable<A>): Seq<A> =>
  xs instanceof _Seq ? xs : Seq.fromIterator(xs[Symbol.iterator]());

Seq.fromIterator = <A>(it: Iterator<A>): Seq<A> => {
  let xs = Empty as Seq<A>;
  for (let i = it.next(); !i.done; i = it.next()) {
    xs = xs.append(i.value);
  }
  return xs;
};

Seq.fromFunction = <A>(sz: number, f: (idx: number) => A): Seq<A> =>
  sz <= 0 ? Empty : createTree(f, 1, 0, sz);

abstract class _Seq<out A> {
  readonly __void!: A;

  /**
   * _O(1)_ Extracts the first element of the sequence, which must be non-empty.
   *
   * @note This function is partial.
   *
   * @see headOption for a safe variant
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).head
   * // 1
   *
   * > Seq.empty.head
   * // Uncaught Error: Seq.empty: head
   * ```
   */
  public get head(): A {
    const xs = this as any as ViewSeq<A>;
    switch (xs.tag) {
      case 0:
        throw new Error('Seq.empty: head');
      case 1:
        return xs.value;
      case 2:
        return xs.pfx[0];
    }
  }

  /**
   * _O(1)_ Safe version of the `head` which optionally returns the first element
   * of the sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).head
   * // Some(1)
   *
   * > Seq.empty.head
   * // None
   * ```
   */
  public get headOption(): Option<A> {
    return this.isEmpty ? None : Some(this.head);
  }

  /**
   * _O(1)_ Extracts the elements of the sequence which come after the initial
   * head.
   * Equivalent to:
   *
   * `xs.tail` is equivalent to `xs.drop(1)`.
   *
   * As such, it is safe to perform `tail` on empty sequences as well.
   *
   * @examples
   *
   *```typescript
   * > Seq(1, 2, 3).tail
   * // Seq(2, 3)
   *
   * > Seq(1).tail
   * // Seq()
   *
   * > Seq.empty.tail
   * // Seq()
   * ```
   */
  public get tail(): Seq<A> {
    const v = viewLE(this);
    return v == null ? Empty : v[1];
  }

  /**
   * _O(1)_ Optionally decompose the sequence into its head and tail.
   * Returns `None` if empty.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).uncons
   * // Some([1, Seq(2, 3)])
   *
   * > Seq(42).uncons
   * // Some([42, Seq()])
   *
   * > Seq.empty.uncons
   * // None
   * ```
   */
  public get uncons(): Option<[A, Seq<A>]> {
    return Option.fromNullable(viewLE(this));
  }

  /**
   * _O(1)_ Extracts the last element of the sequence, which must be non-empty.
   *
   * @note This is a partial function.
   *
   * @see lastOption for a safe variant
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).last
   * // 3
   *
   * > Seq(1).last
   * // 1
   *
   * > Seq.empty.last
   * // Uncaught Error: Seq.empty: last
   * ```
   */
  public get last(): A {
    const xs = this as any as ViewSeq<A>;
    switch (xs.tag) {
      case 0:
        throw new Error('Seq.empty: last');
      case 1:
        return xs.value;
      case 2:
        return xs.sfx[xs.sfx.length - 1];
    }
  }

  /**
   * _O(1)_ Optionally extracts the last element of the sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).last
   * // Some(3)
   *
   * > Seq(1).last
   * // Some(1)
   *
   * > Seq.empty.last
   * // None
   * ```
   */
  public get lastOption(): Option<A> {
    return this.isEmpty ? None : Some(this.last);
  }

  /**
   * _O(1)_ Extract all elements of the sequence expect from the last one.
   *
   * `xs.init` is equivalent to `xs.dropRight(1)`
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).init
   * // Seq(1, 2)
   *
   * > Seq(1).init
   * // Seq()
   *
   * > Seq.empty.init
   * // Seq()
   * ```
   */
  public get init(): Seq<A> {
    const v = viewRE(this);
    return v == null ? Empty : v[0];
  }

  /**
   * _O(1)_ Optionally extract init and the last element of the sequence.
   */
  public get popLast(): Option<[A, Seq<A>]> {
    const v = viewRE(this);
    return v == null ? None : Some([v[1], v[0]]);
  }

  /**
   * _O(1)_ Returns `true` if the sequence is empty, or `false` otherwise.
   *
   * @examples
   *
   * ```typescript
   * > Seq.empty.isEmpty
   * // true
   *
   * > Seq(42).isEmpty
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
    return !this.isEmpty;
  }

  /**
   * _O(1)_ Returns the size of the sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq.empty.size
   * // 0
   *
   * > Seq(42)
   * // 1
   *
   * > Seq(1, 2, 3)
   * // 3
   * ```
   */
  public abstract readonly size: number;

  /**
   * _O(1)_ Return a view of the sequence's elements. This function is typically
   * used to "fuse" transformations without creating intermediate structures:
   *
   * ```typescript
   * xs.map(f).filter(p) === xs.view.map(f).filter(p).toSeq
   * ```
   */
  public get view(): View<A> {
    return View.build((ez, g) => this.foldRight(ez, g));
  }

  /**
   * _O(1)_ Right-to-left dual to `view`.
   *
   * ```typescript
   * xs.reverse.map(f).filter(p) === xs.viewRight.map(f).filter(p).toSeq
   * ```
   */
  public get viewRight(): View<A> {
    return View.build((ez, g) => this.foldRightReverse(ez, g));
  }

  /**
   * _O(n)_ Converts the sequence into an array.
   */
  public get toArray(): A[] {
    const xs = new Array<A>(this.size);
    let idx = 0;
    this.foldLeft(undefined as void, (_, x) => (xs[idx++] = x));
    return xs;
  }

  /**
   * _O(n)_ Converts the sequence into a list.
   */
  public get toList(): List<A> {
    return this.foldRight_(List.empty as List<A>, List.cons);
  }

  /**
   * _O(1)_ Convert the seq into an `Option`, returning `Some(head)` in case of
   * an non-empty seq, or `None` otherwise.
   *
   * `xs.toOption` is equivalent to `xs.headOption`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).toOption
   * // Some(1)
   *
   * > Seq(42).toOption
   * // Some(42)
   *
   * > Seq.empty.toOption
   * // None
   * ```
   */
  public get toOption(): Option<A> {
    return this.headOption;
  }

  /**
   * _O(1)_ Convert the seq into an `Either`, returning `Right(head)` in case of
   * an non-empty seq, or `Left(left)` otherwise.
   *
   * Equivalent to:
   *
   * `xs.toRight(left)` is equivalent to `xs.toOption.toRight(left)`
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).toRight(() => 42)
   * // Right(1)
   *
   * > Seq(1).toRight(() => 42)
   * // Right(1)
   *
   * > Seq.empty.toRight(() => 42)
   * // Left(42)
   * ```
   */
  public toRight<E>(left: () => E): Either<E, A> {
    return this.isEmpty ? Left(left()) : Right(this.head);
  }

  /**
   * _O(1)_ Convert the seq into an `Either`, returning `Left(head)` in case of
   * an non-empty seq, or `Right(right)` otherwise.
   *
   * Equivalent to:
   *
   * `xs.toLeft(right)` is equivalent to `xs.toOption.toLeft(right)`
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).toLeft(() => 42)
   * // Left(1)
   *
   * > Seq(1).toLeft(() => 42)
   * // Left(1)
   *
   * > Seq.empty.toLeft(() => 42)
   * // Right(42)
   * ```
   */
  public toLeft<B>(right: () => B): Either<A, B> {
    return this.isEmpty ? Right(right()) : Left(this.head);
  }

  /**
   * _O(n)_ Converts the seq into a `Set` using provided `Ord<A>` instance, or
   * `Ord.fromUniversalCompare()` if not provided.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).toSet()
   * // Set(1, 2, 3)
   *
   * > Seq(1, 2, 2, 3, 3).toSet()
   * // Set(1, 2, 3)
   *
   * > Seq.empty.toSet()
   * // Set()
   * ```
   */
  public toSet<A>(
    this: Seq<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Set<A> {
    return this.foldLeft(Set.empty as Set<A>, (s, x) => s.insert(x, O));
  }

  /**
   * _O(n)_ Converts the seq of tuples `[K, V] into a `Map` using provided
   * `Ord<A>` instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * @examples
   *
   * ```typescript
   * > Seq([1, 'a'], [2, 'b'], [3, 'c']).toMap()
   * // Map([1, 'a'], [2, 'b'], [3, 'c'])
   *
   * > Seq([1, 'a'], [2, 'b'], [2, 'c'], [3, 'd'], [3, 'd']).toMap()
   * // Map([1, 'a'], [2, 'c'], [3, 'd'])
   *
   * > Seq.empty.toMap()
   * // Map()
   * ```
   */
  public toMap<K, V>(
    this: Seq<[K, V]>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Map<K, V> {
    return this.foldLeft(Map.empty as Map<K, V>, (s, [k, v]) =>
      s.insert(k, v, O),
    );
  }

  /**
   * _O(1)_ Returns an iterator of the elements of the sequence.
   *
   * @examples
   *
   * ```typescript
   * > const it = Seq.empty.iterator
   * > it.next()
   * // { value: undefined, done: true }
   *
   * > const it = Seq(1, 2).iterator
   * > it.next()
   * // { value: 1, done: false }
   * > it.next()
   * // { value: 2, done: false }
   * > it.next()
   * // { value: undefined, done: true }
   * ```
   */
  public get iterator(): Iterator<A> {
    return iterator(this);
  }

  public [Symbol.iterator](): Iterator<A> {
    return this.iterator;
  }

  /**
   * _O(n)_ Returns a reversed iterator of the elements of the sequence.
   *
   * @examples
   *
   * ```typescript
   * > const it = Seq.empty.iterator
   * > it.next()
   * // { value: undefined, done: true }
   *
   * > const it = Seq(1, 2).iterator
   * > it.next()
   * // { value: 2, done: false }
   * > it.next()
   * // { value: 1, done: false }
   * > it.next()
   * // { value: undefined, done: true }
   * ```
   */
  public get reverseIterator(): Iterator<A> {
    return reverseIterator(this);
  }

  /**
   * _O(1)_ Prepend an element `x` at the beginning of the sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq.empty.prepend(42)
   * // Seq(42)
   *
   * > Seq(1, 2, 3).prepend(42)
   * // Seq(42, 1, 2, 3)
   * ```
   */
  public prepend<A>(this: Seq<A>, x: A): Seq<A> {
    return prependE(x, this);
  }

  /**
   * _O(1)_ Appends an element `x` at the end of the sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq.empty.append(42)
   * // Seq(42)
   *
   * > Seq(1, 2, 3).append(42)
   * // Seq(1, 2, 3, 42)
   * ```
   */
  public append<A>(this: Seq<A>, x: A): Seq<A> {
    return appendE(this, x);
  }

  /**
   * _O(n)_ Returns `true` if for all elements of the sequence satisfy the
   * predicate `p`, or `false` otherwise.
   *
   * ```typescript
   * xs.all(p) === !xs.any(x => !p(x))
   * ```
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).all(() => true)
   * // true
   *
   * > Seq(1, 2, 3).all(x => x < 3)
   * // false
   *
   * > Seq.empty.all(() => false)
   * // true
   * ```
   */
  public all<B extends A>(p: (a: A) => a is B): this is Seq<B>;
  public all(p: (a: A) => boolean): boolean;
  public all(p: (a: A) => boolean): boolean {
    return this.forEachUntil(p);
  }

  /**
   * _O(n)_ Returns `true` if for at least one element of the sequence satisfy
   * the predicate `p`, or `false` otherwise.
   *
   * ```typescript
   * xs.any(p) == !xs.all(x => !p(x))
   * ```
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).any(() => true)
   * // true
   *
   * > Seq(1, 2, 3).any(x => x < 10)
   * // false
   *
   * > Seq.empty.any(() => true)
   * // false
   * ```
   */
  public any(p: (a: A) => boolean): boolean {
    return !this.forEachUntil(x => !p(x));
  }

  /**
   * _O(n)_ Returns number of elements of the sequence for which satisfy the
   * predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).count(x => x >= 2)
   * // 2
   *
   * > Seq.empty.count(x => true)
   * // 0
   * ```
   */
  public count(p: (a: A) => boolean): number {
    return this.foldLeft(0, (x, a) => (p(a) ? x + 1 : x));
  }

  // -- Sub-sequences

  /**
   * _O(log(min(i, n - i)))_ Returns prefix of length `i` of the given seq if the
   * size of the seq is `< i`, otherwise the seq itself.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4).take(3)
   * // Seq(1, 2, 3)
   *
   * > Seq(1, 2).take(3)
   * // Seq(1, 2)
   *
   * > Seq.empty.take(3)
   * // Seq()
   *
   * > Seq(1, 2).take(-1)
   * // Seq()
   * ```
   */
  public take(i: number): Seq<A> {
    if (i <= 0) return Empty;
    if (i >= this.size) return this;
    return takeE(i, this);
  }

  /**
   * _O(log(min(i, n - i)))_ Returns suffix of the given seq after the first `i`
   * elements.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4).drop(3)
   * // Seq(3)
   *
   * > Seq(1, 2).drop(3)
   * // Seq(1, 2)
   *
   * > Seq.empty.drop(3)
   * // Seq()
   *
   * > Seq(1, 2).drop(-1)
   * // Seq(1, 2)
   * ```
   */
  public drop(i: number): Seq<A> {
    return this.takeRight(this.size - i);
  }

  /**
   * Combination of `drop` and `take`, equivalent to:
   *
   * ```typescript
   * xs.slice(form, until) === xs.drop(from).take(until - from);
   * ```
   */
  public slice(from: number, until: number): Seq<A> {
    from = Math.max(from, 0);
    until = Math.max(until, 0);
    return this.drop(from).take(until - from);
  }

  /**
   * _O(log(min(i, n - i)))_ Return a tuple where the first element if the seq's
   * prefix of size `i` and the second element is its remainder.
   *
   * `xs.splitAt(i)` is equivalent to `[xs.take(i), xs.drop(i)]`
   *
   * ```typescript
   * > Seq(1, 2, 3).splitAt(1)
   * // [Seq(1), Seq(2, 3)]
   * ```
   */
  public splitAt(i: number): [Seq<A>, Seq<A>] {
    if (i <= 0) return [Empty, this];
    if (i >= this.size) return [this, Empty];
    return splitE(i, this);
  }

  /**
   * _O(i)_ where `i` is the prefix length. Returns a longest prefix of elements
   * satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4, 1, 2, 3, 4).takeWhile(x => x < 3)
   * // Seq(1, 2)
   *
   * > Seq(1, 2, 3).takeWhile(x => x < 5)
   * // Seq(1, 2, 3)
   *
   * > Seq(1, 2, 3).takeWhile(x => x < 0)
   * // Seq()
   * ```
   */
  public takeWhile<B extends A>(p: (a: A) => a is B): Seq<B>;
  public takeWhile(p: (a: A) => boolean): Seq<A>;
  public takeWhile(p: (a: A) => boolean): Seq<A> {
    const idxOpt = this.findIndex(x => !p(x));
    return idxOpt.nonEmpty ? this.take(idxOpt.get) : this;
  }

  /**
   * _O(i)_ where `i` is the prefix length. Returns a remainder of the seq after
   * removing its longer prefix satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4, 1, 2, 3, 4).dropWhile(x => x < 3)
   * // Seq(3, 4, 1, 2, 3, 4)
   *
   * > Seq(1, 2, 3).dropWhile(x => x < 5)
   * // Seq()
   *
   * > Seq(1, 2, 3).dropWhile(x => x < 0)
   * // Seq(1, 2, 3)
   * ```
   */
  public dropWhile(p: (a: A) => boolean): Seq<A> {
    const idxOpt = this.findIndex(x => !p(x));
    return idxOpt.nonEmpty ? this.drop(idxOpt.get) : Empty;
  }

  /**
   * _O(i)_ where `i` is the prefix length. Returns a tuple where the first
   * element is the longest prefix satisfying the predicate `p` and the second
   * is its remainder.
   *
   * `xs.span(p)` is equivalent to `[xs.takeWhile(p), xs.dropWhile(p)]`
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4, 1, 2, 3, 4).span(x => x < 3)
   * // [Seq(1, 2), Seq(3, 4, 1, 2, 3, 4)]
   *
   * > Seq(1, 2, 3).span(_ => true)
   * // [Seq(1, 2, 3), Seq()]
   *
   * > Seq(1, 2, 3).span(_ => false)
   * // [Seq(), Seq(1, 2, 3)]
   * ```
   */
  public span<B extends A>(p: (a: A) => a is B): [Seq<B>, Seq<A>];
  public span(p: (a: A) => boolean): [Seq<A>, Seq<A>];
  public span(p: (a: A) => boolean): [Seq<A>, Seq<A>] {
    const idxOpt = this.findIndex(x => !p(x));
    return idxOpt.nonEmpty ? this.splitAt(idxOpt.get) : [this, Empty];
  }

  /**
   *  _O(log(min(i, n - i)))_ Returns suffix of length `i` of the given seq if
   * the size of the seq is `< i`, otherwise the seq itself.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4).takeRight(3)
   * // Seq(2, 3, 4)
   *
   * > Seq(1, 2).takeRight(3)
   * // Seq(1, 2)
   *
   * > Seq.empty.takeRight(3)
   * // Seq()
   *
   * > Seq(1, 2).takeRight(-1)
   * // Seq()
   * ```
   */
  public takeRight(i: number): Seq<A> {
    if (i <= 0) return Empty;
    if (i >= this.size) return this;
    return takeER(i, this);
  }

  /**
   *  _O(log(min(i, n - i)))_ Returns prefix of the given seq after the last `i`
   * elements.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4).dropRight(3)
   * // Seq(1)
   *
   * > Seq(1, 2).dropRight(3)
   * // Seq(1, 2)
   *
   * > Seq.empty.dropRight(3)
   * // Seq()
   *
   * > Seq(1, 2).dropRight(-1)
   * // Seq(1, 2)
   * ```
   */
  public dropRight(n: number): Seq<A> {
    return this.take(this.size - n);
  }

  /**
   * _O(i)_ where `i` is the suffix length. Returns a longest suffix of elements
   * satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4, 1, 2, 3, 4).takeWhileRight(x => x > 1)
   * // Seq(2, 3, 4)
   *
   * > Seq(1, 2, 3).takeWhileRight(x => x < 5)
   * // Seq(1, 2, 3)
   *
   * > Seq(1, 2, 3).takeWhileRight(x => x < 0)
   * // Seq()
   * ```
   */
  public takeWhileRight<B extends A>(p: (a: A) => a is B): Seq<B>;
  public takeWhileRight(p: (a: A) => boolean): Seq<A>;
  public takeWhileRight(p: (a: A) => boolean): Seq<A> {
    const idxOpt = this.findIndexRight(x => !p(x));
    return idxOpt.nonEmpty ? this.takeRight(this.size - idxOpt.get - 1) : this;
  }

  /**
   * _O(i)_ where `i` is the suffix length. Returns a remainder of the seq after
   * removing its longer suffix satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4, 1, 2, 3, 4).dropWhile(x => x > 1)
   * // Seq(1, 2, 3, 4, 1)
   *
   * > Seq(1, 2, 3).dropWhile(x => x < 5)
   * // Seq()
   *
   * > Seq(1, 2, 3).dropWhile(x => x < 0)
   * // Seq(1, 2, 3)
   * ```
   */
  public dropWhileRight(p: (a: A) => boolean): Seq<A> {
    const idxOpt = this.findIndexRight(x => !p(x));
    return idxOpt.nonEmpty ? this.dropRight(this.size - idxOpt.get - 1) : Empty;
  }

  /**
   * _O(i)_ where `i` is the prefix length. Returns a tuple where the first
   * element is the longest prefix satisfying the predicate `p` and the second
   * is the remainder of the sequence.
   *
   * `xs.span(p)` is equivalent to `[xs.dropWhileRight(p), xs.takeWhileRight(p)]`
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4, 1, 2, 3, 4).spanRight(x => x > 3)
   * // [Seq(4), Seq(1, 2, 3, 4, 1, 2, 3)]
   *
   * > Seq(1, 2, 3).spanRight(_ => true)
   * // [Seq(), Seq(1, 2, 3)]
   *
   * > Seq(1, 2, 3).spanRight(_ => false)
   * // [Seq(1, 2, 3), Seq()]
   * ```
   */
  public spanRight<B extends A>(p: (a: A) => a is B): [Seq<B>, Seq<A>];
  public spanRight(p: (a: A) => boolean): [Seq<A>, Seq<A>];
  public spanRight(p: (a: A) => boolean): [Seq<A>, Seq<A>] {
    const idxOpt = this.findIndexRight(x => !p(x));
    return idxOpt.nonEmpty ? this.splitAt(idxOpt.get + 1) : [Empty, this];
  }

  /**
   * _O(n)_ Returns a view of of all possible prefixes of the sequence, shortest
   * first.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).inits().toArray
   * // [Seq(), Seq(1), Seq(1, 2), Seq(1, 2, 3)]
   * ```
   */
  public inits(): View<Seq<A>> {
    return View.build((ez, g) => {
      let xs = Empty as Seq<A>;
      return this.foldRight(
        Eval.defer(() => g(xs, ez)),
        (x, r) => {
          const next = g(xs, r);
          xs = xs.append(x);
          return next;
        },
      );
    });
  }

  /**
   * _O(n)_ Returns a view of of all possible suffixes of the sequence, longest
   * first.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).inits().toArray
   * // [Seq(1, 2, 3), Seq(1, 2), Seq(1), Seq()]
   * ```
   */
  public tails(): View<Seq<A>> {
    return View.build((ez, g) => {
      let xs = this as Seq<A>;
      return this.foldRight(
        Eval.defer(() => g(xs, ez)),
        (_x, r) => {
          const next = g(xs, r);
          xs = xs.tail;
          return next;
        },
      );
    });
  }

  // -- Searching

  /**
   * _O(n)_ Returns `true` if the sequence contains the element `a`, or `false`
   * otherwise.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).elem(2)
   * // true
   *
   * > Seq(1, 2, 3).elem(-1)
   * // false
   *
   * > Seq([1, 2], [2, 3]).elem(
   * >   [1, 2],
   * >   Eq.tuple(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
   * > )
   * // true
   * ```
   */
  public elem<A>(
    this: Seq<A>,
    a: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    return !this.forEachUntil(x => E.notEquals(x, a));
  }
  /**
   * Negation of `elem`:
   *
   * ```typescript
   * xs.notElem(x) === !xs.elem(x)
   * ```
   */
  public notElem<A>(
    this: Seq<A>,
    a: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    return !this.elem(a, E);
  }

  /**
   * _O(n)_ Looks up a key in the association sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq([1, 'one'], [2, 'two'], [3, 'three']).lookup(2)
   * // Some('two')
   *
   * > Seq([1, 'one']).lookup(2)
   * // None
   *
   * > Seq.empty.lookup(2)
   * // None
   * ```
   */
  public lookup<K, V>(
    this: Seq<[K, V]>,
    k: K,
    E: Eq<K> = Eq.fromUniversalEquals(),
  ): Option<V> {
    let found = false;
    let result: V | undefined;
    this.forEachUntil(kv => {
      if (E.equals(k, kv[0])) {
        found = true;
        result = kv[1];
      }
      return !found;
    });
    return found ? Some(result!) : None;
  }

  /**
   * _O(n)_ Optionally returns the first element of the structure matching the
   * predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(0, 10, 20, 30, 40, 50).find(x => x > 42)
   * // Some(50)
   *
   * > Seq(1, 2, 3).find(x => x < 0)
   * // None
   * ```
   */
  public find<B extends A>(p: (a: A) => a is B): Option<B>;
  public find(p: (a: A) => boolean): Option<A>;
  public find(p: (a: A) => boolean): Option<A> {
    let found = false;
    let result: A | undefined;
    this.forEachUntil(x => {
      if (p(x)) {
        found = true;
        result = x;
      }
      return !found;
    });
    return found ? Some(result!) : None;
  }

  /**
   * _O(n)_ Returns a sequence where all elements of the original sequence satisfy
   * the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4).filter(x => x % 2 === 0)
   * // Seq(2, 4)
   *
   * > Seq.range(1).filter(x => x % 2 === 0).take(3)
   * // Seq(2, 4, 6)
   * ```
   */
  public filter<B extends A>(p: (a: A) => a is B): Seq<B>;
  public filter(p: (a: A) => boolean): Seq<A>;
  public filter(p: (a: A) => boolean): Seq<A> {
    return this.foldLeft(Empty as Seq<A>, (xs, x) =>
      p(x) ? xs.append(x) : xs,
    );
  }

  /**
   * _O(n)_ Returns a sequence where all elements of the original sequence do
   * not satisfy the predicate `p`.
   *
   * `xs.filterNot(p)` is equivalent to `xs.filter(x => !p(x))`
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4).filterNot(x => x % 2 === 0)
   * // Seq(1, 3)
   *
   * > Seq.range(1).filterNot(x => x % 2 === 0).take(3)
   * // Seq(1, 3, 5)
   * ```
   */
  public filterNot(p: (a: A) => boolean): Seq<A> {
    return this.filter(x => !p(x));
  }

  /**
   * _O(n)_ A version of `map` which can also remove elements of the original
   * sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq('1', 'Foo', '3')
   * >   .collect(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * // Seq(1, 3)
   * ```
   */
  public collect<B>(f: (a: A) => Option<B>): Seq<B> {
    return this.foldLeft(Empty as Seq<B>, (xs, x) => {
      const opt = f(x);
      return opt.nonEmpty ? xs.append(opt.get) : xs;
    });
  }

  /**
   * _O(n)_ A version of `collect` which drops the remainder of the sequence
   * starting with the first element for which the function `f` returns `None`.
   *
   * @examples
   *
   * ```typescript
   * > Seq('1', 'Foo', '3')
   * >   .collectWhile(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * // Seq(1)
   * ```
   */
  public collectWhile<B>(f: (a: A) => Option<B>): Seq<B> {
    let zs: Seq<B> = Empty;
    this.forEachUntil(x => {
      const opt = f(x);
      return opt.nonEmpty ? ((zs = zs.append(opt.get)), true) : false;
    });
    return zs;
  }

  /**
   * _O(n)_ A version of `collect` which drops the prefix of the sequence
   * starting with the last element for which the function `f` returns `None`.
   *
   * @examples
   *
   * ```typescript
   * > Seq('1', 'Foo', '3')
   * >   .collectWhileRight(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * // Seq(3)
   * ```
   */
  public collectWhileRight<B>(f: (a: A) => Option<B>): Seq<B> {
    let zs: Seq<B> = Empty;
    this.forEachUntilRight(x => {
      const opt = f(x);
      return opt.nonEmpty ? ((zs = zs.prepend(opt.get)), true) : false;
    });
    return zs;
  }

  /**
   * _O(n)_ Returns a tuple where the first element is a sequence containing the
   * elements which satisfy the predicate `p` and the second one which contains
   * the rest of them.
   *
   * `xs.partition(p)` is equivalent to `[xs.filter(p), xs.filterNot(p)]`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4, 5, 6).partition(x => x % 2 === 0)
   * // [Seq(2, 4, 6), Seq(1, 3, 5)]
   * ```
   */
  public partition<B extends A>(p: (a: A) => a is B): [Seq<B>, Seq<A>];
  public partition(p: (a: A) => boolean): [Seq<A>, Seq<A>];
  public partition(p: (a: A) => boolean): [Seq<A>, Seq<A>] {
    let l = Empty as Seq<A>;
    let r = Empty as Seq<A>;

    this.forEach(x => {
      if (p(x)) {
        l = l.append(x);
      } else {
        r = r.append(x);
      }
    });

    return [l, r];
  }

  /**
   * _O(n)_ Returns a tuple where the first element corresponds to the elements
   * of the sequence returning `Left<L>` by applying the function `f`, and the
   * second one those that return `Right<R>`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4, 5, 6).partitionWith(x =>
   * >   x % 2 === 0 ? Left(x % 2) : Right(String(x))
   * > )
   * // [Seq(1, 2, 3), Seq('1', '3', '5')]
   * ```
   */
  public partitionWith<L, R>(f: (a: A) => Either<L, R>): [Seq<L>, Seq<R>] {
    let l = Empty as Seq<L>;
    let r = Empty as Seq<R>;

    this.forEach(x => {
      const lr = f(x);
      if (lr.isEmpty) {
        l = l.append(lr.getLeft);
      } else {
        r = r.append(lr.get);
      }
    });

    return [l, r];
  }

  // -- Indexing

  /**
   * _O(log(min(i,n - i)))_ Returns an element at the index `idx`.
   *
   * @note This function is partial.
   *
   * @see getOption for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).get(0)
   * // 1
   *
   * > Seq(1, 2, 3).get(2)
   * // 3
   *
   * > Seq(1, 2, 3).get(3)
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Seq(1, 2, 3).get(-1)
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public get(i: number): A {
    if (i < 0 || i >= this.size) throw new Error('IndexOutOfBounds');
    return getE(this, i).value;
  }
  /**
   * Alias for `get`.
   */
  public '!!'(i: number): A {
    return this.get(i);
  }

  /**
   * _O(log(min(i,n - i)))_ Optionally returns an element at the index `idx`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).getOption(0)
   * // Some(1)
   *
   * > Seq(1, 2, 3).getOption(2)
   * // Some(3)
   *
   * > Seq(1, 2, 3).getOption(3)
   * // None
   *
   * > Seq(1, 2, 3).getOption(-1)
   * // None
   * ```
   */
  public getOption(i: number): Option<A> {
    if (i < 0 || i >= this.size) return None;
    return Some(getE(this, i).value);
  }
  /**
   * Alias for `getOption`.
   */
  public '!?'(i: number): Option<A> {
    return this.getOption(i);
  }

  /**
   * _O(log(min(i,n - i)))_ Replace an element at the index `i` with the new
   * value `x`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > Seq('a', 'b', 'c').replaceAt(0, 'x')
   * // Seq('x', 'b', 'c')
   *
   * > Seq('a', 'b', 'c').replaceAt(2, 'x')
   * // Seq('a', 'b', 'x')
   *
   * > Seq('a', 'b', 'c').replaceAt(3, 'x')
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Seq('a', 'b', 'c').replaceAt(-1, 'x')
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public replaceAt<A>(this: Seq<A>, i: number, x: A): Seq<A> {
    if (i < 0 || i >= this.size) throw new Error('IndexOutOfBounds');
    return modifyE(this, i, _ => x);
  }

  /**
   * _O(log(min(i,n - i)))_ Transforms an element at the index `i` using the
   * function `f`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > Seq('a', 'b', 'c').modifyAt(0, c => c.toUpperCase())
   * // Seq('A', 'b', 'c')
   *
   * > Seq('a', 'b', 'c').modifyAt(2, c => c.toUpperCase())
   * // Seq('a', 'b', 'C')
   *
   * > Seq('a', 'b', 'c').modifyAt(3, c => c.toUpperCase())
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Seq('a', 'b', 'c').modifyAt(-1, c => c.toUpperCase())
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public modifyAt<A>(this: Seq<A>, i: number, f: (x: A) => A): Seq<A> {
    if (i < 0 || i >= this.size) throw new Error('IndexOutOfBounds');
    return modifyE(this, i, f);
  }

  /**
   * _O(log(min(i,n - i)))_ Inserts an element `x` at the index `i` shifting
   * the remainder of the sequence.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > Seq('a', 'b', 'c').insertAt(0, 'x')
   * // Seq('x', 'a', 'b', 'c')
   *
   * > Seq('a', 'b', 'c').insertAt(2, 'x')
   * // Seq('a', 'b', 'x', 'c')
   *
   * > Seq('a', 'b', 'c').insertAt(3, 'x')
   * // Seq('a', 'b', 'c', 'x')
   *
   * > Seq('a', 'b', 'c').insertAt(4, 'x')
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Seq('a', 'b', 'c').insertAt(-1, 'x')
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public insertAt<A>(this: Seq<A>, i: number, x: A): Seq<A> {
    if (i < 0 || i > this.size) throw new Error('IndexOutOfBounds');
    if (i === 0) return this.prepend(x);
    if (i === this.size) return this.append(x);
    return insertAtE(this, i, x);
  }

  /**
   * _O(log(min(i,n - i)))_ Removes an element `x` at the index `i`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > Seq('a', 'b', 'c').removeAt(0).toArray
   * // ['b', 'c']
   *
   * > Seq('a', 'b', 'c').removeAt(2).toArray
   * // ['a', 'b']
   *
   * > Seq('a', 'b', 'c').removeAt(3).toArray
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Seq('a', 'b', 'c').removeAt(-1).toArray
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public removeAt(i: number): Seq<A> {
    if (i < 0 || i >= this.size) throw new Error('IndexOutOfBounds');
    // TODO
    const split = this.splitAt(i);
    return split[0].concat(split[1].tail);
  }

  /**
   * _O(n)_ Returns the first index of on occurrence of the element `x` in the
   * sequence, or `None` when it does not exist.
   *
   * @see elemIndices to get indices of _all_ occurrences of the element `x`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 1, 2, 3).elemIndex(1)
   * // Some(0)
   *
   * > Seq(1, 2, 3).elemIndex(3)
   * // Some(2)
   *
   * > Seq(1, 2, 3).elemIndex(0)
   * // None
   * ```
   */
  public elemIndex<A>(
    this: Seq<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Option<number> {
    return this.findIndex(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns the indices of all occurrence of the element `x` in the
   * sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 1, 2, 3).elemIndices(1)
   * // Seq(0, 3)
   *
   * > Seq(1, 2, 3).elemIndices(3)
   * // Seq(2)
   *
   * > Seq(1, 2, 3).elemIndices(0)
   * // Seq()
   * ```
   */
  public elemIndices<A>(
    this: Seq<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Seq<number> {
    return this.findIndices(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns the last index of on occurrence of the element `x` in the
   * sequence, or `None` when it does not exist.
   *
   * @see elemIndices to get indices of _all_ occurrences of the element `x`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 1, 2, 3).elemIndexRight(1)
   * // Some(3)
   *
   * > Seq(1, 2, 3).elemIndexRight(3)
   * // Some(2)
   *
   * > Seq(1, 2, 3).elemIndexRight(0)
   * // None
   * ```
   */
  public elemIndexRight<A>(
    this: Seq<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Option<number> {
    return this.findIndexRight(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns the indices, from right-to-left of all occurrence of the
   * element `x` in the sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 1, 2, 3).elemIndicesRight(1)
   * // Seq(3, 0)
   *
   * > Seq(1, 2, 3).elemIndicesRight(3)
   * // Seq(2)
   *
   * > Seq(1, 2, 3).elemIndicesRight(0)
   * // Seq()
   * ```
   */
  public elemIndicesRight<A>(
    this: Seq<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Seq<number> {
    return this.findIndicesRight(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns index of the first element satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 1, 2, 3).findIndex(x => x > 1)
   * // Some(1)
   *
   * > Seq(1, 2, 3).findIndex(x => x === 3)
   * // Some(2)
   *
   * > Seq(1, 2, 3).findIndex(x => x > 20)
   * // None
   * ```
   */
  public findIndex(p: (a: A) => boolean): Option<number> {
    let idx = -1;
    let found = false;
    this.forEachUntil(x => {
      idx++;
      found = p(x);
      return !found;
    });
    return found ? Some(idx) : None;
  }

  /**
   * _O(n)_ Returns indices of all elements satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 1, 2, 3).findIndices(x => x > 1)
   * // Seq(1, 2, 4, 5)
   *
   * > Seq(1, 2, 3).findIndices(x => x === 3)
   * // Seq(2)
   *
   * > Seq(1, 2, 3).findIndices(x => x > 20)
   * // Seq()
   * ```
   */
  public findIndices(p: (a: A) => boolean): Seq<number> {
    let idx = 0;
    return this.foldLeft(Empty as Seq<number>, (xs, x) =>
      p(x) ? xs.append(idx++) : (idx++, xs),
    );
  }

  /**
   * _O(n)_ Returns index of the last element satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 1, 2, 3).findIndex(x => x > 1)
   * // Some(5)
   *
   * > Seq(1, 2, 3).findIndex(x => x === 3)
   * // Some(2)
   *
   * > Seq(1, 2, 3).findIndex(x => x > 20)
   * // None
   * ```
   */
  public findIndexRight(p: (a: A) => boolean): Option<number> {
    let idx = 0;
    let found = false;
    this.forEachUntilRight(x => {
      idx++;
      found = p(x);
      return !found;
    });
    return found ? Some(this.size - idx) : None;
  }

  /**
   * _O(n)_ Returns indices, right-to-left, of all elements satisfying
   * the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 1, 2, 3).findIndices(x => x > 1)
   * // Seq(5, 4, 3, 2, 1)
   *
   * > Seq(1, 2, 3).findIndices(x => x === 3)
   * // Seq(2)
   *
   * > Seq(1, 2, 3).findIndices(x => x > 20)
   * // Seq()
   * ```
   */
  public findIndicesRight(p: (a: A) => boolean): Seq<number> {
    let idx = 0;
    return this.foldLeft(Empty as Seq<number>, (xs, x) =>
      p(x) ? xs.prepend(idx++) : (idx++, xs),
    );
  }

  // -- Combining and transforming

  /**
   * _O(n)_ Returns sequence with elements in reversed order.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).reverse
   * // Seq(3, 2, 1)
   *
   * > Seq(42).reverse
   * // Seq(42)
   *
   * > Seq.empty.reverse
   * // Seq()
   * ```
   */
  public get reverse(): Seq<A> {
    return reverseMap(this, id);
  }

  /**
   * _O(log(min(n1, n2)))_ Appends all elements of the second sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).concat(Seq(4, 5, 6))
   * // Seq(1, 2, 3, 4, 5, 6)
   * ```
   */
  public concat<A>(this: Seq<A>, that: Seq<A>): Seq<A> {
    return concatE(this, that);
  }
  /**
   * Alias for `concat`.
   */
  public '++'<A>(this: Seq<A>, that: Seq<A>): Seq<A> {
    return this.concat(that);
  }

  /**
   * _O(n)_ Returns a new sequence by transforming each element using the
   * function `f`.
   *
   * @examples
   *
   * ```typescript
   * > Seq('a', 'b', 'c').map(x => x.toUpperCase())
   * // Seq('A', 'B', 'C')
   *
   * > Seq.empty.map(() => { throw new Error(); })
   * // Seq()
   *
   * > Seq.range(1, 3).map(x => x + 1)
   * // Seq(2, 3, 4)
   * ```
   */
  public map<B>(f: (a: A) => B): Seq<B> {
    const xs = this as any as ViewSeq<A>;
    switch (xs.tag) {
      case 0:
        return xs;
      case 1:
        return new Single(xs.size, f(xs.value));
      case 2:
        return new Deep(
          xs.size,
          mapDigit(xs.pfx, f),
          xs.deeper.map(n => mapNode(n, f)),
          mapDigit(xs.sfx, f),
        );
    }
  }

  /**
   * _O(m + n)_ Returns a sequence by transforming combination of elements from
   * both sequences using the function `f`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2).map2(Seq('a', 'b'), tupled)
   * // Seq([1, 'a'], [1, 'b'], [2, 'a'], [2, 'b'])
   * ```
   */
  public map2<B, C>(that: Seq<B>, f: (a: A, b: B) => C): Seq<C> {
    if (this.isEmpty) return Empty;
    return this.flatMap(a => that.map(b => f(a, b)));
  }

  /**
   * Lazy version of `map2`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2).map2Eval(Eval.now(Seq('a', 'b')), tupled).value
   * // Seq([1, 'a'], [1, 'b'], [2, 'a'], [2, 'b'])
   *
   * > Seq.empty.map2Eval(Eval.bottom(), tupled).value
   * // Seq()
   * ```
   */
  public map2Eval<B, C>(
    that: Eval<Seq<B>>,
    f: (a: A, b: B) => C,
  ): Eval<Seq<C>> {
    if (this.isEmpty) return Eval.now(Empty);
    return that.map(that => this.map2(that, f));
  }

  /**
   * Returns a new sequence by transforming each element using the function `f`
   * and concatenating their results.
   *
   * @examples
   *
   * ```typescript
   * > Seq(View.range(1), View.range(10), View.range(100))
   * >   .flatMap(xs => xs.take(3).toSeq)
   * // Seq(1, 2, 3, 10, 11, 12, 100, 101, 102)
   * ```
   */
  public flatMap<B>(f: (a: A) => Seq<B>): Seq<B> {
    return this.foldLeft(Empty as Seq<B>, (ys, x) => ys.concat(f(x)));
  }

  /**
   * _O(n)_ Create a new sequence by transforming each of its
   * non-empty tails using a function `f`.
   *
   * @examples
   *
   * ```typescript
   * > Seq('a', 'b', 'c').coflatMap(xs => xs.size)
   * // Seq(3, 2, 1)
   * ```
   */
  public coflatMap<B>(f: (xs: Seq<A>) => B): Seq<B> {
    return this.tails()
      .filter(xs => xs.nonEmpty)
      .map(f).toSeq;
  }

  /**
   * Returns a new sequence concatenating its nested sequences.
   *
   * `xss.flatten()` is equivalent to `xss.flatMap(id)`.
   */
  public flatten<A>(this: Seq<Seq<A>>): Seq<A> {
    return this.flatMap(id);
  }

  /**
   * _O(n)_ Inserts the given separator `sep` in between each of the elements of
   * the sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq('a', 'b', 'c').intersperse(',')
   * // Seq('a', ',', 'b', ',', 'c')
   * ```
   */
  public intersperse<A>(this: Seq<A>, sep: A): Seq<A> {
    const v = viewLE(this);
    return v == null
      ? Empty
      : v[1].flatMap(x => Seq.fromArray([sep, x])).prepend(v[0]);
  }

  /**
   * _O(n * m)_ Transposes rows and columns of the sequence.
   *
   * @note This function is total, which means that in case some rows are shorter
   * than others, their elements are skipped in the result.
   *
   * @examples
   *
   * ```typescript
   * > Seq(Seq(1, 2, 3), Seq(4, 5, 6)).transpose()
   * // Seq(Seq(1, 4), Seq(2, 5), Seq(3, 6))
   *
   * > Seq(Seq(10, 11), Seq(20), Seq(), Seq(30, 31, 32)).transpose()
   * // Seq(Seq(10, 20, 30), Seq(11, 31), Seq(32))
   * ```
   */
  public transpose<A>(this: Seq<Seq<A>>): Seq<Seq<A>> {
    if (this.isEmpty) return Empty;

    const rs: Seq<A>[] = [];
    let rsSz = 0;

    this.forEach(xs => {
      let i = 0;
      xs.forEach(x => {
        if (i >= rsSz) {
          rs.push(Empty);
          rsSz++;
        }
        rs[i] = rs[i].append(x);
        i++;
      });
    });

    return Seq.fromArray(rs);
  }

  /**
   * Returns a view of all subsequences.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).subsequences().toArray
   * // [Seq(), Seq(1), Seq(2), Seq(1, 2), Seq(3), Seq(1, 3), Seq(2, 3), Seq(1, 2, 3)]
   * ```
   */
  public subsequences(): View<Seq<A>> {
    return this.nonEmptySubsequences().prepend(Empty);
  }

  private nonEmptySubsequences(): View<Seq<A>> {
    if (this.isEmpty) return View.empty;
    return View.build((ez, g) =>
      g(
        new Single(1, this.head),
        Eval.defer(() =>
          this.tail.nonEmptySubsequences().foldRight(ez, (ys, r) =>
            g(
              ys,
              Eval.defer(() => g(ys.prepend(this.head), r)),
            ),
          ),
        ),
      ),
    );
  }

  // -- Zips

  /**
   * _O(min(n, m))_ Returns a sequence of pairs of corresponding elements of each
   * sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).zip(Seq('a', 'b', 'c'))
   * // Seq([1, 'a'], [2, 'b'], [3, 'c'])
   *
   * > Seq(1, 2, 3).zip(Seq('a', 'b'))
   * // Seq([1, 'a'], [2, 'b'])
   *
   * > Seq('a', 'b').zip(Seq(1, 2, 3))
   * // Seq(['a', 1], ['b', 2])
   *
   * > Seq.empty.zip(Seq(1, 2, 3))
   * // Seq()
   *
   * > Seq(1, 2, 3).zip(Seq.empty)
   * // Seq()
   * ```
   */
  public zip<B>(that: Seq<B>): Seq<[A, B]> {
    return this.zipWith(that, (x, y) => [x, y]);
  }

  /**
   * Lazy version of `zip` that returns a `View`.
   */
  public zipView<B>(that: Seq<B>): View<[A, B]> {
    return this.zipWithView(that, (a, b) => [a, b]);
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
   * > Seq(1, 2, 3).zipWith(Seq(4, 5, 6), (x, y) => x + y)
   * // Seq(5, 7, 9)
   * ```
   */
  public zipWith<B, C>(that: Seq<B>, f: (a: A, b: B) => C): Seq<C> {
    const sz = Math.min(this.size, that.size);
    const xs = this.take(sz);
    const ys = that.take(sz);
    return xs.zipWithImpl(ys, f);
  }

  private zipWithImpl<B, C>(that: Seq<B>, f: (a: A, b: B) => C): Seq<C> {
    return this.map(x => {
      const v = viewLE(that)!;
      that = v[1];
      return f(x, v[0]);
    });
  }

  /**
   * Lazy version of `zipWith` that returns a `View`.
   */
  public zipWithView<B, C>(that: Seq<B>, f: (a: A, b: B) => C): View<C> {
    return View.build((ez, g) =>
      this.foldRight2(that, ez, (a, b, ec) => g(f(a, b), ec)),
    );
  }

  /**
   * _O(n)_ Returns a sequence where each element is zipped with its index in
   * the resulting sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq('a', 'b', 'c').zipWithIndex
   * // Seq(['a', 0], ['a', 1], ['a', 2])
   *
   * > Seq(1, 2, 3, 4, 5, 6).filter(x => x % 2 === 0).zipWithIndex.take(3)
   * // Seq([2, 0], [4, 1], [6, 2])
   *
   * > Seq(1, 2, 3, 4, 5, 6).zipWithIndex.filter(([x]) => x % 2 === 0).take(3)
   * // Seq([2, 1], [4, 3], [6, 5])
   * ```
   */
  public get zipWithIndex(): Seq<[A, number]> {
    let idx = 0;
    return this.map(x => [x, idx++]);
  }

  /**
   * Version of `zip` working on three sequences.
   */
  public zip3<B, C>(that: Seq<B>, those: Seq<C>): Seq<[A, B, C]> {
    return this.zipWith3(that, those, (x, y, z) => [x, y, z]);
  }

  /**
   * Version of `zipView` working on three lists.
   */
  public zipView3<B, C>(that: Seq<B>, those: Seq<C>): View<[A, B, C]> {
    return this.zipWithView3(that, those, (a, b, c) => [a, b, c]);
  }

  /**
   * Version of `zipWith` working on three lists.
   */
  public zipWith3<B, C, D>(
    that: Seq<B>,
    those: Seq<C>,
    f: (a: A, b: B, c: C) => D,
  ): Seq<D> {
    const sz = Math.min(this.size, that.size, those.size);
    const xs = this.take(sz);
    const ys = that.take(sz);
    const zs = those.take(sz);
    return xs.zipWith3Impl(ys, zs, f);
  }
  private zipWith3Impl<B, C, D>(
    that: Seq<B>,
    those: Seq<C>,
    f: (a: A, b: B, c: C) => D,
  ): Seq<D> {
    return this.map(x => {
      const v1 = viewLE(that)!;
      that = v1[1];
      const v2 = viewLE(those)!;
      those = v2[1];
      return f(x, v1[0], v2[0]);
    });
  }

  /**
   * Version of `zipWithView` working on three lists.
   */
  public zipWithView3<B, C, D>(
    ys: Seq<B>,
    zs: Seq<C>,
    f: (a: A, b: B, c: C) => D,
  ): View<D> {
    return View.build((ez, g) =>
      this.foldRight3(ys, zs, ez, (a, b, c, ed) => g(f(a, b, c), ed)),
    );
  }

  /**
   * _O(n)_ Transform a list of pairs into a list with its first components and
   * a list with its second components.
   *
   * @examples
   *
   * ```typescript
   * > Seq(['a', 1], ['b', 2], ['c', 3]).unzip()
   * // [Seq('a', 'b', 'c'), Seq(1, 2, 3)]
   * ```
   */
  public unzip<A, B>(this: Seq<readonly [A, B]>): [Seq<A>, Seq<B>] {
    return this.unzipWith(id);
  }

  public unzipWith<B, C>(f: (a: A) => readonly [B, C]): [Seq<B>, Seq<C>] {
    return unzipWithE(this, f);
  }

  public unzip3<A, B, C>(
    this: Seq<readonly [A, B, C]>,
  ): [Seq<A>, Seq<B>, Seq<C>] {
    return this.unzipWith3(id);
  }

  public unzipWith3<B, C, D>(
    f: (a: A) => readonly [B, C, D],
  ): [Seq<B>, Seq<C>, Seq<D>] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const xs = this as Seq<A>;
    if (xs === Empty) return [Empty, Empty, Empty];

    let ls = Seq.empty as Seq<B>;
    let ms = Seq.empty as Seq<C>;
    let rs = Seq.empty as Seq<D>;
    this.forEach(x => {
      const lmr = f(x);
      ls = ls.append(lmr[0]);
      ms = ms.append(lmr[1]);
      rs = rs.append(lmr[2]);
    });

    return [ls, ms, rs];
  }

  private foldRight2<B, C>(
    ys: Seq<B>,
    ez: Eval<C>,
    f: (a: A, b: B, ec: Eval<C>) => Eval<C>,
  ): Eval<C> {
    return this.foldRight(ez, (a, ec) => {
      const v = viewLE(ys);
      if (v == null) return ez;
      ys = v[1];
      return f(a, v[0], ec);
    });
  }

  private foldRight3<B, C, D>(
    ys: Seq<B>,
    zs: Seq<C>,
    ez: Eval<D>,
    f: (a: A, b: B, c: C, ed: Eval<D>) => Eval<D>,
  ): Eval<D> {
    return this.foldRight(ez, (a, ed) => {
      const vy = viewLE(ys);
      if (vy == null) return ez;
      ys = vy[1];
      const vz = viewLE(zs);
      if (vz == null) return ez;
      zs = vz[1];
      return f(a, vy[0], vz[0], ed);
    });
  }

  // -- Scans

  /**
   * _O(n)_ Returns a sequence of cumulative results reduced from left:
   *
   * `Seq(x1, x2, ...).scanLeft(z, f)` is equivalent to `Seq(z, f(z, x1), f(f(z, x1), x2), ...)`
   *
   *
   * Relationship with `foldLeft`:
   *
   * `xs.scanLeft(z, f).last == xs.foldLeft(z, f)`
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).scanLeft(0, (z, x) => z + x)
   * // Seq(0, 1, 3, 6)
   *
   * > Seq.empty.scanLeft(42, (z, x) => z + x)
   * // Seq(42)
   *
   * > Seq.range(1, 5).scanLeft(100, (x, y) => x - y)
   * // Seq(100, 99, 97, 94, 90)
   * ```
   */
  public scanLeft<B>(z: B, f: (b: B, a: A) => B): Seq<B> {
    const initial = z;
    return this.map(x => (z = f(z, x))).prepend(initial);
  }

  /**
   * Variant of `scanLeft` with no initial value.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).scanLeft1((z, x) => z + x)
   * // Seq(1, 3, 6)
   *
   * > Seq.empty.scanLeft1((z, x) => z + x)
   * // Seq()
   *
   * > Seq.range(1, 5).scanLeft1((x, y) => x - y)
   * // Seq(1, -1, -4, -8)
   */
  public scanLeft1<A>(this: Seq<A>, f: (acc: A, x: A) => A): Seq<A> {
    const v = viewLE(this);
    return v ? v[1].scanLeft(v[0], f) : Empty;
  }

  /**
   * _O(n)_ Right-to-left dual of `scanLeft`.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).scanRight_(0, (x, z) => x + z)
   * // Seq(6, 5, 3, 0)
   *
   * > Seq.empty.scanRight_(42, (x, z) => x + z)
   * // Seq(42)
   *
   * > Seq.range(1, 5).scanRight_(100, (x, z) => x - z)
   * // Seq(98, -97, 99, -96, 100)
   * ```
   */
  public scanRight_<B>(z: B, f: (a: A, b: B) => B): Seq<B> {
    const initial = z;
    return mapRightE(this, x => (z = f(x, z))).append(initial);
  }

  /**
   * Version of `scanRight_` with no initial value.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).scanRight1_((x, z) => x + z)
   * // Seq(6, 5, 3)
   *
   * > Seq.empty.scanRight1_((x, z) => x + z)
   * // Seq()
   *
   * > Seq.range(1, 5).scanRight1_((x, z) => x - z)
   * // Seq(-2, 3, -1, 4)
   * ```
   */
  public scanRight1_<A>(this: Seq<A>, f: (x: A, acc: A) => A): Seq<A> {
    const v = viewRE(this);
    return v ? v[0].scanRight_(v[1], f) : Empty;
  }

  // -- Folds

  /**
   * _O(n)_ Apply `f` to each element of the sequence for its side-effect.
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
    this.foldLeft(undefined as void, (_, x) => f(x));
  }

  /**
   * Right-to-left dual of `forEach`.
   */
  public forEachRight(f: (a: A) => void): void {
    this.foldRight_(undefined as void, (x, _) => f(x));
  }

  /**
   * _O(n)_ Apply a left-associative operator `f` to each element of the sequence
   * reducing it from left to right:
   *
   * ```typescript
   * Seq(x1, x2, ..., xn) === f( ... f(f(z, x1), x2), ... xn)
   * ```
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3, 4, 5).foldLeft(0, (x, y) => x + y)
   * // 15
   *
   * > Seq.empty.foldLeft(42, (x, y) => x + y)
   * // 42
   * ```
   */
  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    const xs = this as any as ViewSeq<A>;
    switch (xs.tag) {
      case 0:
        return z;
      case 1:
        return f(z, xs.value);
      case 2: {
        const p = foldLeftDigit(xs.pfx, z, f);
        const m = xs.deeper.foldLeft(p, (b, n) => foldLeftNode(n, b, f));
        return foldLeftDigit(xs.sfx, m, f);
      }
    }
  }

  /**
   * _O(n)_ Version of `foldLeft` without initial value and therefore it can be
   * applied only to non-empty structures.
   *
   * @note This function is partial.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).foldLeft1((x, y) => x + y)
   * // 6
   *
   * > Seq.empty.foldLeft1((x, y) => x + y)
   * // Uncaught Error: Seq.empty: foldLeft1
   * ```
   */
  public foldLeft1<A>(this: Seq<A>, f: (acc: A, x: A) => A): A {
    const v = viewLE(this);
    return !v
      ? throwError(new Error('Seq.empty: foldLeft1'))
      : v[1].foldLeft(v[0], f);
  }

  /**
   * _O(n)_ Apply a right-associative operator `f` to each element of the sequence,
   * reducing it from right to left lazily:
   *
   * ```typescript
   * Seq(x1, x2, ..., xn).foldRight(z, f) === f(x1, Eval.defer(() => f(x2, ... Eval.defer(() => f(xn, z), ... ))))
   * ```
   *
   * @see foldRight_ for the strict, non-short-circuiting version.
   *
   * @examples
   *
   * ```typescript
   * > Seq(false, true, false).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
   * // true
   *
   * > Seq(false).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
   * // false
   *
   * > Seq(true).foldRight(Eval.bottom(), (x, r) => x ? Eval.true : r).value
   * // true
   * ```
   */
  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    const xs = this as any as ViewSeq<A>;
    switch (xs.tag) {
      case 0:
        return ez;
      case 1:
        return Eval.defer(() => f(xs.value, ez));
      case 2: {
        return Eval.defer(() =>
          foldRightDigit(
            xs.pfx,
            Eval.defer(() =>
              xs.deeper.foldRight(
                Eval.defer(() => foldRightDigit(xs.sfx, ez, f)),
                (n, eb) => foldRightNode(n, eb, f),
              ),
            ),
            f,
          ),
        );
      }
    }
  }

  /**
   * _O(n)_ Version of `foldRight` without initial value and therefore it can be
   * applied only to non-empty structures.
   *
   * @note This function is partial.
   *
   * @see foldRight1_ for the strict, non-short-circuiting version.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 2, 3).foldRight1((x, ey) => ey.map(y => x + y)).value
   * // 6
   *
   * > Seq.empty.foldRight1((x, ey) => ey.map(y => x + y)).value
   * // Uncaught Error: Seq.empty: foldRight1
   * ```
   */
  public foldRight1<A>(
    this: Seq<A>,
    f: (a: A, eac: Eval<A>) => Eval<A>,
  ): Eval<A> {
    const v = viewRE(this);
    return !v
      ? Eval.always(() => throwError(new Error('Seq.empty: foldRight1')))
      : v[0].foldRight(Eval.now(v[1]), f);
  }

  /**
   * `xs.foldRightReverse(ez, f)` is equivalent to `xs.reverse.foldRight(ez, f)`
   */
  public foldRightReverse<B>(
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): Eval<B> {
    const xs = this as any as ViewSeq<A>;
    switch (xs.tag) {
      case 0:
        return ez;
      case 1:
        return Eval.defer(() => f(xs.value, ez));
      case 2: {
        return Eval.defer(() =>
          foldRightRevDigit(
            xs.sfx,
            Eval.defer(() =>
              xs.deeper.foldRightReverse(
                Eval.defer(() => foldRightRevDigit(xs.pfx, ez, f)),
                (n, eb) => foldRightRevNode(n, eb, f),
              ),
            ),
            f,
          ),
        );
      }
    }
  }

  /**
   * Strict, non-short-circuiting version of the `foldRight`.
   */
  public foldRight_<B>(z: B, f: (a: A, b: B) => B): B {
    const xs = this as any as ViewSeq<A>;
    switch (xs.tag) {
      case 0:
        return z;
      case 1:
        return f(xs.value, z);
      case 2: {
        const s = foldRightDigit_(xs.sfx, z, f);
        const m = xs.deeper.foldRight_(s, (n, b) => foldRightNode_(n, b, f));
        return foldRightDigit_(xs.pfx, m, f);
      }
    }
  }

  /**
   * Strict, non-short-circuiting version of the `foldRight1`.
   */
  public foldRight1_<A>(this: Seq<A>, f: (a: A, acc: A) => A): A {
    const v = viewRE(this);
    return !v
      ? throwError(new Error('Seq.empty: foldRight1_'))
      : v[0].foldRight_(v[1], f);
  }

  /**
   * _O(n)_ Right associative, lazy fold mapping each element of the structure
   * into a monoid `M` and combining their results using `combineEval`.
   *
   * `xs.folMap(M, f)` is equivalent to `xs.foldRight(Eval.now(M.empty), (a, eb) => M.combineEval_(f(a), eb)).value`
   *
   * @see foldMapK for a version accepting a `MonoidK` instance
   * @see foldMapLeft for a left-associative, strict variant
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 3, 5).foldMap(Monoid.addition, id)
   * // 9
   *
   * > Seq(1, 3, 5).foldMap(Monoid.product, id)
   * // 15
   * ```
   */
  public foldMap<M>(M: Monoid<M>, f: (a: A) => M): M {
    return this.foldRight(Eval.now(M.empty), (x, r) => M.combineEval_(f(x), r))
      .value;
  }

  /**
   * Version of `foldMap` that accepts `MonoidK` instance.
   */
  public foldMapK<F, B>(
    F: MonoidK<F>,
    f: (a: A) => Kind<F, [B]>,
  ): Kind<F, [B]> {
    return this.foldMap(F.algebra<B>(), f);
  }

  /**
   * Left-associative, strict version of `foldMap`.
   */
  public foldMapLeft<M>(M: Monoid<M>, f: (a: A) => M): M {
    return this.foldLeft(M.empty, (b, x) => M.combine_(b, f(x)));
  }

  private forEachUntil(f: (a: A) => boolean): boolean {
    const xs = this as any as ViewSeq<A>;
    switch (xs.tag) {
      case 0:
        return true;
      case 1:
        return f(xs.value);
      case 2:
        return (
          forEachUntilDigit(xs.pfx, f) &&
          xs.deeper.forEachUntil(n => forEachUntilNode(n, f)) &&
          forEachUntilDigit(xs.sfx, f)
        );
    }
  }

  private forEachUntilRight(f: (a: A) => boolean): boolean {
    const xs = this as any as ViewSeq<A>;
    switch (xs.tag) {
      case 0:
        return true;
      case 1:
        return f(xs.value);
      case 2:
        return (
          forEachUntilRDigit(xs.sfx, f) &&
          xs.deeper.forEachUntilRight(n => forEachUntilRNode(n, f)) &&
          forEachUntilRDigit(xs.pfx, f)
        );
    }
  }

  // -- Sorted Sequences

  /**
   * _O(n * log(n))_ Return sorted sequence.
   *
   * @see sortBy for user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > Seq(1, 6, 4, 3, 2, 5).sort()
   * // Seq(1, 2, 3, 4, 5, 6)
   * ```
   */
  public sort<A>(this: Seq<A>, O: Ord<A> = Ord.fromUniversalCompare()): Seq<A> {
    return this.sortBy(O.compare);
  }

  /**
   * _O(n * log(n))_ Return a sequence sorted by comparing results of function `f`
   * applied to each of the element of the Sequence.
   *
   * @examples
   *
   * ```typescript
   * > Seq([2, 'world'], [4, '!'], [1, 'Hello']).sortOn(([fst, ]) => fst)
   * // Seq([1, 'Hello'], [2, 'world'], [4, '!']])
   * ```
   */
  public sortOn<B>(
    f: (a: A) => B,
    O: Ord<B> = Ord.fromUniversalCompare(),
  ): Seq<A> {
    return this.sortBy((l, r) => O.compare(f(l), f(r)));
  }

  /**
   * Version of `sort` function using a user-supplied comparator `cmp`.
   */
  public sortBy(cmp: (l: A, r: A) => Compare): Seq<A> {
    return Seq.fromArray(this.toArray.sort((x, y) => cmp(x, y) - 1));
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
   * > Seq(1, 2, 3, 4).traverse(Option.Monad, Some)
   * // Some(Seq(1, 2, 3, 4))
   *
   * > Seq(1, 2, 3, 4).traverse(Option.Monad, _ => None)
   * // None
   * ```
   */
  public traverse<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [B]>,
  ): Kind<G, [Seq<B>]> {
    return isIdentityTC(G)
      ? (this.map(f) as any)
      : Apply.TraverseStrategy(G)(Rhs => traverseViaSeqImpl(G, Rhs, this, f));
  }

  /**
   * _O(n)_ Evaluate each applicative action of the structure left-to-right and
   * combine their results.
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
   * > Seq(Some(1), Some(2), Some(3)).sequence(Option.Monad)
   * // Some(Seq(1, 2, 3))
   *
   * > Seq(Some(1), Some(2), None).sequence(Option.Monad)
   * // None
   * ```
   */
  public sequence<G, A>(
    this: Seq<Kind<G, [A]>>,
    G: Applicative<G>,
  ): Kind<G, [Seq<A>]> {
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
   * _O(n)_ Version of `traverse` which removes elements of the original sequence.
   *
   * @examples
   *
   * ```typescript
   * > const m: Map<number, string> = Map([1, 'one'], [3, 'three'])
   * > Seq(1, 2, 3).traverseFilter(
   * >   Monad.Eval,
   * >   k => Eval.now(m.lookup(k)),
   * > ).value
   * // Seq('one', 'three')
   * ```
   */
  public traverseFilter<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [Option<B>]>,
  ): Kind<G, [Seq<B>]> {
    return isIdentityTC(G)
      ? (this.collect(f as any) as any)
      : Apply.TraverseStrategy(G)(Rhs =>
          traverseFilterViaSeqImpl(
            G,
            Foldable.Array,
            Rhs,
            this.toArray,
            (x: A) => f(x),
          ),
        );
  }

  // -- Strings

  public join(this: Seq<string>, sep: string = ','): string {
    if (this.isEmpty) return '';
    return this.tail.foldLeft(this.head, (r, x) => r + sep + x);
  }

  public toString(): string {
    return `Seq(${this.map(String).join(',')})`;
  }

  // -- Misc

  public equals<A>(
    this: Seq<A>,
    that: Seq<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    if (this === that) return true;
    if (this.size !== that.size) return false;
    return this.foldRight2(that, Eval.true, (x, y, r) =>
      E.equals(x, y) ? r : Eval.false,
    ).value;
  }
}

const Empty = new (class Empty extends _Seq<never> {
  public readonly tag = 0;
  public readonly size: number = 0;
})();

class Single<A> extends _Seq<A> {
  public readonly tag = 1;
  public constructor(public readonly size: number, public readonly value: A) {
    super();
  }
}

type Node<A> = [number, A, A] | [number, A, A, A];
type Digit<A> = [A] | [A, A] | [A, A, A] | [A, A, A, A];

class Deep<A> extends _Seq<A> {
  public readonly tag = 2;
  public constructor(
    public readonly size: number,
    public readonly pfx: Digit<A>,
    public readonly deeper: Seq<Node<A>>,
    public readonly sfx: Digit<A>,
  ) {
    super();
  }
}
type ViewSeq<A> = typeof Empty | Single<A> | Deep<A>;

Seq.empty = Empty as any;
Seq.tailRecM_ = <A, B>(a: A, f: (a: A) => Seq<Either<A, B>>): Seq<B> => {
  const stack: Iterator<Either<A, B>>[] = [f(a).iterator];
  const buf: B[] = [];

  let ptr = 0;
  while (ptr >= 0) {
    const xhd = stack[ptr].next();

    if (xhd.done) {
      stack.pop();
      ptr--;
      continue;
    }

    const nx = xhd.value;
    if (nx.isEmpty) {
      stack.push(f(nx.getLeft).iterator);
      ptr++;
    } else {
      buf.push(nx.get);
    }
  }

  return Seq.fromArray(buf);
};

// -- Private implementation

function node2E<A>(a: A, b: A): Node<A> {
  return [2, a, b];
}
function node2N<A>(a: Node<A>, b: Node<A>): Node<Node<A>> {
  return [a[0] + b[0], a, b];
}
function node3E<A>(a: A, b: A, c: A): Node<A> {
  return [3, a, b, c];
}
function node3N<A>(a: Node<A>, b: Node<A>, c: Node<A>): Node<Node<A>> {
  return [a[0] + b[0] + c[0], a, b, c];
}

function digitSizeN<A>(xs: Digit<Node<A>>): number {
  switch (xs.length) {
    case 1:
      return xs[0][0];
    case 2:
      return xs[0][0] + xs[1][0];
    case 3:
      return xs[0][0] + xs[1][0] + xs[2][0];
    case 4:
      return xs[0][0] + xs[1][0] + xs[2][0] + xs[3][0];
  }
}

function nodesSize<A>(xs: readonly Node<A>[]): number {
  let sz = 0;
  for (let i = 0, len = xs.length; i < len; i++) {
    sz += xs[i][0];
  }
  return sz;
}

function nodeToDigit<A>(xs: Node<A>): Digit<A> {
  switch (xs.length) {
    case 3:
      return [xs[1], xs[2]];
    case 4:
      return [xs[1], xs[2], xs[3]];
  }
}
function digitToTree<A>(s: number, xs: Digit<A>): Seq<A> {
  switch (xs.length) {
    case 1:
      return new Single(s, xs[0]);
    case 2:
      return new Deep(s, [xs[0]], Empty, [xs[1]]);
    case 3:
      return new Deep(s, [xs[0], xs[1]], Empty, [xs[2]]);
    case 4:
      return new Deep(s, [xs[0], xs[1]], Empty, [xs[2], xs[3]]);
  }
}

function createTree<A>(
  b: (idx: number) => A,
  s: number,
  i: number,
  trees: number,
): Seq<A> {
  switch (trees) {
    case 1:
      return new Single(s, b(i));
    case 2:
      return new Deep(2 * s, [b(i)], Empty, [b(i + s)]);
    case 3:
      return new Deep(3 * s, [b(i), b(i + s)], Empty, [b(i + 2 * s)]);
    case 4:
      return new Deep(4 * s, [b(i), b(i + s)], Empty, [
        b(i + 2 * s),
        b(i + 3 * s),
      ]);
    case 5:
      return new Deep(5 * s, [b(i), b(i + s), b(i + 2 * s)], Empty, [
        b(i + 3 * s),
        b(i + 4 * s),
      ]);
    case 6:
      return new Deep(6 * s, [b(i), b(i + s), b(i + 2 * s)], Empty, [
        b(i + 3 * s),
        b(i + 4 * s),
        b(i + 5 * s),
      ]);
    default: {
      const mb = (j: number): Node<A> => [3 * s, b(j), b(j + s), b(j + 2 * s)];
      const ts = (trees / 3) | 0;
      switch (trees % 3) {
        case 1: {
          const j = i + (2 + 3 * (ts - 1)) * s;
          return new Deep(
            trees * s,
            [b(i), b(i + s)],
            createTree(mb, 3 * s, i + 2 * s, ts - 1),
            [b(j), b(j + s)],
          );
        }
        case 2: {
          const j = i + (3 + 3 * (ts - 1)) * s;
          return new Deep(
            trees * s,
            [b(i), b(i + s), b(i + 2 * s)],
            createTree(mb, 3 * s, i + 3 * s, ts - 1),
            [b(j), b(j + s)],
          );
        }
        default: {
          const j = i + (3 + 3 * (ts - 2)) * s;
          return new Deep(
            trees * s,
            [b(i), b(i + s), b(i + 2 * s)],
            createTree(mb, 3 * s, i + 3 * s, ts - 2),
            [b(j), b(j + s), b(j + s * 2)],
          );
        }
      }
    }
  }
}

function prependE<A>(a: A, self: Seq<A>): Seq<A> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return new Single(1, a);
    case 1:
      return new Deep(xs.size + 1, [a], Empty, [xs.value]);
    case 2:
      if (xs.pfx.length === 4) {
        const [b, c, d, e] = xs.pfx;
        return new Deep(
          xs.size + 1,
          [a, b],
          prependN([3, c, d, e], xs.deeper),
          xs.sfx,
        );
      }
      return new Deep(xs.size + 1, prependDigit(a, xs.pfx), xs.deeper, xs.sfx);
  }
}
function prependN<A>(a: Node<A>, self: Seq<Node<A>>): Seq<Node<A>> {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      return new Single(a[0], a);
    case 1:
      return new Deep(xs.size + a[0], [a], Empty, [xs.value]);
    case 2:
      if (xs.pfx.length === 4) {
        const [b, c, d, e] = xs.pfx;
        return new Deep(
          xs.size + a[0],
          [a, b],
          prependN([c[0] + d[0] + e[0], c, d, e], xs.deeper),
          xs.sfx,
        );
      }
      return new Deep(
        xs.size + a[0],
        prependDigit(a, xs.pfx),
        xs.deeper,
        xs.sfx,
      );
  }
}

function appendE<A>(self: Seq<A>, e: A): Seq<A> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return new Single(1, e);
    case 1:
      return new Deep(xs.size + 1, [xs.value], Empty, [e]);
    case 2:
      if (xs.sfx.length === 4) {
        const [a, b, c, d] = xs.sfx;
        return new Deep(xs.size + 1, xs.pfx, appendN(xs.deeper, [3, a, b, c]), [
          d,
          e,
        ]);
      }
      return new Deep(xs.size + 1, xs.pfx, xs.deeper, appendDigit(xs.sfx, e));
  }
}
function appendN<A>(self: Seq<Node<A>>, e: Node<A>): Seq<Node<A>> {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      return new Single(e[0], e);
    case 1:
      return new Deep(xs.size + e[0], [xs.value], Empty, [e]);
    case 2:
      if (xs.sfx.length === 4) {
        const [a, b, c, d] = xs.sfx;
        return new Deep(
          xs.size + e[0],
          xs.pfx,
          appendN(xs.deeper, [a[0] + b[0] + c[0], a, b, c]),
          [d, e],
        );
      }
      return new Deep(
        xs.size + e[0],
        xs.pfx,
        xs.deeper,
        appendDigit(xs.sfx, e),
      );
  }
}

function mapNode<A, B>(n: Node<A>, f: (a: A) => B): Node<B> {
  return n.length === 3
    ? [n[0], f(n[1]), f(n[2])]
    : [n[0], f(n[1]), f(n[2]), f(n[3])];
}

function mapDigit<A, B>(xs: Digit<A>, f: (a: A) => B): Digit<B> {
  switch (xs.length) {
    case 1:
      return [f(xs[0])];
    case 2:
      return [f(xs[0]), f(xs[1])];
    case 3:
      return [f(xs[0]), f(xs[1]), f(xs[2])];
    case 4:
      return [f(xs[0]), f(xs[1]), f(xs[2]), f(xs[3])];
  }
}

function prependDigit<A>(x: A, xs: [A] | [A, A] | [A, A, A]): Digit<A> {
  switch (xs.length) {
    case 1:
      return [x, xs[0]];
    case 2:
      return [x, xs[0], xs[1]];
    case 3:
      return [x, xs[0], xs[1], xs[2]];
  }
}

function appendDigit<A>(xs: [A] | [A, A] | [A, A, A], x: A): Digit<A> {
  switch (xs.length) {
    case 1:
      return [xs[0], x];
    case 2:
      return [xs[0], xs[1], x];
    case 3:
      return [xs[0], xs[1], xs[2], x];
  }
}

function takeE<A>(n: number, self: Seq<A>): Seq<A> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return Empty;
    case 1:
      return n <= 0 ? Empty : xs;
    case 2: {
      const sp = xs.pfx.length;
      if (n < sp) return takePrefixE(n, xs.pfx);
      const spm = sp + xs.deeper.size;
      if (n < spm) {
        const [ml, ys] = takeN(n - sp, xs.deeper);
        return takeMiddleE(n - sp - ml.size, sp, xs.pfx, ml, ys);
      }
      return takeSuffixE(n - spm, xs.size, xs.pfx, xs.deeper, xs.sfx);
    }
  }
}
function takeN<A>(n: number, self: Seq<Node<A>>): [Seq<Node<A>>, Node<A>] {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      throw new Error();
    case 1:
      return [Empty, xs.value];
    case 2: {
      const sp = digitSizeN(xs.pfx);
      if (n < sp) return takePrefixN(n, xs.pfx);
      const spm = sp + xs.deeper.size;
      if (n < spm) {
        const [ml, ys] = takeN(n - sp, xs.deeper);
        return takeMiddleN(n - sp - ml.size, sp, xs.pfx, ml, ys);
      }
      return takeSuffixN(n - spm, xs.size, xs.pfx, xs.deeper, xs.sfx);
    }
  }
}

function takePrefixE<A>(n: number, xs: Digit<A>): Seq<A> {
  switch (xs.length) {
    case 1:
      return Empty;
    case 2:
      return n < 1 ? Empty : new Single(1, xs[0]);
    case 3:
      if (n < 1) return Empty;
      if (n < 2) return new Single(1, xs[0]);
      return new Deep(2, [xs[0]], Empty, [xs[1]]);
    case 4:
      if (n < 1) return Empty;
      if (n < 2) return new Single(1, xs[0]);
      if (n < 3) return new Deep(2, [xs[0]], Empty, [xs[1]]);
      return new Deep(3, [xs[0], xs[1]], Empty, [xs[2]]);
  }
}
function takePrefixN<A>(
  n: number,
  xs: Digit<Node<A>>,
): [Seq<Node<A>>, Node<A>] {
  switch (xs.length) {
    case 1:
      return [Empty, xs[0]];
    case 2:
      return n < xs[0][0]
        ? [Empty, xs[0]]
        : [new Single(xs[0][0], xs[0]), xs[1]];
    case 3: {
      const sa = xs[0][0];
      if (n < sa) return [Empty, xs[0]];
      const sab = sa + xs[1][0];
      if (n < sab) return [new Single(sa, xs[0]), xs[1]];
      return [new Deep(sab, [xs[0]], Empty, [xs[1]]), xs[2]];
    }
    case 4: {
      const sa = xs[0][0];
      if (n < sa) return [Empty, xs[0]];
      const sab = sa + xs[1][0];
      if (n < sab) return [new Single(sa, xs[0]), xs[1]];
      const sabc = sab + xs[2][0];
      if (n < sabc) return [new Deep(sab, [xs[0]], Empty, [xs[1]]), xs[2]];
      return [new Deep(sabc, [xs[0], xs[1]], Empty, [xs[2]]), xs[3]];
    }
  }
}

function takeMiddleE<A>(
  n: number,
  sp: number,
  pfx: Digit<A>,
  ml: Seq<Node<A>>,
  xs: Node<A>,
): Seq<A> {
  switch (xs.length) {
    case 3:
      if (n < 1) return pullR(sp + ml.size, pfx, ml);
      return new Deep(sp + ml.size + 1, pfx, ml, [xs[1]]);
    case 4:
      if (n < 1) return pullR(sp + ml.size, pfx, ml);
      if (n < 2) return new Deep(sp + ml.size + 1, pfx, ml, [xs[1]]);
      return new Deep(sp + ml.size + 2, pfx, ml, [xs[1], xs[2]]);
  }
}
function takeMiddleN<A>(
  n: number,
  sp: number,
  pfx: Digit<Node<A>>,
  ml: Seq<Node<Node<A>>>,
  xs: Node<Node<A>>,
): [Seq<Node<A>>, Node<A>] {
  switch (xs.length) {
    case 3:
      if (n < xs[1][0]) return [pullR(sp + ml.size, pfx, ml), xs[1]];
      return [new Deep(sp + ml.size + xs[1][0], pfx, ml, [xs[1]]), xs[2]];
    case 4:
      if (n < xs[1][0]) return [pullR(sp + ml.size, pfx, ml), xs[1]];
      if (n < xs[1][0] + xs[2][0])
        return [new Deep(sp + ml.size + xs[1][0], pfx, ml, [xs[1]]), xs[2]];
      return [
        new Deep(sp + ml.size + xs[1][0] + xs[2][0], pfx, ml, [xs[1], xs[2]]),
        xs[3],
      ];
  }
}

function takeSuffixE<A>(
  n: number,
  s: number,
  pfx: Digit<A>,
  m: Seq<Node<A>>,
  xs: Digit<A>,
): Seq<A> {
  switch (xs.length) {
    case 1:
      return pullR(s - 1, pfx, m);
    case 2:
      return n < 1 ? pullR(s - 2, pfx, m) : new Deep(s - 1, pfx, m, [xs[0]]);
    case 3:
      if (n < 1) return pullR(s - 3, pfx, m);
      if (n < 2) return new Deep(s - 2, pfx, m, [xs[0]]);
      return new Deep(s - 1, pfx, m, [xs[0], xs[1]]);
    case 4:
      if (n < 1) return pullR(s - 4, pfx, m);
      if (n < 2) return new Deep(s - 3, pfx, m, [xs[0]]);
      if (n < 3) return new Deep(s - 2, pfx, m, [xs[0], xs[1]]);
      return new Deep(s - 1, pfx, m, [xs[0], xs[1], xs[2]]);
  }
}
function takeSuffixN<A>(
  n: number,
  s: number,
  pfx: Digit<Node<A>>,
  m: Seq<Node<Node<A>>>,
  xs: Digit<Node<A>>,
): [Seq<Node<A>>, Node<A>] {
  switch (xs.length) {
    case 1:
      return [pullR(s - xs[0][0], pfx, m), xs[0]];
    case 2: {
      const sa = xs[0][0];
      return n < sa
        ? [pullR(s - digitSizeN(xs), pfx, m), xs[0]]
        : [new Deep(s - xs[1][0], pfx, m, [xs[0]]), xs[1]];
    }
    case 3: {
      const sa = xs[0][0];
      if (n < sa) return [pullR(s - digitSizeN(xs), pfx, m), xs[0]];
      const sab = sa + xs[1][0];
      if (n < sab)
        return [new Deep(s - xs[1][0] - xs[2][0], pfx, m, [xs[0]]), xs[1]];
      return [new Deep(s - xs[2][0], pfx, m, [xs[0], xs[1]]), xs[2]];
    }
    case 4: {
      const sa = xs[0][0];
      if (n < sa) return [pullR(s - digitSizeN(xs), pfx, m), xs[0]];
      const sab = sa + xs[1][0];
      if (n < sab)
        return [
          new Deep(s - xs[1][0] - xs[2][0] - xs[3][0], pfx, m, [xs[0]]),
          xs[1],
        ];
      const sabc = sab + xs[2][0];
      if (n < sabc)
        return [
          new Deep(s - xs[2][0] - xs[3][0], pfx, m, [xs[0], xs[1]]),
          xs[2],
        ];
      return [new Deep(s - xs[3][0], pfx, m, [xs[0], xs[1], xs[2]]), xs[3]];
    }
  }
}

function takeER<A>(n: number, self: Seq<A>): Seq<A> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return Empty;
    case 1:
      return n <= 0 ? Empty : xs;
    case 2: {
      const ss = xs.sfx.length;
      if (n < ss) return takeSuffixER(n, xs.sfx);
      const ssm = ss + xs.deeper.size;
      if (n < ssm) {
        const [ys, mr] = takeNR(n - ss, xs.deeper);
        return takeMiddleER(n - ss - mr.size, ss, mr, xs.sfx, ys);
      }
      return takePrefixER(n - ssm, xs.size, xs.deeper, xs.sfx, xs.pfx);
    }
  }
}
function takeNR<A>(n: number, self: Seq<Node<A>>): [Node<A>, Seq<Node<A>>] {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      throw new Error();
    case 1:
      return [xs.value, Empty];
    case 2: {
      const ss = digitSizeN(xs.sfx);
      if (n < ss) return takeSuffixNR(n, xs.sfx);
      const ssm = ss + xs.deeper.size;
      if (n < ssm) {
        const [ys, mr] = takeNR(n - ss, xs.deeper);
        return takeMiddleNR(n - ss - mr.size, ss, mr, xs.sfx, ys);
      }
      return takePrefixNR(n - ssm, xs.size, xs.deeper, xs.sfx, xs.pfx);
    }
  }
}

function takeSuffixER<A>(n: number, xs: Digit<A>): Seq<A> {
  switch (xs.length) {
    case 1:
      return Empty;
    case 2:
      return n < 1 ? Empty : new Single(1, xs[1]);
    case 3:
      if (n < 1) return Empty;
      if (n < 2) return new Single(1, xs[2]);
      return new Deep(2, [xs[1]], Empty, [xs[2]]);
    case 4:
      if (n < 1) return Empty;
      if (n < 2) return new Single(1, xs[3]);
      if (n < 3) return new Deep(2, [xs[2]], Empty, [xs[3]]);
      return new Deep(3, [xs[1], xs[2]], Empty, [xs[3]]);
  }
}
function takeSuffixNR<A>(
  n: number,
  xs: Digit<Node<A>>,
): [Node<A>, Seq<Node<A>>] {
  switch (xs.length) {
    case 1:
      return [xs[0], Empty];
    case 2:
      return n < xs[1][0]
        ? [xs[1], Empty]
        : [xs[0], new Single(xs[1][0], xs[1])];
    case 3: {
      const sc = xs[2][0];
      if (n < sc) return [xs[2], Empty];
      const scb = sc + xs[1][0];
      if (n < scb) return [xs[1], new Single(sc, xs[2])];
      return [xs[0], new Deep(scb, [xs[1]], Empty, [xs[2]])];
    }
    case 4: {
      const sd = xs[3][0];
      if (n < sd) return [xs[3], Empty];
      const sdc = sd + xs[2][0];
      if (n < sdc) return [xs[2], new Single(sd, xs[3])];
      const sdcb = sdc + xs[1][0];
      if (n < sdcb) return [xs[1], new Deep(sdc, [xs[2]], Empty, [xs[3]])];
      return [xs[0], new Deep(sdcb, [xs[1], xs[2]], Empty, [xs[3]])];
    }
  }
}

function takeMiddleER<A>(
  n: number,
  ss: number,
  mr: Seq<Node<A>>,
  sfx: Digit<A>,
  xs: Node<A>,
): Seq<A> {
  switch (xs.length) {
    case 3:
      if (n < 1) return pullL(ss + mr.size, mr, sfx);
      return new Deep(ss + mr.size + 1, [xs[2]], mr, sfx);
    case 4:
      if (n < 1) return pullL(ss + mr.size, mr, sfx);
      if (n < 2) return new Deep(ss + mr.size + 1, [xs[3]], mr, sfx);
      return new Deep(ss + mr.size + 2, [xs[2], xs[3]], mr, sfx);
  }
}
function takeMiddleNR<A>(
  n: number,
  ss: number,
  mr: Seq<Node<Node<A>>>,
  sfx: Digit<Node<A>>,
  xs: Node<Node<A>>,
): [Node<A>, Seq<Node<A>>] {
  switch (xs.length) {
    case 3:
      if (n < xs[2][0]) return [xs[2], pullL(ss + mr.size, mr, sfx)];
      return [xs[1], new Deep(ss + mr.size + xs[2][0], [xs[2]], mr, sfx)];
    case 4:
      if (n < xs[3][0]) return [xs[3], pullL(ss + mr.size, mr, sfx)];
      if (n < xs[3][0] + xs[2][0])
        return [xs[2], new Deep(ss + mr.size + xs[3][0], [xs[3]], mr, sfx)];
      return [
        xs[1],
        new Deep(ss + mr.size + xs[2][0] + xs[3][0], [xs[2], xs[3]], mr, sfx),
      ];
  }
}

function takePrefixER<A>(
  n: number,
  s: number,
  m: Seq<Node<A>>,
  sfx: Digit<A>,
  xs: Digit<A>,
): Seq<A> {
  switch (xs.length) {
    case 1:
      return pullL(s - 1, m, sfx);
    case 2:
      return n < 1 ? pullL(s - 2, m, sfx) : new Deep(s - 1, [xs[1]], m, sfx);
    case 3:
      if (n < 1) return pullL(s - 3, m, sfx);
      if (n < 2) return new Deep(s - 2, [xs[2]], m, sfx);
      return new Deep(s - 1, [xs[1], xs[2]], m, sfx);
    case 4:
      if (n < 1) return pullL(s - 4, m, sfx);
      if (n < 2) return new Deep(s - 3, [xs[3]], m, sfx);
      if (n < 3) return new Deep(s - 2, [xs[2], xs[3]], m, sfx);
      return new Deep(s - 1, [xs[1], xs[2], xs[3]], m, sfx);
  }
}
function takePrefixNR<A>(
  n: number,
  s: number,
  m: Seq<Node<Node<A>>>,
  sfx: Digit<Node<A>>,
  xs: Digit<Node<A>>,
): [Node<A>, Seq<Node<A>>] {
  switch (xs.length) {
    case 1:
      return [xs[0], pullL(s - xs[0][0], m, sfx)];
    case 2:
      return n < xs[1][0]
        ? [xs[1], pullL(s - xs[1][0] - xs[0][0], m, sfx)]
        : [xs[0], new Deep(s - xs[0][0], [xs[1]], m, sfx)];
    case 3:
      if (n < xs[2][0]) return [xs[2], pullL(s - digitSizeN(xs), m, sfx)];
      if (n < xs[2][0] + xs[1][0])
        return [xs[1], new Deep(s - xs[1][0] - xs[0][0], [xs[2]], m, sfx)];
      return [xs[0], new Deep(s - xs[0][0], [xs[1], xs[2]], m, sfx)];
    case 4:
      if (n < xs[3][0]) return [xs[3], pullL(s - digitSizeN(xs), m, sfx)];
      if (n < xs[3][0] + xs[2][0])
        return [
          xs[2],
          new Deep(s - xs[2][0] - xs[1][0] - xs[0][0], [xs[3]], m, sfx),
        ];
      if (n < xs[3][0] + xs[2][0] + xs[1][0])
        return [
          xs[1],
          new Deep(s - xs[1][0] - xs[0][0], [xs[2], xs[3]], m, sfx),
        ];
      return [xs[0], new Deep(s - xs[0][0], [xs[1], xs[2], xs[3]], m, sfx)];
  }
}

type Split<A> = [Seq<Node<A>>, Node<A>, Seq<Node<A>>];
function splitE<A>(idx: number, self: Seq<A>): [Seq<A>, Seq<A>] {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return [Empty, Empty];
    case 1:
      return idx <= 0 ? [Empty, xs] : [xs, Empty];
    case 2: {
      const sp = xs.pfx.length;
      if (idx < sp)
        return splitPrefixE(idx, xs.size, xs.pfx, xs.deeper, xs.sfx);
      if (idx < sp + xs.deeper.size) {
        const [ml, ys, mr] = splitN(idx - sp, xs.deeper);
        return splitMiddleE(
          idx - sp - ml.size,
          xs.size,
          sp,
          xs.pfx,
          ml,
          ys,
          mr,
          xs.sfx,
        );
      }
      return splitSuffixE(
        idx - sp - xs.deeper.size,
        xs.size,
        xs.pfx,
        xs.deeper,
        xs.sfx,
      );
    }
  }
}
function splitN<A>(idx: number, self: Seq<Node<A>>): Split<A> {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      throw new Error('Empty.splitN');
    case 1:
      return idx <= 0 ? [Empty, xs.value, Empty] : [Empty, xs.value, Empty];
    case 2: {
      const sp = digitSizeN(xs.pfx);
      if (idx < sp)
        return splitPrefixN(idx, xs.size, xs.pfx, xs.deeper, xs.sfx);
      if (idx < sp + xs.deeper.size) {
        const [ml, ys, mr] = splitN(idx - sp, xs.deeper);
        return splitMiddleN(
          idx - sp - ml.size,
          xs.size,
          sp,
          xs.pfx,
          ml,
          ys,
          mr,
          xs.sfx,
        );
      }
      return splitSuffixN(
        idx - sp - xs.deeper.size,
        xs.size,
        xs.pfx,
        xs.deeper,
        xs.sfx,
      );
    }
  }
}

function splitPrefixE<A>(
  idx: number,
  s: number,
  pfx: Digit<A>,
  m: Seq<Node<A>>,
  sfx: Digit<A>,
): [Seq<A>, Seq<A>] {
  switch (pfx.length) {
    case 1:
      return [Empty, new Deep(s, pfx, m, sfx)];
    case 2:
      if (idx < 1) return [Empty, new Deep(s, pfx, m, sfx)];
      return [new Single(1, pfx[0]), new Deep(s - 1, [pfx[1]], m, sfx)];
    case 3:
      if (idx < 1) return [Empty, new Deep(s, pfx, m, sfx)];
      if (idx < 2)
        return [
          new Single(1, pfx[0]),
          new Deep(s - 1, [pfx[1], pfx[2]], m, sfx),
        ];
      return [
        new Deep(2, [pfx[0]], Empty, [pfx[1]]),
        new Deep(s - 2, [pfx[2]], m, sfx),
      ];
    case 4:
      if (idx < 1) return [Empty, new Deep(s, pfx, m, sfx)];
      if (idx < 2)
        return [
          new Single(1, pfx[0]),
          new Deep(s - 1, [pfx[1], pfx[2], pfx[3]], m, sfx),
        ];
      if (idx < 3)
        return [
          new Deep(2, [pfx[0]], Empty, [pfx[1]]),
          new Deep(s - 2, [pfx[2], pfx[3]], m, sfx),
        ];
      return [
        new Deep(3, [pfx[0], pfx[1]], Empty, [pfx[2]]),
        new Deep(s - 3, [pfx[3]], m, sfx),
      ];
  }
}
function splitPrefixN<A>(
  idx: number,
  s: number,
  pfx: Digit<Node<A>>,
  m: Seq<Node<Node<A>>>,
  sfx: Digit<Node<A>>,
): Split<A> {
  switch (pfx.length) {
    case 1:
      return [Empty, pfx[0], pullL(s - pfx[0][0], m, sfx)];
    case 2: {
      const sa = pfx[0][0];
      return idx < sa
        ? [Empty, pfx[0], new Deep(s - sa, [pfx[1]], m, sfx)]
        : [new Single(sa, pfx[0]), pfx[1], pullL(s - sa - pfx[1][0], m, sfx)];
    }
    case 3: {
      const sa = pfx[0][0];
      if (idx < sa)
        return [Empty, pfx[0], new Deep(s - sa, [pfx[1], pfx[2]], m, sfx)];
      const sab = sa + pfx[1][0];
      if (idx < sab)
        return [
          new Single(sa, pfx[0]),
          pfx[1],
          new Deep(s - sab, [pfx[2]], m, sfx),
        ];
      return [
        new Deep(sab, [pfx[0]], Empty, [pfx[1]]),
        pfx[2],
        pullL(s - sab - pfx[2][0], m, sfx),
      ];
    }
    case 4: {
      const sa = pfx[0][0];
      if (idx < sa)
        return [
          Empty,
          pfx[0],
          new Deep(s - sa, [pfx[1], pfx[2], pfx[3]], m, sfx),
        ];
      const sab = sa + pfx[1][0];
      if (idx < sab)
        return [
          new Single(sa, pfx[0]),
          pfx[1],
          new Deep(s - sab, [pfx[2], pfx[3]], m, sfx),
        ];
      const sabc = sab + pfx[2][0];
      if (idx < sabc)
        return [
          new Deep(sab, [pfx[0]], Empty, [pfx[1]]),
          pfx[2],
          new Deep(s - sabc, [pfx[3]], m, sfx),
        ];
      return [
        new Deep(sabc, [pfx[0], pfx[1]], Empty, [pfx[2]]),
        pfx[3],
        pullL(s - sabc - pfx[3][0], m, sfx),
      ];
    }
  }
}

function splitMiddleE<A>(
  idx: number,
  s: number,
  sp: number,
  pfx: Digit<A>,
  ml: Seq<Node<A>>,
  xs: Node<A>,
  mr: Seq<Node<A>>,
  sfx: Digit<A>,
): [Seq<A>, Seq<A>] {
  switch (xs.length) {
    case 3:
      return idx < 1
        ? [
            pullR(sp + ml.size, pfx, ml),
            new Deep(s - sp - ml.size, [xs[1], xs[2]], mr, sfx),
          ]
        : [
            new Deep(sp + ml.size + 1, pfx, ml, [xs[1]]),
            new Deep(s - sp - ml.size - 1, [xs[2]], mr, sfx),
          ];
    case 4:
      if (idx < 1)
        return [
          pullR(sp + ml.size, pfx, ml),
          new Deep(s - sp - ml.size, [xs[1], xs[2], xs[3]], mr, sfx),
        ];
      if (idx < 2)
        return [
          new Deep(sp + ml.size + 1, pfx, ml, [xs[1]]),
          new Deep(s - sp - ml.size - 1, [xs[2], xs[3]], mr, sfx),
        ];
      return [
        new Deep(sp + ml.size + 2, pfx, ml, [xs[1], xs[2]]),
        new Deep(s - sp - ml.size - 2, [xs[3]], mr, sfx),
      ];
  }
}
function splitMiddleN<A>(
  idx: number,
  s: number,
  sp: number,
  pfx: Digit<Node<A>>,
  ml: Seq<Node<Node<A>>>,
  xs: Node<Node<A>>,
  mr: Seq<Node<Node<A>>>,
  sfx: Digit<Node<A>>,
): Split<A> {
  switch (xs.length) {
    case 3: {
      const sa = xs[1][0];
      if (idx < sa)
        return [
          pullR(sp + ml.size, pfx, ml),
          xs[1],
          new Deep(s - sp - ml.size - sa, [xs[2]], mr, sfx),
        ];
      return [
        new Deep(sp + ml.size + sa, pfx, ml, [xs[1]]),
        xs[2],
        pullL(s - ml.size - sa - xs[2][0], mr, sfx),
      ];
    }
    case 4: {
      const sa = xs[1][0];
      if (idx < sa)
        return [
          pullR(sp + ml.size, pfx, ml),
          xs[1],
          new Deep(s - sp - ml.size - sa, [xs[2], xs[3]], mr, sfx),
        ];
      const sab = sa + xs[2][0];
      if (idx < sab)
        return [
          new Deep(sp + ml.size + sa, pfx, ml, [xs[1]]),
          xs[2],
          new Deep(s - sp - ml.size - sab, [xs[3]], mr, sfx),
        ];

      return [
        new Deep(sp + ml.size + sab, pfx, ml, [xs[1], xs[2]]),
        xs[3],
        pullL(s - sp - ml.size - sab - xs[3][0], mr, sfx),
      ];
    }
  }
}

function splitSuffixE<A>(
  idx: number,
  s: number,
  pfx: Digit<A>,
  m: Seq<Node<A>>,
  sfx: Digit<A>,
): [Seq<A>, Seq<A>] {
  switch (sfx.length) {
    case 1:
      return [pullR(s - 1, pfx, m), new Single(1, sfx[0])];
    case 2:
      if (idx < 1)
        return [pullR(s - 2, pfx, m), new Deep(2, [sfx[0]], Empty, [sfx[1]])];
      return [new Deep(s - 1, pfx, m, [sfx[0]]), new Single(1, sfx[1])];
    case 3:
      if (idx < 1)
        return [
          pullR(s - 3, pfx, m),
          new Deep(3, [sfx[0], sfx[1]], Empty, [sfx[2]]),
        ];
      if (idx < 2)
        return [
          new Deep(s - 2, pfx, m, [sfx[0]]),
          new Deep(2, [sfx[1]], Empty, [sfx[2]]),
        ];
      return [new Deep(s - 1, pfx, m, [sfx[0], sfx[1]]), new Single(1, sfx[2])];
    case 4:
      if (idx < 1)
        return [
          pullR(s - 4, pfx, m),
          new Deep(4, [sfx[0], sfx[1]], Empty, [sfx[2], sfx[3]]),
        ];
      if (idx < 2)
        return [
          new Deep(s - 3, pfx, m, [sfx[0]]),
          new Deep(3, [sfx[1], sfx[2]], Empty, [sfx[3]]),
        ];
      if (idx < 3)
        return [
          new Deep(s - 2, pfx, m, [sfx[0], sfx[1]]),
          new Deep(2, [sfx[2]], Empty, [sfx[3]]),
        ];
      return [
        new Deep(s - 1, pfx, m, [sfx[0], sfx[1], sfx[2]]),
        new Single(1, sfx[3]),
      ];
  }
}
function splitSuffixN<A>(
  idx: number,
  s: number,
  pfx: Digit<Node<A>>,
  m: Seq<Node<Node<A>>>,
  sfx: Digit<Node<A>>,
): Split<A> {
  switch (sfx.length) {
    case 1:
      return [pullR(s - sfx[0][0], pfx, m), sfx[0], Empty];
    case 2: {
      const sa = sfx[0][0];
      if (idx < sa)
        return [
          pullR(s - sa - sfx[1][0], pfx, m),
          sfx[0],
          new Single(sfx[1][0], sfx[1]),
        ];
      return [new Deep(s - sfx[1][0], pfx, m, [sfx[0]]), sfx[1], Empty];
    }
    case 3: {
      const sa = sfx[0][0];
      if (idx < sa)
        return [
          pullR(s - sa - sfx[1][0] - sfx[2][0], pfx, m),
          sfx[0],
          new Deep(sfx[1][0] + sfx[2][0], [sfx[1]], Empty, [sfx[2]]),
        ];
      const sab = sa + sfx[1][0];
      if (idx < sab)
        return [
          new Deep(s - sfx[1][0] - sfx[2][0], pfx, m, [sfx[0]]),
          sfx[1],
          new Single(sfx[2][0], sfx[2]),
        ];
      return [new Deep(s - sfx[2][0], pfx, m, [sfx[0], sfx[1]]), sfx[2], Empty];
    }
    case 4: {
      const sa = sfx[0][0];
      if (idx < sa) {
        const sbcd = sfx[1][0] + sfx[2][0] + sfx[3][0];
        return [
          pullR(s - sa - sbcd, pfx, m),
          sfx[0],
          new Deep(sbcd, [sfx[1], sfx[2]], Empty, [sfx[3]]),
        ];
      }
      const sab = sa + sfx[1][0];
      if (idx < sab) {
        const scd = sfx[2][0] + sfx[3][0];
        return [
          new Deep(s - sfx[1][0] - scd, pfx, m, [sfx[0]]),
          sfx[1],
          new Deep(scd, [sfx[2]], Empty, [sfx[3]]),
        ];
      }
      const sabc = sab + sfx[2][0];
      if (idx < sabc)
        return [
          new Deep(s - sfx[2][0] - sfx[3][0], pfx, m, [sfx[0], sfx[1]]),
          sfx[2],
          new Single(sfx[3][0], sfx[3]),
        ];
      return [
        new Deep(s - sfx[3][0], pfx, m, [sfx[0], sfx[1], sfx[2]]),
        sfx[3],
        Empty,
      ];
    }
  }
}

function getE<A>(self: Seq<A>, idx: number): { idx: number; value: A } {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      throw new Error('Empty.get');
    case 1:
      return { idx, value: xs.value };
    case 2: {
      const sp = xs.pfx.length;
      if (idx < sp) return getDigitE(xs.pfx, idx);
      const sm = sp + xs.deeper.size;
      if (idx < sm) {
        const p = getN(xs.deeper, idx - sp);
        return getNodeE(p.value, p.idx);
      }
      return getDigitE(xs.sfx, idx - sm);
    }
  }
}
function getN<A>(
  self: Seq<Node<A>>,
  idx: number,
): { idx: number; value: Node<A> } {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      throw new Error('Empty.get');
    case 1:
      return { idx, value: xs.value };
    case 2: {
      const sp = digitSizeN(xs.pfx);
      if (idx < sp) return getDigitN(xs.pfx, idx);
      const sm = sp + xs.deeper.size;
      if (idx < sm) {
        const p = getN(xs.deeper, idx - sp);
        return getNodeN(p.value, p.idx);
      }
      return getDigitN(xs.sfx, idx - sm);
    }
  }
}
function getNodeE<A>(xs: Node<A>, idx: number): { idx: number; value: A } {
  switch (xs.length) {
    case 3: {
      const sa = 1;
      return idx < sa ? { idx, value: xs[1] } : { idx: idx - sa, value: xs[2] };
    }
    case 4: {
      const sa = 1;
      if (idx < sa) return { idx, value: xs[1] };
      const sb = sa + 1;
      return idx < sb
        ? { idx: idx - sa, value: xs[2] }
        : { idx: idx - sb, value: xs[3] };
    }
  }
}
function getNodeN<A>(
  xs: Node<Node<A>>,
  idx: number,
): { idx: number; value: Node<A> } {
  switch (xs.length) {
    case 3: {
      const sa = xs[1][0];
      return idx < sa ? { idx, value: xs[1] } : { idx: idx - sa, value: xs[2] };
    }
    case 4: {
      const sa = xs[1][0];
      if (idx < sa) return { idx, value: xs[1] };
      const sb = sa + xs[2][0];
      return idx < sb
        ? { idx: idx - sa, value: xs[2] }
        : { idx: idx - sb, value: xs[3] };
    }
  }
}

function getDigitE<A>(xs: Digit<A>, idx: number): { idx: number; value: A } {
  switch (xs.length) {
    case 1:
      return { idx, value: xs[0] };
    case 2: {
      const sa = 1;
      return idx < sa ? { idx, value: xs[0] } : { idx: idx - sa, value: xs[1] };
    }
    case 3: {
      const sa = 1;
      if (idx < sa) return { idx, value: xs[0] };
      const sb = sa + 1;
      return idx < sb
        ? { idx: idx - sa, value: xs[1] }
        : { idx: idx - sb, value: xs[2] };
    }
    case 4: {
      const sa = 1;
      if (idx < sa) return { idx, value: xs[0] };
      const sb = sa + 1;
      if (idx < sb) return { idx: idx - sa, value: xs[1] };
      const sc = sb + 1;
      return idx < sc
        ? { idx: idx - sb, value: xs[2] }
        : { idx: idx - sc, value: xs[3] };
    }
  }
}
function getDigitN<A>(
  xs: Digit<Node<A>>,
  idx: number,
): { idx: number; value: Node<A> } {
  switch (xs.length) {
    case 1:
      return { idx, value: xs[0] };
    case 2: {
      const sa = xs[0][0];
      return idx < sa ? { idx, value: xs[0] } : { idx: idx - sa, value: xs[1] };
    }
    case 3: {
      const sa = xs[0][0];
      if (idx < sa) return { idx, value: xs[0] };
      const sb = sa + xs[1][0];
      return idx < sb
        ? { idx: idx - sa, value: xs[1] }
        : { idx: idx - sb, value: xs[2] };
    }
    case 4: {
      const sa = xs[0][0];
      if (idx < sa) return { idx, value: xs[0] };
      const sb = sa + xs[1][0];
      if (idx < sb) return { idx: idx - sa, value: xs[1] };
      const sc = sb + xs[2][0];
      return idx < sc
        ? { idx: idx - sb, value: xs[2] }
        : { idx: idx - sc, value: xs[3] };
    }
  }
}

function modifyE<A>(self: Seq<A>, idx: number, f: (a: A) => A): Seq<A> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      throw new Error('Unreachable');
    case 1:
      return new Single(1, f(xs.value));
    case 2:
      const sp = xs.pfx.length;
      if (idx < sp)
        return new Deep(
          xs.size,
          modifyDigitE(xs.pfx, idx, f),
          xs.deeper,
          xs.sfx,
        );
      const spm = sp + xs.deeper.size;
      if (idx < spm)
        return new Deep(
          xs.size,
          xs.pfx,
          modifyN(xs.deeper, idx - sp, modifyNodeE(f)),
          xs.sfx,
        );
      return new Deep(
        xs.size,
        xs.pfx,
        xs.deeper,
        modifyDigitE(xs.sfx, idx - spm, f),
      );
  }
}
function modifyN<A>(
  self: Seq<Node<A>>,
  idx: number,
  f: (a: Node<A>, idx: number) => Node<A>,
): Seq<Node<A>> {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      throw new Error('Unreachable');
    case 1:
      return new Single(xs.size, f(xs.value, idx));
    case 2:
      const sp = digitSizeN(xs.pfx);
      if (idx < sp)
        return new Deep(
          xs.size,
          modifyDigitN(xs.pfx, idx, f),
          xs.deeper,
          xs.sfx,
        );
      const spm = sp + xs.deeper.size;
      if (idx < spm)
        return new Deep(
          xs.size,
          xs.pfx,
          modifyN(xs.deeper, idx - sp, modifyNodeN(f)),
          xs.sfx,
        );
      return new Deep(
        xs.size,
        xs.pfx,
        xs.deeper,
        modifyDigitN(xs.sfx, idx - spm, f),
      );
  }
}

function modifyDigitE<A>(xs: Digit<A>, idx: number, f: (a: A) => A): Digit<A> {
  switch (xs.length) {
    case 1:
      return [f(xs[0])];
    case 2:
      return idx === 0 ? [f(xs[0]), xs[1]] : [xs[0], f(xs[1])];
    case 3:
      switch (idx) {
        case 0:
          return [f(xs[0]), xs[1], xs[2]];
        case 1:
          return [xs[0], f(xs[1]), xs[2]];
        case 2:
          return [xs[0], xs[1], f(xs[2])];
        default:
          throw new Error('Unreachable');
      }
    case 4:
      switch (idx) {
        case 0:
          return [f(xs[0]), xs[1], xs[2], xs[3]];
        case 1:
          return [xs[0], f(xs[1]), xs[2], xs[3]];
        case 2:
          return [xs[0], xs[1], f(xs[2]), xs[3]];
        case 3:
          return [xs[0], xs[1], xs[2], f(xs[3])];
        default:
          throw new Error('Unreachable');
      }
  }
}
function modifyDigitN<A>(
  xs: Digit<Node<A>>,
  idx: number,
  f: (a: Node<A>, idx: number) => Node<A>,
): Digit<Node<A>> {
  switch (xs.length) {
    case 1:
      return [f(xs[0], idx)];
    case 2:
      return idx < xs[0][0]
        ? [f(xs[0], idx), xs[1]]
        : [xs[0], f(xs[1], idx - xs[0][0])];
    case 3: {
      const sa = xs[0][0];
      if (idx < sa) return [f(xs[0], idx), xs[1], xs[2]];
      const sab = sa + xs[1][0];
      if (idx < sab) return [xs[0], f(xs[1], idx - sa), xs[2]];
      return [xs[0], xs[1], f(xs[2], idx - sab)];
    }
    case 4: {
      const sa = xs[0][0];
      if (idx < sa) return [f(xs[0], idx), xs[1], xs[2], xs[3]];
      const sab = sa + xs[1][0];
      if (idx < sab) return [xs[0], f(xs[1], idx - sa), xs[2], xs[3]];
      const sabc = sab + xs[2][0];
      if (idx < sabc) return [xs[0], xs[1], f(xs[2], idx - sab), xs[3]];
      return [xs[0], xs[1], xs[2], f(xs[3], idx - sab)];
    }
  }
}

function modifyNodeE<A>(f: (n: A) => A): (n: Node<A>, idx: number) => Node<A> {
  return (xs, idx) => modifyNodeE_(f, xs, idx);
}
function modifyNodeE_<A>(f: (n: A) => A, xs: Node<A>, idx: number): Node<A> {
  switch (xs.length) {
    case 3:
      return idx < 1 ? node2E(f(xs[1]), xs[2]) : node2E(xs[1], f(xs[2]));
    case 4:
      switch (idx) {
        case 0:
          return node3E(f(xs[1]), xs[2], xs[3]);
        case 1:
          return node3E(xs[1], f(xs[2]), xs[3]);
        case 2:
          return node3E(xs[1], xs[2], f(xs[3]));
        default:
          throw new Error('Unreachable');
      }
    default:
      throw new Error('Unreachable');
  }
}
function modifyNodeN<A>(
  f: (n: Node<A>, idx: number) => Node<A>,
): (n: Node<Node<A>>, idx: number) => Node<Node<A>> {
  return (xs, idx) => modifyNodeN_(f, xs, idx);
}
function modifyNodeN_<A>(
  f: (n: Node<A>, idx: number) => Node<A>,
  xs: Node<Node<A>>,
  idx: number,
): Node<Node<A>> {
  switch (xs.length) {
    case 3: {
      const sa = xs[1][0];
      if (idx < sa) return node2N(f(xs[1], idx), xs[2]);
      return node2N(xs[1], f(xs[2], idx - sa));
    }
    case 4: {
      const sa = xs[1][0];
      if (idx < sa) return node3N(f(xs[1], idx), xs[2], xs[3]);
      const sab = sa + xs[2][0];
      if (idx < sab) return node3N(xs[1], f(xs[2], idx - sa), xs[3]);
      return node3N(xs[1], xs[2], f(xs[3], idx - sab));
    }
    default:
      throw new Error('Unreachable');
  }
}

type Ins<A> = [A] | [A, A];
function insertAtE<A>(self: Seq<A>, idx: number, x: A): Seq<A> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
    case 1:
      // handled as part of the initial checks - append/prepend/throw
      throw new Error('Unreachable');
    case 2: {
      const sp = xs.pfx.length;
      if (idx < sp) {
        const ins = insertPrefixE(xs.pfx, idx, x);
        return ins.length === 1
          ? new Deep(xs.size + 1, ins[0], xs.deeper, xs.sfx)
          : new Deep(xs.size + 1, ins[0], prependN(ins[1], xs.deeper), xs.sfx);
      }
      const spm = sp + xs.deeper.size;
      if (idx < spm) {
        const m = insertAtN(xs.deeper, idx - sp, (n, idx) =>
          insertNodeE(n, idx, x),
        );
        return new Deep(xs.size + 1, xs.pfx, m, xs.sfx);
      }
      const ins = insertSuffixE(xs.sfx, idx - spm, x);
      return ins.length === 1
        ? new Deep(xs.size + 1, xs.pfx, xs.deeper, ins[0])
        : new Deep(xs.size + 1, xs.pfx, appendN(xs.deeper, ins[0]), ins[1]);
    }
  }
}
function insertAtN<A>(
  self: Seq<Node<A>>,
  idx: number,
  f: (x: Node<A>, idx: number) => Ins<Node<A>>,
): Seq<Node<A>> {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      throw new Error('Unreachable');
    case 1: {
      const ins = f(xs.value, idx);
      return ins.length === 1
        ? new Single(xs.size + 1, ins[0])
        : new Deep(xs.size + 1, [ins[0]], Empty, [ins[1]]);
    }
    case 2: {
      const sp = digitSizeN(xs.pfx);
      if (idx < sp) {
        const ins = insertPrefixN(xs.pfx, idx, f);
        return ins.length === 1
          ? new Deep(xs.size + 1, ins[0], xs.deeper, xs.sfx)
          : new Deep(xs.size + 1, ins[0], prependN(ins[1], xs.deeper), xs.sfx);
      }
      const spm = sp + xs.deeper.size;
      if (idx < spm) {
        const m = insertAtN(xs.deeper, idx - sp, (n, idx) =>
          insertNodeN(n, idx, f),
        );
        return new Deep(xs.size + 1, xs.pfx, m, xs.sfx);
      }
      const ins = insertSuffixN(xs.sfx, idx - spm, f);
      return ins.length === 1
        ? new Deep(xs.size + 1, xs.pfx, xs.deeper, ins[0])
        : new Deep(xs.size + 1, xs.pfx, appendN(xs.deeper, ins[0]), ins[1]);
    }
  }
}

function insertNodeE<A>(xs: Node<A>, idx: number, x: A): Ins<Node<A>> {
  switch (xs.length) {
    case 3:
      switch (idx) {
        case 0:
          return [node3E(x, xs[1], xs[2])];
        case 1:
          return [node3E(xs[1], x, xs[2])];
        case 2:
          return [node3E(xs[1], xs[2], x)];
        default:
          throw new Error('IndexOutOfBounds');
      }
    case 4:
      switch (idx) {
        case 0:
          return [node2E(x, xs[1]), node2E(xs[2], xs[3])];
        case 1:
          return [node2E(xs[1], x), node2E(xs[2], xs[3])];
        case 2:
          return [node2E(xs[1], xs[2]), node2E(x, xs[3])];
        case 3:
          return [node2E(xs[1], xs[2]), node2E(xs[3], x)];
        default:
          throw new Error('IndexOutOfBounds');
      }
  }
}
function insertNodeN<A>(
  xs: Node<Node<A>>,
  idx: number,
  f: (x: Node<A>, idx: number) => Ins<Node<A>>,
): Ins<Node<Node<A>>> {
  switch (xs.length) {
    case 3:
      if (idx < xs[1][0]) {
        const ins = f(xs[1], idx);
        return ins.length === 1
          ? [node2N(ins[0], xs[2])]
          : [node3N(ins[0], ins[1], xs[2])];
      } else {
        const ins = f(xs[2], idx - xs[1][0]);
        return ins.length === 1
          ? [node2N(xs[1], ins[0])]
          : [node3N(xs[1], ins[0], ins[1])];
      }
    case 4:
      if (idx < xs[1][0]) {
        const ins = f(xs[1], idx);
        return ins.length === 1
          ? [node3N(ins[0], xs[2], xs[3])]
          : [node2N(ins[0], ins[1]), node2N(xs[2], xs[3])];
      }
      if (idx < 2) {
        const ins = f(xs[2], idx - xs[1][0]);
        return ins.length === 1
          ? [node3N(xs[1], ins[0], xs[3])]
          : [node2N(xs[1], ins[0]), node2N(ins[1], xs[3])];
      } else {
        const ins = f(xs[3], idx - xs[1][0] - xs[2][0]);
        return ins.length === 1
          ? [node3N(xs[1], xs[2], ins[0])]
          : [node2N(xs[1], xs[2]), node2N(ins[0], ins[1])];
      }
  }
}

type InsDigNode<A> = [Digit<A>] | [Digit<A>, Node<A>];
function insertPrefixE<A>(xs: Digit<A>, idx: number, x: A): InsDigNode<A> {
  switch (xs.length) {
    case 1:
      return idx < 1 ? [[x, xs[0]]] : [[xs[0], x]];

    case 2:
      switch (idx) {
        case 0:
          return [[x, xs[0], xs[1]]];
        case 1:
          return [[xs[0], x, xs[1]]];
        case 2:
          return [[xs[0], xs[1], x]];
        default:
          throw new Error('IndexOutOfBounds');
      }

    case 3:
      switch (idx) {
        case 0:
          return [[x, xs[0], xs[1], xs[2]]];
        case 1:
          return [[xs[0], x, xs[1], xs[2]]];
        case 2:
          return [[xs[0], xs[1], x, xs[2]]];
        case 3:
          return [[xs[0], xs[1], xs[2], x]];
        default:
          throw new Error('IndexOutOfBounds');
      }
    case 4:
      switch (idx) {
        case 0:
          return [[x, xs[0]], node3E(xs[1], xs[2], xs[3])];
        case 1:
          return [[xs[0], x], node3E(xs[1], xs[2], xs[3])];
        case 2:
          return [[xs[0], xs[1]], node3E(x, xs[2], xs[3])];
        case 3:
          return [[xs[0], xs[1]], node3E(xs[2], x, xs[3])];
        case 4:
          return [[xs[0], xs[1]], node3E(xs[2], xs[3], x)];
        default:
          throw new Error('IndexOutOfBounds');
      }
  }
}
function insertPrefixN<A>(
  xs: Digit<Node<A>>,
  idx: number,
  f: (n: Node<A>, idx: number) => Ins<Node<A>>,
): InsDigNode<Node<A>> {
  switch (xs.length) {
    case 1:
      return [f(xs[0], idx)];

    case 2: {
      const sa = xs[0][0];
      if (idx < sa) {
        const ins = f(xs[0], idx);
        return ins.length === 1 ? [[ins[0], xs[1]]] : [[ins[0], ins[1], xs[1]]];
      }
      const ins = f(xs[1], idx - sa);
      return ins.length === 1 ? [[xs[0], ins[0]]] : [[xs[0], ins[0], ins[1]]];
    }

    case 3: {
      const sa = xs[0][0];
      if (idx < sa) {
        const ins = f(xs[0], idx);
        return ins.length === 1
          ? [[ins[0], xs[1], xs[2]]]
          : [[ins[0], ins[1], xs[1], xs[2]]];
      }
      const sab = sa + xs[1][0];
      if (idx < sab) {
        const ins = f(xs[1], idx - sa);
        return ins.length === 1
          ? [[xs[0], ins[0], xs[2]]]
          : [[xs[0], ins[0], ins[1], xs[2]]];
      }
      const ins = f(xs[2], idx - sab);
      return ins.length === 1
        ? [[xs[0], xs[1], ins[0]]]
        : [[xs[0], xs[1], ins[0], ins[1]]];
    }

    case 4: {
      const sa = xs[0][0];
      if (idx < sa) {
        const ins = f(xs[0], idx);
        return ins.length === 1
          ? [[ins[0], xs[1], xs[2], xs[3]]]
          : [[ins[0], ins[1]], node3N(xs[1], xs[2], xs[3])];
      }
      const sab = sa + xs[1][0];
      if (idx < sab) {
        const ins = f(xs[1], idx - sa);
        return ins.length === 1
          ? [[xs[0], ins[0], xs[2], xs[3]]]
          : [[xs[0], ins[0]], node3N(ins[1], xs[2], xs[3])];
      }
      const sabc = sab + xs[2][0];
      if (idx < sabc) {
        const ins = f(xs[2], idx - sab);
        return ins.length === 1
          ? [[xs[0], xs[1], ins[0], xs[3]]]
          : [[xs[0], xs[1]], node3N(ins[0], ins[1], xs[3])];
      }
      const ins = f(xs[3], idx - sabc);
      return ins.length === 1
        ? [[xs[0], xs[1], xs[2], ins[0]]]
        : [[xs[0], xs[1]], node3N(xs[2], ins[0], ins[1])];
    }
  }
}

type InsNodeDig<A> = [Digit<A>] | [Node<A>, Digit<A>];
function insertSuffixE<A>(xs: Digit<A>, idx: number, x: A): InsNodeDig<A> {
  switch (xs.length) {
    case 1:
      return idx < 1 ? [[x, xs[0]]] : [[xs[0], x]];

    case 2:
      switch (idx) {
        case 0:
          return [[x, xs[0], xs[1]]];
        case 1:
          return [[xs[0], x, xs[1]]];
        case 2:
          return [[xs[0], xs[1], x]];
        default:
          throw new Error('IndexOutOfBounds');
      }

    case 3:
      switch (idx) {
        case 0:
          return [[x, xs[0], xs[1], xs[2]]];
        case 1:
          return [[xs[0], x, xs[1], xs[2]]];
        case 2:
          return [[xs[0], xs[1], x, xs[2]]];
        case 3:
          return [[xs[0], xs[1], xs[2], x]];
        default:
          throw new Error('IndexOutOfBounds');
      }
    case 4:
      switch (idx) {
        case 0:
          return [node3E(x, xs[0], xs[1]), [xs[2], xs[3]]];
        case 1:
          return [node3E(xs[0], x, xs[1]), [xs[2], xs[3]]];
        case 2:
          return [node3E(xs[0], xs[1], x), [xs[2], xs[3]]];
        case 3:
          return [node3E(xs[0], xs[1], xs[2]), [x, xs[3]]];
        case 4:
          return [node3E(xs[0], xs[1], xs[2]), [xs[3], x]];
        default:
          throw new Error('IndexOutOfBounds');
      }
  }
}
function insertSuffixN<A>(
  xs: Digit<Node<A>>,
  idx: number,
  f: (n: Node<A>, idx: number) => Ins<Node<A>>,
): InsNodeDig<Node<A>> {
  switch (xs.length) {
    case 1:
      return [f(xs[0], idx)];

    case 2: {
      const sa = xs[0][0];
      if (idx < sa) {
        const ins = f(xs[0], idx);
        return ins.length === 1 ? [[ins[0], xs[1]]] : [[ins[0], ins[1], xs[1]]];
      }
      const ins = f(xs[1], idx - sa);
      return ins.length === 1 ? [[xs[0], ins[0]]] : [[xs[0], ins[0], ins[1]]];
    }

    case 3: {
      const sa = xs[0][0];
      if (idx < sa) {
        const ins = f(xs[0], idx);
        return ins.length === 1
          ? [[ins[0], xs[1], xs[2]]]
          : [[ins[0], ins[1], xs[1], xs[2]]];
      }
      const sab = sa + xs[1][0];
      if (idx < sab) {
        const ins = f(xs[1], idx - sa);
        return ins.length === 1
          ? [[xs[0], ins[0], xs[2]]]
          : [[xs[0], ins[0], ins[1], xs[2]]];
      }
      const ins = f(xs[2], idx - sab);
      return ins.length === 1
        ? [[xs[0], xs[1], ins[0]]]
        : [[xs[0], xs[1], ins[0], ins[1]]];
    }

    case 4: {
      const sa = xs[0][0];
      if (idx < sa) {
        const ins = f(xs[0], idx);
        return ins.length === 1
          ? [[ins[0], xs[1], xs[2], xs[3]]]
          : [node3N(ins[0], ins[1], xs[1]), [xs[2], xs[3]]];
      }
      const sab = sa + xs[1][0];
      if (idx < sab) {
        const ins = f(xs[1], idx - sa);
        return ins.length === 1
          ? [[xs[0], ins[0], xs[2], xs[3]]]
          : [node3N(xs[0], ins[0], ins[1]), [xs[2], xs[3]]];
      }
      const sabc = sab + xs[2][0];
      if (idx < sabc) {
        const ins = f(xs[2], idx - sab);
        return ins.length === 1
          ? [[xs[0], xs[1], ins[0], xs[3]]]
          : [node3N(xs[0], xs[1], ins[0]), [ins[1], xs[3]]];
      }
      const ins = f(xs[3], idx - sabc);
      return ins.length === 1
        ? [[xs[0], xs[1], xs[2], ins[0]]]
        : [node3N(xs[0], xs[1], xs[2]), [ins[0], ins[1]]];
    }
  }
}

// function delE<A>(self: Seq<A>, idx: number): Seq<A> {}

// type DelSeq<A> =
//   | { tag: 'full'; value: Seq<Node<A>> }
//   | { tag: 'defect'; value: A };
// type Del<A> = { tag: 'full'; value: Node<A> } | { tag: 'defect'; value: A };

// function delN<A>(
//   self: Seq<Node<A>>,
//   idx: number,
//   f: (n: Node<A>, i: number) => Del<A>,
// ): DelSeq<A> {
//   const xs = self as ViewSeq<Node<A>>;
//   switch (xs.tag) {
//     case 0:
//       throw new Error('Unreachable');
//     case 1: {
//       const del = f(xs.value, idx);
//       return del.tag === 'full'
//         ? { tag: 'full', value: new Single(del.value[0], del.value) }
//         : del;
//     }
//     case 2: {
//       const sp = digitSizeN(xs.pfx);
//       if (idx < sp) {
//       }
//       const spm = sp + xs.deeper.size;
//       if (idx < spm) {
//       }
//     }
//   }
// }

// function delNodeE<A>(xs: Node<A>, idx: number): Del<A> {
//   switch (xs.length) {
//     case 3:
//       return idx < 1
//         ? { tag: 'defect', value: xs[2] }
//         : { tag: 'defect', value: xs[1] };
//     case 4:
//       switch (idx) {
//         case 0:
//           return { tag: 'full', value: [2, xs[2], xs[3]] };
//         case 1:
//           return { tag: 'full', value: [2, xs[1], xs[3]] };
//         case 2:
//           return { tag: 'full', value: [2, xs[1], xs[2]] };
//         default:
//           throw new Error('Unreachable');
//       }
//   }
// }
// function delNodeN<A>(
//   xs: Node<Node<Node<A>>>,
//   idx: number,
//   f: (n: Node<Node<A>>, idx: number) => Del<Node<A>>,
// ): Del<Node<Node<A>>> {
//   if (xs.length === 3) {
//     const sa = xs[1][0];
//     if (idx < sa) {
//       const del = f(xs[1], idx);
//       if (del.tag === 'full')
//         return { tag: 'full', value: [xs[0] - 1, del.value, xs[2]] };
//       return xs[2].length === 3
//         ? {
//             tag: 'defect',
//             value: [xs[0] - 1, del.value, xs[2][1], xs[2][2]],
//           }
//         : {
//             tag: 'full',
//             value: [
//               xs[0] - 1,
//               node2N(del.value, xs[2][1]),
//               node2N(xs[2][2], xs[2][3]),
//             ],
//           };
//     }

//     const del = f(xs[2], idx - sa);
//     if (del.tag === 'full')
//       return { tag: 'full', value: [xs[0] - 1, xs[1], del.value] };
//     return xs[1].length === 3
//       ? {
//           tag: 'defect',
//           value: [xs[0] - 1, xs[1][1], xs[1][2], del.value],
//         }
//       : {
//           tag: 'full',
//           value: [
//             xs[0] - 1,
//             node2N(xs[1][1], xs[1][2]),
//             node2N(xs[1][3], del.value),
//           ],
//         };
//   }

//   const sa = xs[1][0];
//   if (idx < sa) {
//     const del = f(xs[1], idx);
//     if (del.tag === 'full')
//       return { tag: 'full', value: [xs[0] - 1, del.value, xs[2], xs[3]] };
//     return {
//       tag: 'full',
//       value:
//         xs[2].length === 3
//           ? [xs[0] - 1, node3N(del.value, xs[2][1], xs[2][2]), xs[3]]
//           : [
//               xs[0] - 1,
//               node2N(del.value, xs[2][1]),
//               node2N(xs[2][2], xs[2][3]),
//               xs[3],
//             ],
//     };
//   }
// }

// function delRebuildMiddleE<A>(
//   s: number,
//   pfx: Digit<A>,
//   m: A,
//   sfx: Digit<A>,
// ): Seq<A> {
//   switch (pfx.length) {
//     case 1:
//       return new Deep(s, [pfx[0], m], Empty, sfx);
//     case 2:
//       return new Deep(s, [pfx[0], pfx[1], m], Empty, sfx);
//     case 3:
//       return new Deep(s, [pfx[0], pfx[1], pfx[2], m], Empty, sfx);
//     case 4:
//       return new Deep(s, [pfx[0]], new Single(3, [3, pfx[1], pfx[2], m]), sfx);
//   }
// }
// function delRebuildMiddleN<A>(
//   s: number,
//   pfx: Digit<Node<A>>,
//   m: Node<A>,
//   sfx: Digit<Node<A>>,
// ): Seq<Node<A>> {
//   switch (pfx.length) {
//     case 1:
//       return new Deep(s, [pfx[0], m], Empty, sfx);
//     case 2:
//       return new Deep(s, [pfx[0], pfx[1], m], Empty, sfx);
//     case 3:
//       return new Deep(s, [pfx[0], pfx[1], pfx[2], m], Empty, sfx);
//     case 4: {
//       const mn = node3N(pfx[1], pfx[2], m);
//       return new Deep(s, [pfx[0]], new Single(mn[0], mn), sfx);
//     }
//   }
// }

function mapRightE<A, B>(self: Seq<A>, f: (a: A) => B): Seq<B> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return xs;
    case 1:
      return new Single(xs.size, f(xs.value));
    case 2: {
      const sfx = mapDigitRight(xs.sfx, f);
      const deeper = mapRightN(xs.deeper, x => mapNodeRight(x, f));
      const pfx = mapDigitRight(xs.pfx, f);
      return new Deep(xs.size, pfx, deeper, sfx);
    }
  }
}
function mapRightN<A, B>(
  self: Seq<Node<A>>,
  f: (a: Node<A>) => Node<B>,
): Seq<Node<B>> {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      return xs;
    case 1:
      return new Single(xs.size, f(xs.value));
    case 2: {
      const sfx = mapDigitRight(xs.sfx, f);
      const deeper = mapRightN(xs.deeper, x => mapNodeRight(x, f));
      const pfx = mapDigitRight(xs.pfx, f);
      return new Deep(xs.size, pfx, deeper, sfx);
    }
  }
}
function mapDigitRight<A, B>(xs: Digit<A>, f: (a: A) => B): Digit<B> {
  switch (xs.length) {
    case 1:
      return [f(xs[0])];
    case 2: {
      const b = f(xs[1]);
      return [f(xs[0]), b];
    }
    case 3: {
      const c = f(xs[2]);
      const b = f(xs[1]);
      return [f(xs[0]), b, c];
    }
    case 4: {
      const d = f(xs[3]);
      const c = f(xs[2]);
      const b = f(xs[1]);
      return [f(xs[0]), b, c, d];
    }
  }
}
function mapNodeRight<A, B>(xs: Node<A>, f: (a: A) => B): Node<B> {
  switch (xs.length) {
    case 3: {
      const b = f(xs[2]);
      return [xs[0], f(xs[1]), b];
    }
    case 4: {
      const c = f(xs[3]);
      const b = f(xs[2]);
      return [xs[0], f(xs[1]), b, c];
    }
  }
}

function reverseMap<A, B>(self: Seq<A>, f: (a: A) => B): Seq<B> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return xs;
    case 1:
      return new Single(xs.size, f(xs.value));
    case 2:
      return new Deep(
        xs.size,
        reverseDigit(xs.sfx, f),
        reverseMap(xs.deeper, n => reverseNode(n, f)),
        reverseDigit(xs.pfx, f),
      );
  }
}
function reverseDigit<A, B>(xs: Digit<A>, f: (a: A) => B): Digit<B> {
  switch (xs.length) {
    case 1:
      return [f(xs[0])];
    case 2:
      return [f(xs[1]), f(xs[0])];
    case 3:
      return [f(xs[2]), f(xs[1]), f(xs[0])];
    case 4:
      return [f(xs[3]), f(xs[2]), f(xs[1]), f(xs[0])];
  }
}
function reverseNode<A, B>(xs: Node<A>, f: (a: A) => B): Node<B> {
  switch (xs.length) {
    case 3:
      return [xs[0], f(xs[2]), f(xs[1])];
    case 4:
      return [xs[0], f(xs[3]), f(xs[2]), f(xs[1])];
  }
}

function concatE<A>(self: Seq<A>, that: Seq<A>): Seq<A> {
  const xs = self as ViewSeq<A>;
  const ys = that as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return ys;
    case 1:
      return ys.prepend(xs.value);
    case 2:
      switch (ys.tag) {
        case 0:
          return xs;
        case 1:
          return xs.append(ys.value);
        case 2:
          return new Deep(
            xs.size + ys.size,
            xs.pfx,
            concatN(xs.deeper, nodesE([...xs.sfx, ...ys.pfx]), ys.deeper),
            ys.sfx,
          );
      }
  }
}
function concatN<A>(
  self: Seq<Node<A>>,
  m: readonly Node<A>[],
  that: Seq<Node<A>>,
): Seq<Node<A>> {
  const xs = self as ViewSeq<Node<A>>;
  const ys = that as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      return m.reduceRight((ys, x) => prependN(x, ys), ys as Seq<Node<A>>);
    case 1:
      return prependN(
        xs.value,
        m.reduceRight((ys, x) => prependN(x, ys), ys as Seq<Node<A>>),
      );
    case 2:
      switch (ys.tag) {
        case 0:
          return m.reduce((xs, x) => appendN(xs, x), xs as Seq<Node<A>>);
        case 1:
          return appendN(
            m.reduce((xs, x) => appendN(xs, x), xs as Seq<Node<A>>),
            ys.value,
          );
        case 2:
          return new Deep(
            xs.size + ys.size + nodesSize(m),
            xs.pfx,
            concatN(xs.deeper, nodesN([...xs.sfx, ...m, ...ys.pfx]), ys.deeper),
            ys.sfx,
          );
      }
  }
}

function unzipWithE<A, B, C>(
  self: Seq<A>,
  f: (a: A) => readonly [B, C],
): [Seq<B>, Seq<C>] {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return [Empty, Empty];
    case 1: {
      const x = f(xs.value);
      return [new Single(xs.size, x[0]), new Single(xs.size, x[1])];
    }
    case 2: {
      const pfx = unzipDigit(xs.pfx, f);
      const deeper = unzipWithN(xs.deeper, xs => unzipNode(xs, f));
      const sfx = unzipDigit(xs.sfx, f);
      return [
        new Deep(xs.size, pfx[0], deeper[0], sfx[0]),
        new Deep(xs.size, pfx[1], deeper[1], sfx[1]),
      ];
    }
  }
}
function unzipWithN<A, B, C>(
  self: Seq<Node<A>>,
  f: (a: Node<A>) => readonly [Node<B>, Node<C>],
): [Seq<Node<B>>, Seq<Node<C>>] {
  const xs = self as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      return [Empty, Empty];
    case 1: {
      const x = f(xs.value);
      return [new Single(xs.size, x[0]), new Single(xs.size, x[1])];
    }
    case 2: {
      const pfx = unzipDigit(xs.pfx, f);
      const deeper = unzipWithN(xs.deeper, xs => unzipNode(xs, f));
      const sfx = unzipDigit(xs.sfx, f);
      return [
        new Deep(xs.size, pfx[0], deeper[0], sfx[0]),
        new Deep(xs.size, pfx[1], deeper[1], sfx[1]),
      ];
    }
  }
}

function unzipNode<A, B, C>(
  xs: Node<A>,
  f: (a: A) => readonly [B, C],
): [Node<B>, Node<C>] {
  switch (xs.length) {
    case 3: {
      const a = f(xs[1]);
      const b = f(xs[2]);
      return [
        [xs[0], a[0], b[0]],
        [xs[0], a[1], b[1]],
      ];
    }
    case 4: {
      const a = f(xs[1]);
      const b = f(xs[2]);
      const c = f(xs[3]);
      return [
        [xs[0], a[0], b[0], c[0]],
        [xs[0], a[1], b[1], c[1]],
      ];
    }
  }
}
function unzipDigit<A, B, C>(
  xs: Digit<A>,
  f: (a: A) => readonly [B, C],
): [Digit<B>, Digit<C>] {
  switch (xs.length) {
    case 1: {
      const a = f(xs[0]);
      return [[a[0]], [a[1]]];
    }
    case 2: {
      const a = f(xs[0]);
      const b = f(xs[1]);
      return [
        [a[0], b[0]],
        [a[1], b[1]],
      ];
    }
    case 3: {
      const a = f(xs[0]);
      const b = f(xs[1]);
      const c = f(xs[2]);
      return [
        [a[0], b[0], c[0]],
        [a[1], b[1], c[1]],
      ];
    }
    case 4: {
      const a = f(xs[0]);
      const b = f(xs[1]);
      const c = f(xs[2]);
      const d = f(xs[3]);
      return [
        [a[0], b[0], c[0], d[0]],
        [a[1], b[1], c[1], d[1]],
      ];
    }
  }
}

function nodesE<A>(xs: readonly A[]): Node<A>[] {
  const sz = xs.length;
  let i = 0;
  const ys: Node<A>[] = [];
  while (sz - i > 4) {
    ys.push(node3E(xs[i], xs[i + 1], xs[i + 2]));
    i += 3;
  }

  switch (sz - i) {
    case 2:
      ys.push(node2E(xs[i], xs[i + 1]));
      break;
    case 3:
      ys.push(node3E(xs[i], xs[i + 1], xs[i + 2]));
      break;
    case 4:
      ys.push(node2E(xs[i], xs[i + 1]), node2E(xs[i + 2], xs[i + 3]));
      break;
  }

  return ys;
}

function nodesN<A>(xs: readonly Node<A>[]): Node<Node<A>>[] {
  const sz = xs.length;
  let i = 0;
  const ys: Node<Node<A>>[] = [];
  while (sz - i > 4) {
    ys.push(node3N(xs[i], xs[i + 1], xs[i + 2]));
    i += 3;
  }

  switch (sz - i) {
    case 2:
      ys.push(node2N(xs[i], xs[i + 1]));
      break;
    case 3:
      ys.push(node3N(xs[i], xs[i + 1], xs[i + 2]));
      break;
    case 4:
      ys.push(node2N(xs[i], xs[i + 1]), node2N(xs[i + 2], xs[i + 3]));
      break;
  }

  return ys;
}

function foldLeftDigit<A, B>(xs: Digit<A>, z: B, f: (b: B, a: A) => B): B {
  switch (xs.length) {
    case 1:
      return f(z, xs[0]);
    case 2:
      return f(f(z, xs[0]), xs[1]);
    case 3:
      return f(f(f(z, xs[0]), xs[1]), xs[2]);
    case 4:
      return f(f(f(f(z, xs[0]), xs[1]), xs[2]), xs[3]);
  }
}

function foldLeftNode<A, B>(xs: Node<A>, z: B, f: (b: B, a: A) => B): B {
  switch (xs.length) {
    case 3:
      return f(f(z, xs[1]), xs[2]);
    case 4:
      return f(f(f(z, xs[1]), xs[2]), xs[3]);
  }
}

function foldRightDigit_<A, B>(xs: Digit<A>, z: B, f: (a: A, b: B) => B): B {
  switch (xs.length) {
    case 1:
      return f(xs[0], z);
    case 2:
      return f(xs[0], f(xs[1], z));
    case 3:
      return f(xs[0], f(xs[1], f(xs[2], z)));
    case 4:
      return f(xs[0], f(xs[1], f(xs[2], f(xs[3], z))));
  }
}

function foldRightNode_<A, B>(xs: Node<A>, z: B, f: (a: A, z: B) => B): B {
  switch (xs.length) {
    case 3:
      return f(xs[1], f(xs[2], z));
    case 4:
      return f(xs[1], f(xs[2], f(xs[3], z)));
  }
}

function foldRightDigit<A, B>(
  xs: Digit<A>,
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> {
  switch (xs.length) {
    case 1:
      return f(xs[0], ez);
    case 2:
      return f(
        xs[0],
        Eval.defer(() => f(xs[1], ez)),
      );
    case 3:
      return f(
        xs[0],
        Eval.defer(() =>
          f(
            xs[1],
            Eval.defer(() => f(xs[2], ez)),
          ),
        ),
      );
    case 4:
      return f(
        xs[0],
        Eval.defer(() =>
          f(
            xs[1],
            Eval.defer(() =>
              f(
                xs[2],
                Eval.defer(() => f(xs[3], ez)),
              ),
            ),
          ),
        ),
      );
  }
}

function foldRightNode<A, B>(
  xs: Node<A>,
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> {
  switch (xs.length) {
    case 3:
      return f(
        xs[1],
        Eval.defer(() => f(xs[2], ez)),
      );
    case 4:
      return f(
        xs[1],
        Eval.defer(() =>
          f(
            xs[2],
            Eval.defer(() => f(xs[3], ez)),
          ),
        ),
      );
  }
}

function foldRightRevDigit<A, B>(
  xs: Digit<A>,
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> {
  switch (xs.length) {
    case 1:
      return f(xs[0], ez);
    case 2:
      return f(
        xs[1],
        Eval.defer(() => f(xs[0], ez)),
      );
    case 3:
      return f(
        xs[2],
        Eval.defer(() =>
          f(
            xs[1],
            Eval.defer(() => f(xs[0], ez)),
          ),
        ),
      );
    case 4:
      return f(
        xs[3],
        Eval.defer(() =>
          f(
            xs[2],
            Eval.defer(() =>
              f(
                xs[1],
                Eval.defer(() => f(xs[0], ez)),
              ),
            ),
          ),
        ),
      );
  }
}

function foldRightRevNode<A, B>(
  xs: Node<A>,
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> {
  switch (xs.length) {
    case 3:
      return f(
        xs[2],
        Eval.defer(() => f(xs[1], ez)),
      );
    case 4:
      return f(
        xs[3],
        Eval.defer(() =>
          f(
            xs[2],
            Eval.defer(() => f(xs[1], ez)),
          ),
        ),
      );
  }
}

function forEachUntilDigit<A>(xs: Digit<A>, f: (a: A) => boolean): boolean {
  switch (xs.length) {
    case 1:
      return f(xs[0]);
    case 2:
      return f(xs[0]) && f(xs[1]);
    case 3:
      return f(xs[0]) && f(xs[1]) && f(xs[2]);
    case 4:
      return f(xs[0]) && f(xs[1]) && f(xs[2]) && f(xs[3]);
  }
}

function forEachUntilNode<A>(xs: Node<A>, f: (a: A) => boolean): boolean {
  switch (xs.length) {
    case 3:
      return f(xs[1]) && f(xs[2]);
    case 4:
      return f(xs[1]) && f(xs[2]) && f(xs[3]);
  }
}

function forEachUntilRDigit<A>(xs: Digit<A>, f: (a: A) => boolean): boolean {
  switch (xs.length) {
    case 1:
      return f(xs[0]);
    case 2:
      return f(xs[1]) && f(xs[0]);
    case 3:
      return f(xs[2]) && f(xs[1]) && f(xs[0]);
    case 4:
      return f(xs[3]) && f(xs[2]) && f(xs[1]) && f(xs[0]);
  }
}

function forEachUntilRNode<A>(xs: Node<A>, f: (a: A) => boolean): boolean {
  switch (xs.length) {
    case 3:
      return f(xs[2]) && f(xs[1]);
    case 4:
      return f(xs[3]) && f(xs[2]) && f(xs[1]);
  }
}

const concat_ = <A>(lhs: Seq<A>, rhs: Seq<A>): Seq<A> => lhs.concat(rhs);
function traverseViaSeqImpl<G, Rhs, A, B>(
  G: Applicative<G>,
  Rhs: TraverseStrategy<G, Rhs>,
  xs: Seq<A>,
  f: (a: A) => Kind<G, [B]>,
): Kind<G, [Seq<B>]> {
  return Rhs.toG(traverseImpl(G, Rhs, xs, f));
}
function traverseImpl<G, Rhs, A, B>(
  G: Applicative<G>,
  Rhs: TraverseStrategy<G, Rhs>,
  self: Seq<A>,
  f: (a: A) => Kind<G, [B]>,
): Kind<Rhs, [Kind<G, [Seq<B>]>]> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return Rhs.toRhs(() => G.pure(Empty));
    case 1:
      return Rhs.toRhs(() =>
        G.map_(f(xs.value), value => new Single(xs.size, value)),
      );
    case 2: {
      const pfxRhs = traverseDigit(G, Rhs, xs.pfx, f);
      const middleRhs = traverseImpl(G, Rhs, xs.deeper, n =>
        Rhs.toG(traverseNode(Rhs, n, f)),
      );
      const sfxRhs = traverseDigit(G, Rhs, xs.sfx, f);

      let middle: Seq<Node<B>>;
      let sfx: Digit<B>;
      return Rhs.map2(
        pfxRhs,
        Rhs.map2(middleRhs, sfxRhs, (m, s) => ((middle = m), (sfx = s))),
        (pfx, _) => new Deep(xs.size, pfx, middle, sfx),
      );
    }
  }
}
function traverseNode<G, Rhs, A, B>(
  Rhs: TraverseStrategy<G, Rhs>,
  xs: Node<A>,
  f: (a: A) => Kind<G, [B]>,
): Kind<Rhs, [Kind<G, [Node<B>]>]> {
  switch (xs.length) {
    case 3:
      return Rhs.map2Rhs(
        f(xs[1]),
        Rhs.toRhs(() => f(xs[2])),
        (a, b) => [xs[0], a, b],
      );
    case 4: {
      let b: B;
      let c: B;
      return Rhs.map2Rhs(
        f(xs[1]),
        Rhs.defer(() =>
          Rhs.map2Rhs(
            f(xs[2]),
            Rhs.toRhs(() => f(xs[3])),
            (x, y) => ((b = x), (c = y)),
          ),
        ),
        (a, _) => [xs[0], a, b, c],
      );
    }
  }
}
function traverseDigit<G, Rhs, A, B>(
  G: Applicative<G>,
  Rhs: TraverseStrategy<G, Rhs>,
  xs: Digit<A>,
  f: (a: A) => Kind<G, [B]>,
): Kind<Rhs, [Kind<G, [Digit<B>]>]> {
  switch (xs.length) {
    case 1:
      return Rhs.toRhs(() => G.map_(f(xs[0]), a => [a]));
    case 2:
      return Rhs.map2Rhs(
        f(xs[0]),
        Rhs.toRhs(() => f(xs[1])),
        (a, b) => [a, b],
      );
    case 3: {
      let b: B;
      let c: B;
      return Rhs.map2Rhs(
        f(xs[0]),
        Rhs.defer(() =>
          Rhs.map2Rhs(
            f(xs[1]),
            Rhs.toRhs(() => f(xs[2])),
            (x, y) => ((b = x), (c = y)),
          ),
        ),
        a => [a, b, c],
      );
    }
    case 4: {
      let b: B;
      let c: B;
      let d: B;
      return Rhs.map2Rhs(
        f(xs[0]),
        Rhs.defer(() =>
          Rhs.map2Rhs(
            f(xs[1]),
            Rhs.defer(() =>
              Rhs.map2Rhs(
                f(xs[2]),
                Rhs.toRhs(() => f(xs[3])),
                (y, w) => ((c = y), (d = w)),
              ),
            ),
            (x, _) => (b = x),
          ),
        ),
        a => [a, b, c, d],
      );
    }
  }
}

function traverseFilterViaSeqImpl<G, F, Rhs, A, B>(
  G: Applicative<G>,
  F: Foldable<F>,
  Rhs: TraverseStrategy<G, Rhs>,
  xs: Kind<F, [A]>,
  f: (a: A, i: number) => Kind<G, [Option<B>]>,
): Kind<G, [Seq<B>]> {
  if (F.isEmpty(xs)) return G.pure(Empty);

  // Max width of the tree -- max depth log_128(c.size)
  const width = 128;

  const loop = (start: number, end: number): Kind<Rhs, [Kind<G, [Seq<B>]>]> => {
    if (end - start <= width) {
      // We've entered leaves of the tree
      let first = Rhs.toRhs(() =>
        G.map_(f(F.elem_(xs, end - 1).get, end - 1), opt =>
          opt.nonEmpty ? Seq(opt.get) : Seq.empty,
        ),
      );
      for (let idx = end - 2; start <= idx; idx--) {
        const a = F.elem_(xs, idx).get;
        const right = first;
        const idx0 = idx;
        first = Rhs.defer(() =>
          Rhs.map2Rhs(f(a, idx0), right, (opt, tl) =>
            opt.nonEmpty ? tl.prepend(opt.get) : tl,
          ),
        );
      }
      return first;
    } else {
      const step = ((end - start) / width) | 0;

      let fseq = Rhs.defer(() => loop(start, start + step));

      for (
        let start0 = start + step, end0 = start0 + step;
        start0 < end;
        start0 += step, end0 += step
      ) {
        const start1 = start0;
        const end1 = Math.min(end, end0);
        const right = Rhs.defer(() => loop(start1, end1));
        fseq = Rhs.map2(fseq, right, concat_);
      }
      return fseq;
    }
  };

  return Rhs.toG(loop(0, F.size(xs)));
}

function pullL<A>(s: number, m: Seq<Node<A>>, sfx: Digit<A>): Seq<A> {
  const v = viewLN(m);
  return v == null
    ? digitToTree(s, sfx)
    : new Deep(s, nodeToDigit(v[0]), v[1], sfx);
}

function pullR<A>(s: number, pfx: Digit<A>, m: Seq<Node<A>>): Seq<A> {
  const v = viewRN(m);
  return v == null
    ? digitToTree(s, pfx)
    : new Deep(s, pfx, v[0], nodeToDigit(v[1]));
}

function viewLE<A>(m: Seq<A>): [A, Seq<A>] | undefined {
  const xs = m as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return undefined;
    case 1:
      return [xs.value, Empty];
    case 2: {
      const z = xs.pfx[0];
      switch (xs.pfx.length) {
        case 1:
          return [z, pullL(xs.size - 1, xs.deeper, xs.sfx)];
        case 2:
          return [z, new Deep(xs.size - 1, [xs.pfx[1]], xs.deeper, xs.sfx)];
        case 3:
          return [
            z,
            new Deep(xs.size - 1, [xs.pfx[1], xs.pfx[2]], xs.deeper, xs.sfx),
          ];
        case 4:
          return [
            z,
            new Deep(
              xs.size - 1,
              [xs.pfx[1], xs.pfx[2], xs.pfx[3]],
              xs.deeper,
              xs.sfx,
            ),
          ];
      }
    }
  }
}
function viewLN<A>(m: Seq<Node<A>>): [Node<A>, Seq<Node<A>>] | undefined {
  const xs = m as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      return undefined;
    case 1:
      return [xs.value, Empty];
    case 2: {
      const z = xs.pfx[0];
      switch (xs.pfx.length) {
        case 1:
          return [z, pullL(xs.size - z[0], xs.deeper, xs.sfx)];
        case 2:
          return [z, new Deep(xs.size - z[0], [xs.pfx[1]], xs.deeper, xs.sfx)];
        case 3:
          return [
            z,
            new Deep(xs.size - z[0], [xs.pfx[1], xs.pfx[2]], xs.deeper, xs.sfx),
          ];
        case 4:
          return [
            z,
            new Deep(
              xs.size - z[0],
              [xs.pfx[1], xs.pfx[2], xs.pfx[3]],
              xs.deeper,
              xs.sfx,
            ),
          ];
      }
    }
  }
}
function viewRE<A>(m: Seq<A>): [Seq<A>, A] | undefined {
  const xs = m as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      return undefined;
    case 1:
      return [Empty, xs.value];
    case 2: {
      const z = xs.sfx[xs.sfx.length - 1];
      switch (xs.sfx.length) {
        case 1:
          return [pullR(xs.size - 1, xs.pfx, xs.deeper), z];
        case 2:
          return [new Deep(xs.size - 1, xs.pfx, xs.deeper, [xs.sfx[0]]), z];
        case 3:
          return [
            new Deep(xs.size - 1, xs.pfx, xs.deeper, [xs.sfx[0], xs.sfx[1]]),
            z,
          ];
        case 4:
          return [
            new Deep(xs.size - 1, xs.pfx, xs.deeper, [
              xs.sfx[0],
              xs.sfx[1],
              xs.sfx[2],
            ]),
            z,
          ];
      }
    }
  }
}
function viewRN<A>(m: Seq<Node<A>>): [Seq<Node<A>>, Node<A>] | undefined {
  const xs = m as ViewSeq<Node<A>>;
  switch (xs.tag) {
    case 0:
      return undefined;
    case 1:
      return [Empty, xs.value];
    case 2: {
      const z = xs.sfx[xs.sfx.length - 1];
      switch (xs.sfx.length) {
        case 1:
          return [pullR(xs.size - z[0], xs.pfx, xs.deeper), z];
        case 2:
          return [new Deep(xs.size - z[0], xs.pfx, xs.deeper, [xs.sfx[0]]), z];
        case 3:
          return [
            new Deep(xs.size - z[0], xs.pfx, xs.deeper, [xs.sfx[0], xs.sfx[1]]),
            z,
          ];
        case 4:
          return [
            new Deep(xs.size - z[0], xs.pfx, xs.deeper, [
              xs.sfx[0],
              xs.sfx[1],
              xs.sfx[2],
            ]),
            z,
          ];
      }
    }
  }
}

function* iterator<A>(self: Seq<A>): Generator<A, void, undefined> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      break;
    case 1:
      yield xs.value;
      break;
    case 2:
      yield* xs.pfx;
      for (const n of iterator(xs.deeper)) {
        yield* nodeIterator(n);
      }
      yield* xs.sfx;
      break;
  }
}
function* nodeIterator<A>(xs: Node<A>): Generator<A, void, undefined> {
  switch (xs.length) {
    case 3:
      yield xs[1];
      yield xs[2];
      break;
    case 4:
      yield xs[1];
      yield xs[2];
      yield xs[3];
      break;
  }
}

function* reverseIterator<A>(self: Seq<A>): Generator<A, void, undefined> {
  const xs = self as ViewSeq<A>;
  switch (xs.tag) {
    case 0:
      break;
    case 1:
      yield xs.value;
      break;
    case 2:
      yield* digitReverseIterator(xs.sfx);
      for (const n of reverseIterator(xs.deeper)) {
        yield* nodeReversedIterator(n);
      }
      yield* digitReverseIterator(xs.pfx);
      break;
  }
}
function* digitReverseIterator<A>(xs: Digit<A>): Generator<A, void, undefined> {
  switch (xs.length) {
    case 1:
      yield xs[0];
      break;
    case 2:
      yield xs[1];
      yield xs[0];
      break;
    case 3:
      yield xs[2];
      yield xs[1];
      yield xs[0];
      break;
    case 4:
      yield xs[3];
      yield xs[2];
      yield xs[1];
      yield xs[0];
      break;
  }
}
function* nodeReversedIterator<A>(xs: Node<A>): Generator<A, void, undefined> {
  switch (xs.length) {
    case 3:
      yield xs[2];
      yield xs[1];
      break;
    case 4:
      yield xs[3];
      yield xs[2];
      yield xs[1];
      break;
  }
}

Seq.Eq = cached(<A>(E: Eq<A>) =>
  Eq.of<Seq<A>>({ equals: (xs, ys) => xs.equals(ys, E) }),
);

Seq.EqK = null as any as EqK<SeqF>;
Seq.Monad = null as any as Monad<SeqF>;
Seq.MonadPlus = null as any as MonadPlus<SeqF>;
Seq.Alternative = null as any as Alternative<SeqF>;
Seq.Foldable = null as any as Foldable<SeqF>;
Seq.Traversable = null as any as Traversable<SeqF>;
Seq.TraversableFilter = null as any as TraversableFilter<SeqF>;
Seq.CoflatMap = null as any as CoflatMap<SeqF>;
Seq.Unzip = null as any as Unzip<SeqF>;

const seqEqK = lazy(() => EqK.of<SeqF>({ liftEq: Seq.Eq }));

const seqMonoidK = lazy(() =>
  MonoidK.of<SeqF>({
    emptyK: () => Seq.empty,
    combineK_: (xs, ys) => xs.concat(ys),
    combineKEval_: (xs, eys) =>
      xs.isEmpty ? eys : eys.map(ys => xs.concat(ys)),
  }),
);

const seqFunctor = lazy(() =>
  Functor.of<SeqF>({
    map_: (xs, f) => xs.map(f),
  }),
);

const seqFunctorFilter = lazy(() =>
  FunctorFilter.of<SeqF>({
    ...seqFunctor(),
    mapFilter_: (xs, f) => xs.collect(f),
    collect_: (xs, f) => xs.collect(f),
  }),
);

const seqApplicative = lazy(() =>
  Applicative.of<SeqF>({
    ...seqFunctor(),
    pure: Seq.singleton,
    ap_: (ff, fa) => ff.map2(fa, (f, a) => f(a)),
    map2_: (xs, ys, f) => xs.map2(ys, f),
    map2Eval_: (xs, ys, f) => xs.map2Eval(ys, f),
  }),
);

const seqAlternative = lazy(() =>
  Alternative.of<SeqF>({
    ...seqApplicative(),
    ...seqMonoidK(),
  }),
);

const seqMonad = lazy(() =>
  Monad.of<SeqF>({
    ...seqApplicative(),
    flatMap_: (xs, f) => xs.flatMap(f),
    tailRecM_: Seq.tailRecM_,
  }),
);

const seqMonadPlus = lazy(() =>
  MonadPlus.of<SeqF>({
    ...seqMonad(),
    ...seqFunctorFilter(),
    ...seqAlternative(),
  }),
);

const seqFoldable = lazy(() =>
  Foldable.of<SeqF>({
    foldLeft_: (xs, z, f) => xs.foldLeft(z, f),
    foldRight_: (xs, ez, f) => xs.foldRight(ez, f),
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(xs: Seq<A>, f: (a: A) => M) =>
        xs.foldMap(M, f),
    foldMapK_:
      <F>(F: MonoidK<F>) =>
      <A, B>(xs: Seq<A>, f: (a: A) => Kind<F, [B]>) =>
        xs.foldMapK(F, f),

    iterator: xs => xs.iterator,
    toArray: xs => xs.toArray,

    elem_: (xs, idx) => xs.getOption(idx),
    count_: (xs, f) => xs.count(f),
    all_: (xs, f) => xs.all(f),
    any_: (xs, f) => xs.any(f),
    isEmpty: xs => xs.isEmpty,
    nonEmpty: xs => xs.nonEmpty,
    size: xs => xs.size,
  }),
);

const seqTraversable = lazy(() =>
  Traversable.of<SeqF>({
    ...seqFoldable(),
    ...seqFunctor(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(xs: Seq<A>, f: (a: A) => Kind<G, [B]>) =>
        xs.traverse(G, f),
  }),
);

const seqTraversableFilter = lazy(() =>
  TraversableFilter.of<SeqF>({
    ...seqTraversable(),
    ...seqFunctorFilter(),
    traverseFilter_:
      <G>(G: Applicative<G>) =>
      <A, B>(xs: Seq<A>, f: (a: A) => Kind<G, [Option<B>]>) =>
        xs.traverseFilter(G, f),
  }),
);

const seqCoflatMap = lazy(() =>
  CoflatMap.of<SeqF>({
    ...seqFunctor(),
    coflatMap_: (xs, f) => xs.coflatMap(f),
  }),
);

const seqUnzip = lazy(() =>
  Unzip.of<SeqF>({
    ...seqFunctor(),
    zipWith_: (xs, ys, f) => xs.zipWith(ys, f),
    zip_: (xs, ys) => xs.zip(ys),
    unzip: xs => xs.unzip(),
    unzipWith_: (xs, f) => xs.unzipWith(f),
  }),
);

Object.defineProperty(Seq, 'EqK', {
  get() {
    return seqEqK();
  },
});
Object.defineProperty(Seq, 'Monad', {
  get() {
    return seqMonad();
  },
});
Object.defineProperty(Seq, 'MonadPlus', {
  get() {
    return seqMonadPlus();
  },
});
Object.defineProperty(Seq, 'Alternative', {
  get() {
    return seqAlternative();
  },
});
Object.defineProperty(Seq, 'Foldable', {
  get() {
    return seqFoldable();
  },
});
Object.defineProperty(Seq, 'Traversable', {
  get() {
    return seqTraversable();
  },
});
Object.defineProperty(Seq, 'TraversableFilter', {
  get() {
    return seqTraversableFilter();
  },
});
Object.defineProperty(Seq, 'CoflatMap', {
  get() {
    return seqCoflatMap();
  },
});
Object.defineProperty(Seq, 'Unzip', {
  get() {
    return seqUnzip();
  },
});

// -- HKT

export interface SeqF extends TyK<[unknown]> {
  [$type]: Seq<TyVar<this, 0>>;
}
