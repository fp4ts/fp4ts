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
import {
  Align,
  Alternative,
  Applicative,
  CoflatMap,
  Compare,
  Either,
  Eq,
  EqK,
  Foldable,
  Functor,
  FunctorFilter,
  Ior,
  isIdentityTC,
  Left,
  Monad,
  MonadPlus,
  Monoid,
  MonoidK,
  None,
  Option,
  Ord,
  Right,
  Some,
  Traversable,
  TraversableFilter,
  Unzip,
} from '@fp4ts/cats';

import { View } from './view';
import { List, ListBuffer } from './list';
import { OrdMap } from './ord-map';
import { Seq } from './seq';
import { Set as CSet } from './set';

/**
 * Immutable, strict, finite sequence of elements `A`.
 */
export type Vector<A> = _Vector<A>;
export const Vector = function <A>(...xs: A[]): Vector<A> {
  return Vector.fromArray(xs);
};

Vector.singleton = <A>(x: A): Vector<A> => new _Vector([x], 0, 1);

Vector.fromList = <A>(xs: List<A>): Vector<A> => Vector.fromArray(xs.toArray);

Vector.fromArray = <A>(xs: A[]): Vector<A> => new _Vector(xs, 0, xs.length);

Vector.fromIterator = <A>(it: Iterator<A>): Vector<A> => {
  const xs: A[] = [];
  for (let i = it.next(); !i.done; i = it.next()) {
    xs.push(i.value);
  }
  return Vector.fromArray(xs);
};

Vector.fromFoldable = <F, A>(F: Foldable<F>, fa: Kind<F, [A]>): Vector<A> =>
  fa instanceof _Vector ? fa : Vector.fromArray(F.toArray(fa));

class _Vector<out A> {
  readonly __void!: void;

  public constructor(
    private readonly xs: readonly A[],
    private readonly start: number,
    private readonly end: number,
  ) {}

  /**
   * _O(1)_ Extracts the first element of the vector, which must be non-empty.
   *
   * @note This function is partial.
   *
   * @see {@link headOption} for a safe variant
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).head
   * // 1
   *
   * > Vector.empty.head
   * // Uncaught Error: Vector.empty: head
   * ```
   */
  public get head(): A {
    return this.isEmpty
      ? throwError(new Error('Vector.empty: head'))
      : this.xs[this.start];
  }

  /**
   * _O(1)_ Safe version of the `head` which optionally returns the first element
   * of the vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).head
   * // Some(1)
   *
   * > Vector.empty.head
   * // None
   * ```
   */
  public get headOption(): Option<A> {
    return this.isEmpty ? None : Some(this.xs[this.start]);
  }

  /**
   * _O(1)_ Extracts the elements of the vector which come after the initial
   * head.
   *
   * `xs.tail` is equivalent to `xs.drop(1)`.
   *
   * As such, it is safe to perform `tail` on empty sequences as well.
   *
   * @examples
   *
   *```typescript
   * > Vector(1, 2, 3).tail
   * // Vector(2, 3)
   *
   * > Vector(1).tail
   * // Vector()
   *
   * > Vector.empty.tail
   * // Vector()
   * ```
   */
  public get tail(): Vector<A> {
    return this.drop(1);
  }

  /**
   * _O(1)_ Optionally decompose the vector into its head and tail. Returns
   * {@link None} if empty.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).uncons
   * // Some([1, Vector(2, 3)])
   *
   * > Vector(42).uncons
   * // Some([42, Vector()])
   *
   * > Vector.empty.uncons
   * // None
   * ```
   */
  public get uncons(): Option<[A, Vector<A>]> {
    return this.isEmpty ? None : Some([this.head, this.tail]);
  }

  /**
   * _O(1)_ Extracts the last element of the vector, which must be non-empty.
   *
   * @note This is a partial function.
   *
   * @see {@link lastOption} for a safe variant
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).last
   * // 3
   *
   * > Vector(1).last
   * // 1
   *
   * > Vector.empty.last
   * // Uncaught Error: Vector.empty: last
   * ```
   */
  public get last(): A {
    if (this.isEmpty) throw new Error('Vector.empty: last');
    return this.xs[this.end - 1];
  }

  /**
   * _O(1)_ Optionally extracts the last element of the vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).last
   * // Some(3)
   *
   * > Vector(1).last
   * // Some(1)
   *
   * > Vector.empty.last
   * // None
   * ```
   */
  public get lastOption(): Option<A> {
    return this.isEmpty ? None : Some(this.xs[this.end - 1]);
  }

  /**
   * _O(1)_ Extract all elements of the vector expect from the last one.
   *
   * `xs.init` is equivalent to `xs.dropRight(1)`
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).init
   * // Vector(1, 2)
   *
   * > Vector(1).init
   * // Vector()
   *
   * > Vector.empty.init
   * // Vector()
   * ```
   */
  public get init(): Vector<A> {
    return this.dropRight(1);
  }

  /**
   * _O(1)_ Optionally extract init and the last element of the vector.
   */
  public get popLast(): Option<[A, Vector<A>]> {
    return this.isEmpty ? None : Some([this.last, this.init]);
  }

  /**
   * _O(1)_ Returns `true` if the vector is empty, or `false` otherwise.
   *
   * @examples
   *
   * ```typescript
   * > Vector.empty.isEmpty
   * // true
   *
   * > Vector(42).isEmpty
   * // false
   * ```
   */
  public get isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * _O(1)_ Negation of {@link isEmpty}:
   *
   * ```typescript
   * xs.nonEmpty == !xs.isEmpty
   * ```
   */
  public get nonEmpty(): boolean {
    return this.size !== 0;
  }

  /**
   * _O(1)_ Returns the size of the vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector.empty.size
   * // 0
   *
   * > Vector(42)
   * // 1
   *
   * > Vector(1, 2, 3)
   * // 3
   * ```
   */
  public get size(): number {
    return this.end - this.start;
  }

  /**
   * _O(1)_ Return a view of the vector's elements. This function is typically
   * used to "fuse" transformations without creating intermediate structures:
   *
   * ```typescript
   * xs.map(f).filter(p) === xs.view.map(f).filter(p).toVector
   * ```
   */
  public get view(): View<A> {
    return View.build((ez, g) => this.foldRight(ez, g));
  }

  /**
   * _O(1)_ Right-to-left dual to {@link view}.
   *
   * ```typescript
   * xs.reverse.map(f).filter(p) === xs.viewRight.map(f).filter(p).toSeq
   * ```
   */
  public get viewRight(): View<A> {
    return View.build((ez, g) => this.foldRightReversed(ez, g));
  }

  /**
   * _O(n)_ Converts the sequence into an array.
   */
  public get toArray(): A[] {
    return this.xs.slice(this.start, this.end);
  }

  /**
   * _O(n)_ Converts the sequence into a list.
   */
  public get toList(): List<A> {
    return this.foldLeft(new ListBuffer<A>(), (b, x) => b.addOne(x)).toList;
  }

  /**
   * _O(n)_ Converts the sequence into a sequence.
   */
  public get toSeq(): Seq<A> {
    const st = this.start;
    const xs = this.xs;
    return Seq.fromFunction(this.size, i => xs[i + st]);
  }

  /**
   * _O(1)_ Convert the vector into an {@link Option}, returning `Some(head)` in case
   * of an non-empty vector, or `None` otherwise.
   *
   * `xs.toOption` is equivalent to `xs.headOption`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).toOption
   * // Some(1)
   *
   * > Vector(42).toOption
   * // Some(42)
   *
   * > Vector.empty.toOption
   * // None
   * ```
   */
  public get toOption(): Option<A> {
    return this.headOption;
  }

  /**
   * _O(1)_ Convert the vector into an {@link Either}, returning `Right(head)` in
   * case of an non-empty vector, or `Left(left)` otherwise.
   *
   * Equivalent to:
   *
   * `xs.toRight(left)` is equivalent to `xs.toOption.toRight(left)`
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).toRight(() => 42)
   * // Right(1)
   *
   * > Vector(1).toRight(() => 42)
   * // Right(1)
   *
   * > Vector.empty.toRight(() => 42)
   * // Left(42)
   * ```
   */
  public toRight<E>(left: () => E): Either<E, A> {
    return this.isEmpty ? Left(left()) : Right(this.head);
  }

  /**
   * _O(1)_ Convert the vector into an {@link Either}, returning `Left(head)` in
   * case of an non-empty vector, or `Right(right)` otherwise.
   *
   * Equivalent to:
   *
   * `xs.toLeft(right)` is equivalent to `xs.toOption.toLeft(right)`
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).toLeft(() => 42)
   * // Left(1)
   *
   * > Vector(1).toLeft(() => 42)
   * // Left(1)
   *
   * > Vector.empty.toLeft(() => 42)
   * // Right(42)
   * ```
   */
  public toLeft<B>(right: () => B): Either<A, B> {
    return this.isEmpty ? Right(right()) : Left(this.head);
  }

  /**
   * _O(n)_ Converts the vector into a {@link Set} using provided `Ord<A>` instance,
   * or {@link Ord.fromUniversalCompare} if not provided.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).toSet()
   * // Set(1, 2, 3)
   *
   * > Vector(1, 2, 2, 3, 3).toSet()
   * // Set(1, 2, 3)
   *
   * > Vector.empty.toSet()
   * // Set()
   * ```
   */
  public toSet<A>(
    this: Seq<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): CSet<A> {
    return this.foldLeft(CSet.empty as CSet<A>, (s, x) => s.insert(x, O));
  }

  /**
   * _O(n)_ Converts the vector of tuples `[K, V] into a {@link Map} using
   * provided `Ord<A>` instance, or {@link Ord.fromUniversalCompare} if not
   * provided.
   *
   * @examples
   *
   * ```typescript
   * > Vector([1, 'a'], [2, 'b'], [3, 'c']).toMap()
   * // OrdMap([1, 'a'], [2, 'b'], [3, 'c'])
   *
   * > Vector([1, 'a'], [2, 'b'], [2, 'c'], [3, 'd'], [3, 'd']).toMap()
   * // OrdMap([1, 'a'], [2, 'c'], [3, 'd'])
   *
   * > Vector.empty.toMap()
   * // OrdMap()
   * ```
   */
  public toMap<K, V>(
    this: Seq<[K, V]>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): OrdMap<K, V> {
    return this.foldLeft(OrdMap.empty as OrdMap<K, V>, (s, [k, v]) =>
      s.insert(k, v, O),
    );
  }

  /**
   * _O(1)_ Returns an iterator of the elements of the vector.
   *
   * @examples
   *
   * ```typescript
   * > const it = Vector.empty.iterator
   * > it.next()
   * // { value: undefined, done: true }
   *
   * > const it = Vector(1, 2).iterator
   * > it.next()
   * // { value: 1, done: false }
   * > it.next()
   * // { value: 2, done: false }
   * > it.next()
   * // { value: undefined, done: true }
   * ```
   */
  public get iterator(): Iterator<A> {
    let idx = this.start;
    const end = this.end;
    const xs = this.xs;
    return {
      next() {
        return idx >= end
          ? { done: true, value: undefined }
          : { done: false, value: xs[idx++] };
      },
    };
  }

  public [Symbol.iterator](): Iterator<A> {
    return this.iterator;
  }

  /**
   * _O(n)_ Returns a reversed iterator of the elements of the vector.
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
    let idx = this.end - 1;
    const start = this.start;
    const xs = this.xs;
    return {
      next() {
        return idx < start
          ? { done: true, value: undefined }
          : { done: false, value: xs[idx--] };
      },
    };
  }

  /**
   * _O(n)_ Prepend an element `x` at the beginning of the vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector.empty.prepend(42)
   * // Vector(42)
   *
   * > Vector(1, 2, 3).prepend(42)
   * // Vector(42, 1, 2, 3)
   * ```
   */
  public prepend<A>(this: Vector<A>, x: A): Vector<A> {
    const sz = this.size;
    const start = this.start;
    const xs = this.xs;
    const ys = new Array<A>(sz + 1);
    ys[0] = x;
    for (let i = 0; i < sz; i++) {
      ys[i + 1] = xs[i + start];
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(n)_ Appends an element `x` at the end of the vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector.empty.append(42)
   * // Vector(42)
   *
   * > Vector(1, 2, 3).append(42)
   * // Vector(1, 2, 3, 42)
   * ```
   */
  public append<A>(this: Vector<A>, x: A): Vector<A> {
    const sz = this.size;
    const start = this.start;
    const xs = this.xs;
    const ys = new Array<A>(sz + 1);
    for (let i = 0; i < sz; i++) {
      ys[i] = xs[i + start];
    }
    ys[sz] = x;
    return Vector.fromArray(ys);
  }

  /**
   * _O(n)_ Returns `true` if for all elements of the vector satisfy the
   * predicate `p`, or `false` otherwise.
   *
   * ```typescript
   * xs.all(p) === !xs.any(x => !p(x))
   * ```
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).all(() => true)
   * // true
   *
   * > Vector(1, 2, 3).all(x => x < 3)
   * // false
   *
   * > Vector.empty.all(() => false)
   * // true
   * ```
   */
  public all<B extends A>(p: (a: A) => a is B): this is Vector<B>;
  public all(p: (a: A) => boolean): boolean;
  public all(p: (a: A) => boolean): boolean {
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      if (!p(xs[i])) return false;
    }
    return true;
  }

  /**
   * _O(n)_ Returns `true` if for at least one element of the vector satisfy
   * the predicate `p`, or `false` otherwise.
   *
   * ```typescript
   * xs.any(p) == !xs.all(x => !p(x))
   * ```
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).any(() => true)
   * // true
   *
   * > Vector(1, 2, 3).any(x => x < 10)
   * // false
   *
   * > Vector.empty.any(() => true)
   * // false
   * ```
   */
  public any(p: (a: A) => boolean): boolean {
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      if (p(xs[i])) return true;
    }
    return false;
  }

  /**
   * _O(n)_ Returns number of elements of the vector for which satisfy the
   * predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).count(x => x >= 2)
   * // 2
   *
   * > Vector.empty.count(x => true)
   * // 0
   * ```
   */
  public count(p: (a: A) => boolean): number {
    let count = 0;
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      if (p(xs[i])) count++;
    }
    return count;
  }

  /**
   * _O(1)_ Returns prefix of length `i` of the given seq if the size of the
   * vector is `< i`, otherwise the vector itself.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4).take(3)
   * // Vector(1, 2, 3)
   *
   * > Vector(1, 2).take(3)
   * // Vector(1, 2)
   *
   * > Vector.empty.take(3)
   * // Vector()
   *
   * > Vector(1, 2).take(-1)
   * // Vector()
   * ```
   */
  public take(i: number): Vector<A> {
    if (i <= 0) return Vector.empty;
    if (i > this.size) return this;
    return new _Vector(this.xs, this.start, this.start + i);
  }

  /**
   * _O(1)_ Returns suffix of the given vector after the first `i` elements.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4).drop(3)
   * // Vector(3)
   *
   * > Vector(1, 2).drop(3)
   * // Vector(1, 2)
   *
   * > Vector.empty.drop(3)
   * // Vector()
   *
   * > Vector(1, 2).drop(-1)
   * // Vector(1, 2)
   * ```
   */
  public drop(i: number): Vector<A> {
    if (i <= 0) return this;
    if (i > this.size) return Vector.empty;
    return new _Vector(this.xs, this.start + i, this.end);
  }

  /**
   * Combination of `drop` and `take`, equivalent to:
   *
   * ```typescript
   * xs.slice(from, until) === xs.drop(from).take(until - from);
   * ```
   */
  public slice(from: number, until: number): Vector<A> {
    const start = Math.max(this.start, this.start + from);
    const end = Math.min(this.start + until, this.end);
    return start >= end ? Vector.empty : new _Vector(this.xs, start, end);
  }

  /**
   * _O(1)_ Return a tuple where the first element if the vectors's prefix of
   * size `i` and the second element is its remainder.
   *
   * `xs.splitAt(i)` is equivalent to `[xs.take(i), xs.drop(i)]`
   *
   * ```typescript
   * > Vector(1, 2, 3).splitAt(1)
   * // [Vector(1), Vector(2, 3)]
   * ```
   */
  public splitAt(i: number): [Vector<A>, Vector<A>] {
    if (i <= 0) return [Vector.empty, this];
    if (i >= this.size) return [this, Vector.empty];
    return [
      new _Vector(this.xs, this.start, this.start + i),
      new _Vector(this.xs, this.start + i, this.end),
    ];
  }

  /**
   * _O(i)_ where `i` is the prefix length. Returns a longest prefix of elements
   * satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4, 1, 2, 3, 4).takeWhile(x => x < 3)
   * // Vector(1, 2)
   *
   * > Vector(1, 2, 3).takeWhile(x => x < 5)
   * // Vector(1, 2, 3)
   *
   * > Vector(1, 2, 3).takeWhile(x => x < 0)
   * // Vector()
   * ```
   */
  public takeWhile<B extends A>(p: (a: A) => a is B): Vector<B>;
  public takeWhile(p: (a: A) => boolean): Vector<A>;
  public takeWhile(p: (a: A) => boolean): Vector<A> {
    const idxOpt = this.findIndex(x => !p(x));
    return idxOpt.nonEmpty ? this.take(idxOpt.get) : this;
  }

  /**
   * _O(i)_ where `i` is the prefix length. Returns a remainder of the vector after
   * removing its longer prefix satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4, 1, 2, 3, 4).dropWhile(x => x < 3)
   * // Vector(3, 4, 1, 2, 3, 4)
   *
   * > Vector(1, 2, 3).dropWhile(x => x < 5)
   * // Vector()
   *
   * > Vector(1, 2, 3).dropWhile(x => x < 0)
   * // Vector(1, 2, 3)
   * ```
   */
  public dropWhile(p: (a: A) => boolean): Vector<A> {
    const idxOpt = this.findIndex(x => !p(x));
    return idxOpt.nonEmpty ? this.drop(idxOpt.get) : Vector.empty;
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
   * > Vector(1, 2, 3, 4, 1, 2, 3, 4).span(x => x < 3)
   * // [Vector(1, 2), Vector(3, 4, 1, 2, 3, 4)]
   *
   * > Vector(1, 2, 3).span(_ => true)
   * // [Vector(1, 2, 3), Vector()]
   *
   * > Vector(1, 2, 3).span(_ => false)
   * // [Vector(), Vector(1, 2, 3)]
   * ```
   */
  public span<B extends A>(p: (a: A) => a is B): [Vector<B>, Vector<A>];
  public span(p: (a: A) => boolean): [Vector<A>, Vector<A>];
  public span(p: (a: A) => boolean): [Vector<A>, Vector<A>] {
    const idxOpt = this.findIndex(x => !p(x));
    return idxOpt.nonEmpty ? this.splitAt(idxOpt.get) : [this, Vector.empty];
  }

  /**
   *  _O(1)_ Returns suffix of length `i` of the given vector if the size of the
   * vector is `< i`, otherwise the vector itself.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4).takeRight(3)
   * // Vector(2, 3, 4)
   *
   * > Vector(1, 2).takeRight(3)
   * // Vector(1, 2)
   *
   * > Vector.empty.takeRight(3)
   * // Vector()
   *
   * > Vector(1, 2).takeRight(-1)
   * // Vector()
   * ```
   */
  public takeRight(i: number): Vector<A> {
    if (i <= 0) return Vector.empty;
    if (i > this.size) return this;
    return new _Vector(this.xs, this.end - i, this.end);
  }

  /**
   *  _O(1)_ Returns prefix of the given vector after the last `i` elements.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4).dropRight(3)
   * // Vector(1)
   *
   * > Vector(1, 2).dropRight(3)
   * // Vector(1, 2)
   *
   * > Vector.empty.dropRight(3)
   * // Vector()
   *
   * > Vector(1, 2).dropRight(-1)
   * // Vector(1, 2)
   * ```
   */
  public dropRight(i: number): Vector<A> {
    if (i <= 0) return this;
    if (i > this.size) return Vector.empty;
    return new _Vector(this.xs, this.start, this.end - i);
  }

  /**
   * _O(i)_ where `i` is the suffix length. Returns a longest suffix of elements
   * satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4, 1, 2, 3, 4).takeWhileRight(x => x > 1)
   * // Vector(2, 3, 4)
   *
   * > Vector(1, 2, 3).takeWhileRight(x => x < 5)
   * // Vector(1, 2, 3)
   *
   * > Vector(1, 2, 3).takeWhileRight(x => x < 0)
   * // Vector()
   * ```
   */
  public takeWhileRight<B extends A>(p: (a: A) => a is B): Vector<B>;
  public takeWhileRight(p: (a: A) => boolean): Vector<A>;
  public takeWhileRight(p: (a: A) => boolean): Vector<A> {
    const idxOpt = this.findIndexRight(x => !p(x));
    return idxOpt.nonEmpty ? this.takeRight(this.size - idxOpt.get - 1) : this;
  }

  /**
   * _O(i)_ where `i` is the suffix length. Returns a remainder of the vector
   * after removing its longer suffix satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4, 1, 2, 3, 4).dropWhile(x => x > 1)
   * // Vector(1, 2, 3, 4, 1)
   *
   * > Vector(1, 2, 3).dropWhile(x => x < 5)
   * // Vector()
   *
   * > Vector(1, 2, 3).dropWhile(x => x < 0)
   * // Vector(1, 2, 3)
   * ```
   */
  public dropWhileRight(p: (a: A) => boolean): Vector<A> {
    const idxOpt = this.findIndexRight(x => !p(x));
    return idxOpt.nonEmpty
      ? this.dropRight(this.size - idxOpt.get - 1)
      : Vector.empty;
  }

  /**
   * _O(i)_ where `i` is the prefix length. Returns a tuple where the first
   * element is the longest prefix satisfying the predicate `p` and the second
   * is the remainder of the vector.
   *
   * `xs.span(p)` is equivalent to `[xs.takeWhileRight(p), xs.dropWhileRight(p)]`
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4, 1, 2, 3, 4).spanRight(x => x > 3)
   * // [Vector(4), Vector(1, 2, 3, 4, 1, 2, 3)]
   *
   * > Vector(1, 2, 3).spanRight(_ => true)
   * // [Vector(), Vector(1, 2, 3)]
   *
   * > Vector(1, 2, 3).spanRight(_ => false)
   * // [Vector(1, 2, 3), Vector()]
   * ```
   */
  public spanRight<B extends A>(p: (a: A) => a is B): [Vector<B>, Vector<A>];
  public spanRight(p: (a: A) => boolean): [Vector<A>, Vector<A>];
  public spanRight(p: (a: A) => boolean): [Vector<A>, Vector<A>] {
    const idxOpt = this.findIndexRight(x => !p(x));
    return idxOpt.nonEmpty
      ? this.splitAt(idxOpt.get + 1)
      : [Vector.empty, this];
  }

  /**
   * _O(n)_ Returns a view of of all possible prefixes of the vector, shortest
   * first.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).inits().toArray
   * // [Vector(), Vector(1), Vector(1, 2), Vector(1, 2, 3)]
   * ```
   */
  public inits(): View<Vector<A>> {
    return View.build(
      <B>(ez: Eval<B>, g: (xs: Vector<A>, eb: Eval<B>) => Eval<B>) => {
        const sz = this.size;
        let i = 0;
        const go: Eval<B> = Eval.defer(() =>
          i > sz ? ez : g(this.take(i++), go),
        );
        return go;
      },
    );
  }

  /**
   * _O(n)_ Returns a view of of all possible suffixes of the vector, longest
   * first.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).inits().toArray
   * // [Vector(1, 2, 3), Vector(1, 2), Vector(1), Vector()]
   * ```
   */
  public tails(): View<Vector<A>> {
    return View.build(
      <B>(ez: Eval<B>, g: (xs: Vector<A>, eb: Eval<B>) => Eval<B>) => {
        const sz = this.size;
        let i = 0;
        const go: Eval<B> = Eval.defer(() =>
          i > sz ? ez : g(this.drop(i++), go),
        );
        return go;
      },
    );
  }

  // -- Searching

  /**
   * _O(n)_ Returns `true` if the vector contains the element `a`, or `false`
   * otherwise.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).elem(2)
   * // true
   *
   * > Vector(1, 2, 3).elem(-1)
   * // false
   *
   * > Vector([1, 2], [2, 3]).elem(
   * >   [1, 2],
   * >   Eq.tuple(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()),
   * > )
   * // true
   * ```
   */
  public elem<A>(
    this: Vector<A>,
    a: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      if (E.equals(xs[i], a)) return true;
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
    this: Vector<A>,
    a: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    return !this.elem(a, E);
  }

  /**
   * _O(n)_ Looks up a key in the association vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector([1, 'one'], [2, 'two'], [3, 'three']).lookup(2)
   * // Some('two')
   *
   * > Vector([1, 'one']).lookup(2)
   * // None
   *
   * > Vector.empty.lookup(2)
   * // None
   * ```
   */
  public lookup<K, V>(
    this: Vector<[K, V]>,
    k: K,
    E: Eq<K> = Eq.fromUniversalEquals(),
  ): Option<V> {
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      const kv = xs[i];
      if (E.equals(k, kv[0])) return Some(kv[1]);
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
   * > Vector(0, 10, 20, 30, 40, 50).find(x => x > 42)
   * // Some(50)
   *
   * > Vector(1, 2, 3).find(x => x < 0)
   * // None
   * ```
   */
  public find<B extends A>(p: (a: A) => a is B): Option<B>;
  public find(p: (a: A) => boolean): Option<A>;
  public find(p: (a: A) => boolean): Option<A> {
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      if (p(xs[i])) return Some(xs[i]);
    }
    return None;
  }

  /**
   * _O(n)_ Returns a vector where all elements of the original vector satisfy
   * the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4).filter(x => x % 2 === 0)
   * // Vector(2, 4)
   *
   * > Vector.range(1).filter(x => x % 2 === 0).take(3)
   * // Vector(2, 4, 6)
   * ```
   */
  public filter<B extends A>(p: (a: A) => a is B): Vector<B>;
  public filter(p: (a: A) => boolean): Vector<A>;
  public filter(p: (a: A) => boolean): Vector<A> {
    const ys: A[] = [];
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      if (p(xs[i])) ys.push(xs[i]);
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(n)_ Returns a vector where all elements of the original vector do
   * not satisfy the predicate `p`.
   *
   * `xs.filterNot(p)` is equivalent to `xs.filter(x => !p(x))`
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4).filterNot(x => x % 2 === 0)
   * // Vector(1, 3)
   *
   * > Vector.range(1).filterNot(x => x % 2 === 0).take(3)
   * // Vector(1, 3, 5)
   * ```
   */
  public filterNot(p: (a: A) => boolean): Vector<A> {
    return this.filter(x => !p(x));
  }

  /**
   * _O(n)_ A version of `map` which can also remove elements of the original
   * vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector('1', 'Foo', '3')
   * >   .collect(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * // Vector(1, 3)
   * ```
   */
  public collect<B>(f: (a: A) => Option<B>): Vector<B> {
    const ys: B[] = [];
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      const o = f(xs[i]);
      if (o.nonEmpty) ys.push(o.get);
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(n)_ A version of `collect` which drops the remainder of the vector
   * starting with the first element for which the function `f` returns `None`.
   *
   * @examples
   *
   * ```typescript
   * > Vector('1', 'Foo', '3')
   * >   .collectWhile(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * // Vector(1)
   * ```
   */
  public collectWhile<B>(f: (a: A) => Option<B>): Vector<B> {
    const ys: B[] = [];
    for (let i = this.start, end = this.end; i < end; i++) {
      const o = f(this.xs[i]);
      if (o.isEmpty) break;
      ys.push(o.get);
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(n)_ A version of `collect` which drops the prefix of the vector
   * starting with the last element for which the function `f` returns `None`.
   *
   * @examples
   *
   * ```typescript
   * > Vector('1', 'Foo', '3')
   * >   .collectWhileRight(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * // Vector(3)
   * ```
   */
  public collectWhileRight<B>(f: (a: A) => Option<B>): Vector<B> {
    const ys: B[] = [];
    for (let i = this.end - 1, start = this.start; i >= start; i--) {
      const o = f(this.xs[i]);
      if (o.isEmpty) break;
      ys.push(o.get);
    }
    return Vector.fromArray(ys.reverse());
  }

  /**
   * _O(n)_ Returns a tuple where the first element is a vector containing the
   * elements which satisfy the predicate `p` and the second one which contains
   * the rest of them.
   *
   * `xs.partition(p)` is equivalent to `[xs.filter(p), xs.filterNot(p)]`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4, 5, 6).partition(x => x % 2 === 0)
   * // [Vector(2, 4, 6), Vector(1, 3, 5)]
   * ```
   */
  public partition<B extends A>(p: (a: A) => a is B): [Vector<B>, Vector<A>];
  public partition(p: (a: A) => boolean): [Vector<A>, Vector<A>];
  public partition(p: (a: A) => boolean): [Vector<A>, Vector<A>] {
    const ys: A[] = [];
    const zs: A[] = [];
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      const x = xs[i];
      if (p(x)) {
        ys.push(x);
      } else {
        zs.push(x);
      }
    }
    return [Vector.fromArray(ys), Vector.fromArray(zs)];
  }

  /**
   * _O(n)_ Returns a tuple where the first element corresponds to the elements
   * of the vector returning `Left<L>` by applying the function `f`, and the
   * second one those that return `Right<R>`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4, 5, 6).partitionWith(x =>
   * >   x % 2 === 0 ? Left(x % 2) : Right(String(x))
   * > )
   * // [Vector(1, 2, 3), Vector('1', '3', '5')]
   * ```
   */
  public partitionWith<L, R>(
    f: (a: A) => Either<L, R>,
  ): [Vector<L>, Vector<R>] {
    const ys: L[] = [];
    const zs: R[] = [];
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      const x = f(xs[i]);
      if (x.isEmpty) {
        ys.push(x.getLeft);
      } else {
        zs.push(x.get);
      }
    }
    return [Vector.fromArray(ys), Vector.fromArray(zs)];
  }

  // -- Indexing

  /**
   * _O(1)_ Returns an element at the index `idx`.
   *
   * @note This function is partial.
   *
   * @see {@link getOption} for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).get(0)
   * // 1
   *
   * > Vector(1, 2, 3).get(2)
   * // 3
   *
   * > Vector(1, 2, 3).get(3)
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Vector(1, 2, 3).get(-1)
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public get(i: number): A {
    return i < 0 || i >= this.size ? iob() : this.xs[i + this.start];
  }
  /**
   * Alias for {@link get}.
   */
  public '!!'(i: number): A {
    return this.get(i);
  }

  /**
   * _O(1)_ Optionally returns an element at the index `idx`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).getOption(0)
   * // Some(1)
   *
   * > Vector(1, 2, 3).getOption(2)
   * // Some(3)
   *
   * > Vector(1, 2, 3).getOption(3)
   * // None
   *
   * > Vector(1, 2, 3).getOption(-1)
   * // None
   * ```
   */
  public getOption(i: number): Option<A> {
    return i < 0 || i >= this.size ? None : Some(this.xs[i + this.start]);
  }
  /**
   * Alias for {@link getOption}.
   */
  public '!?'(i: number): Option<A> {
    return this.getOption(i);
  }

  /**
   * _O(n)_ Replace an element at the index `i` with the new value `x`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > Vector('a', 'b', 'c').replaceAt(0, 'x')
   * // Vector('x', 'b', 'c')
   *
   * > Vector('a', 'b', 'c').replaceAt(2, 'x')
   * // Vector('a', 'b', 'x')
   *
   * > Vector('a', 'b', 'c').replaceAt(3, 'x')
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Vector('a', 'b', 'c').replaceAt(-1, 'x')
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public replaceAt<A>(this: Vector<A>, i: number, x: A): Vector<A> {
    if (i < 0 || i >= this.size) return iob();
    const ys = this.toArray;
    ys[i] = x;
    return new _Vector(ys, 0, ys.length);
  }

  /**
   * _O(n)_ Transforms an element at the index `i` using the function `f`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > Vector('a', 'b', 'c').modifyAt(0, c => c.toUpperCase())
   * // Vector('A', 'b', 'c')
   *
   * > Vector('a', 'b', 'c').modifyAt(2, c => c.toUpperCase())
   * // Vector('a', 'b', 'C')
   *
   * > Vector('a', 'b', 'c').modifyAt(3, c => c.toUpperCase())
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Vector('a', 'b', 'c').modifyAt(-1, c => c.toUpperCase())
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public modifyAt<A>(this: Vector<A>, i: number, f: (a: A) => A): Vector<A> {
    if (i < 0 || i >= this.size) return iob();
    const ys = this.toArray;
    ys[i] = f(ys[i]);
    return new _Vector(ys, 0, ys.length);
  }

  /**
   * _O(n)_ Inserts an element `x` at the index `i` shifting
   * the remainder of the sequence.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > Vector('a', 'b', 'c').insertAt(0, 'x')
   * // Vector('x', 'a', 'b', 'c')
   *
   * > Vector('a', 'b', 'c').insertAt(2, 'x')
   * // Vector('a', 'b', 'x', 'c')
   *
   * > Vector('a', 'b', 'c').insertAt(3, 'x')
   * // Vector('a', 'b', 'c', 'x')
   *
   * > Vector('a', 'b', 'c').insertAt(4, 'x')
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Vector('a', 'b', 'c').insertAt(-1, 'x')
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public insertAt<A>(this: Vector<A>, i: number, x: A): Vector<A> {
    if (i < 0 || i > this.size) return iob();
    const sz = this.size;
    const start = this.start;
    const xs = this.xs;
    const ys = new Array<A>(sz + 1);
    for (let j = 0; j < i; j++) {
      ys[j] = xs[j + start];
    }
    ys[i] = x;
    for (let j = i; j < sz; j++) {
      ys[j + 1] = xs[j + start];
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(n)_ Removes an element `x` at the index `i`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > Vector('a', 'b', 'c').removeAt(0).toArray
   * // ['b', 'c']
   *
   * > Vector('a', 'b', 'c').removeAt(2).toArray
   * // ['a', 'b']
   *
   * > Vector('a', 'b', 'c').removeAt(3).toArray
   * // Uncaught Error: IndexOutOfBounds
   *
   * > Vector('a', 'b', 'c').removeAt(-1).toArray
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public removeAt<A>(this: Vector<A>, i: number): Vector<A> {
    if (i < 0 || i >= this.size) return iob();
    const sz = this.size;
    const start = this.start;
    const xs = this.xs;
    const ys = new Array<A>(sz - 1);
    for (let j = 0; j < i; j++) {
      ys[j] = xs[j + start];
    }
    for (let j = i + 1; j < sz; j++) {
      ys[j - 1] = xs[j + start];
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(n)_ Returns the first index of on occurrence of the element `x` in the
   * vector, or `None` when it does not exist.
   *
   * @see {@link elemIndices} to get indices of _all_ occurrences of the element `x`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).elemIndex(1)
   * // Some(0)
   *
   * > Vector(1, 2, 3).elemIndex(3)
   * // Some(2)
   *
   * > Vector(1, 2, 3).elemIndex(0)
   * // None
   * ```
   */
  public elemIndex<A>(
    this: Vector<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Option<number> {
    return this.findIndex(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns the indices of all occurrence of the element `x` in the
   * vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).elemIndices(1)
   * // Vector(0, 3)
   *
   * > Vector(1, 2, 3).elemIndices(3)
   * // Vector(2)
   *
   * > Vector(1, 2, 3).elemIndices(0)
   * // Vector()
   * ```
   */
  public elemIndices<A>(
    this: Vector<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Vector<number> {
    return this.findIndices(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns the last index of on occurrence of the element `x` in the
   * vector, or `None` when it does not exist.
   *
   * @see {@link elemIndices} to get indices of _all_ occurrences of the element `x`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).elemIndexRight(1)
   * // Some(3)
   *
   * > Vector(1, 2, 3).elemIndexRight(3)
   * // Some(2)
   *
   * > Vector(1, 2, 3).elemIndexRight(0)
   * // None
   * ```
   */
  public elemIndexRight<A>(
    this: Vector<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Option<number> {
    return this.findIndexRight(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns the indices, from right-to-left of all occurrence of the
   * element `x` in the vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).elemIndicesRight(1)
   * // Vector(3, 0)
   *
   * > Vector(1, 2, 3).elemIndicesRight(3)
   * // Vector(2)
   *
   * > Vector(1, 2, 3).elemIndicesRight(0)
   * // Vector()
   * ```
   */
  public elemIndicesRight<A>(
    this: Vector<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Vector<number> {
    return this.findIndicesRight(y => E.equals(x, y));
  }

  /**
   * _O(n)_ Returns index of the first element satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).findIndex(x => x > 1)
   * // Some(1)
   *
   * > Vector(1, 2, 3).findIndex(x => x === 3)
   * // Some(2)
   *
   * > Vector(1, 2, 3).findIndex(x => x > 20)
   * // None
   * ```
   */
  public findIndex(p: (a: A) => boolean): Option<number> {
    const sz = this.size;
    const start = this.start;
    const xs = this.xs;
    for (let i = 0; i < sz; i++) {
      if (p(xs[i + start])) return Some(i);
    }
    return None;
  }

  /**
   * _O(n)_ Returns indices of all elements satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).findIndices(x => x > 1)
   * // Vector(1, 2, 4, 5)
   *
   * > Vector(1, 2, 3).findIndices(x => x === 3)
   * // Vector(2)
   *
   * > Vector(1, 2, 3).findIndices(x => x > 20)
   * // Vector()
   * ```
   */
  public findIndices(p: (a: A) => boolean): Vector<number> {
    const sz = this.size;
    const start = this.start;
    const xs = this.xs;
    const ys: number[] = [];
    for (let i = 0; i < sz; i++) {
      if (p(xs[i + start])) ys.push(i + start);
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(n)_ Returns index of the last element satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).findIndex(x => x > 1)
   * // Some(5)
   *
   * > Vector(1, 2, 3).findIndex(x => x === 3)
   * // Some(2)
   *
   * > Vector(1, 2, 3).findIndex(x => x > 20)
   * // None
   * ```
   */
  public findIndexRight(p: (a: A) => boolean): Option<number> {
    const sz = this.size;
    const start = this.start;
    const last = this.end - 1;
    const xs = this.xs;
    for (let i = 0; i < sz; i++) {
      if (p(xs[last - i])) return Some(last - i - start);
    }
    return None;
  }

  /**
   * _O(n)_ Returns indices, right-to-left, of all elements satisfying
   * the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).findIndices(x => x > 1)
   * // Vector(5, 4, 3, 2, 1)
   *
   * > Vector(1, 2, 3).findIndices(x => x === 3)
   * // Vector(2)
   *
   * > Vector(1, 2, 3).findIndices(x => x > 20)
   * // Vector()
   * ```
   */
  public findIndicesRight(p: (a: A) => boolean): Vector<number> {
    const sz = this.size;
    const start = this.start;
    const last = this.end - 1;
    const xs = this.xs;
    const ys: number[] = [];
    for (let i = 0; i < sz; i++) {
      if (p(xs[last - i])) ys.push(last - i - start);
    }
    return Vector.fromArray(ys);
  }

  // -- Combining and transforming

  /**
   * _O(n)_ Returns vector with elements in reversed order.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).reverse
   * // Vector(3, 2, 1)
   *
   * > Vector(42).reverse
   * // Vector(42)
   *
   * > Vector.empty.reverse
   * // Vector()
   * ```
   */
  public get reverse(): Vector<A> {
    return Vector.fromArray(this.toArray.reverse());
  }

  /**
   * _O(n1 + n2)_ Appends all elements of the second vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).concat(Vector(4, 5, 6))
   * // Vector(1, 2, 3, 4, 5, 6)
   * ```
   */
  public concat<A>(this: Vector<A>, that: Vector<A>): Vector<A> {
    const sz1 = this.size;
    const sz2 = that.size;
    const zs = new Array<A>(sz1 + sz2);

    const start1 = this.start;
    const xs = this.xs;
    for (let i = 0; i < sz1; i++) {
      zs[i] = xs[i + start1];
    }

    const start2 = that.start;
    const ys = that.xs;
    for (let i = 0; i < sz2; i++) {
      zs[sz1 + i] = ys[i + start2];
    }

    return Vector.fromArray(zs);
  }
  /**
   * Alias for `concat`.
   */
  public '++'<A>(this: Vector<A>, that: Vector<A>): Vector<A> {
    return this.concat(that);
  }

  /**
   * _O(n)_ Returns a new vector by transforming each element using the
   * function `f`.
   *
   * @examples
   *
   * ```typescript
   * > Vector('a', 'b', 'c').map(x => x.toUpperCase())
   * // Vector('A', 'B', 'C')
   *
   * > Vector.empty.map(() => { throw new Error(); })
   * // Vector()
   *
   * > Vector.range(1, 3).map(x => x + 1)
   * // Vector(2, 3, 4)
   * ```
   */
  public map<B>(f: (a: A) => B): Vector<B> {
    const start = this.start;
    const sz = this.size;
    const ys = new Array<B>(sz);
    for (let i = 0; i < sz; i++) {
      ys[i] = f(this.xs[start + i]);
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(m + n)_ Returns a vector by transforming combination of elements from
   * both vectors using the function `f`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2).map2(Vector('a', 'b'), tupled)
   * // Vector([1, 'a'], [1, 'b'], [2, 'a'], [2, 'b'])
   * ```
   */
  public map2<B, C>(that: Vector<B>, f: (a: A, b: B) => C): Vector<C> {
    const cs = new Array<C>(this.size * that.size);
    const xs = this.xs;
    const ys = that.xs;
    for (let i = this.start, end = this.end, k = 0; i < end; i++) {
      for (let j = that.start, end = that.end; j < end; j++, k++) {
        cs[k] = f(xs[i], ys[j]);
      }
    }
    return Vector.fromArray(cs);
  }

  /**
   * Lazy version of `map2`.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2).map2Eval(Eval.now(Vector('a', 'b')), tupled).value
   * // Vector([1, 'a'], [1, 'b'], [2, 'a'], [2, 'b'])
   *
   * > Vector.empty.map2Eval(Eval.bottom(), tupled).value
   * // Vector()
   * ```
   */
  public map2Eval<B, C>(
    that: Eval<Vector<B>>,
    f: (a: A, b: B) => C,
  ): Eval<Vector<C>> {
    return this.isEmpty
      ? Eval.now(Vector.empty)
      : that.map(that => this.map2(that, f));
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
  public flatMap<B>(f: (a: A) => Vector<B>): Vector<B> {
    const xs = this.xs;
    const end = this.end;
    const zs: B[] = [];
    for (let i = this.start; i < end; i++) {
      const that = f(xs[i]);
      const ys = that.xs;
      const end2 = that.end;
      for (let j = that.start; j < end2; j++) {
        zs.push(ys[j]);
      }
    }
    return Vector.fromArray(zs);
  }

  /**
   * _O(n)_ Create a new vector by transforming each of its
   * non-empty tails using a function `f`.
   *
   * @examples
   *
   * ```typescript
   * > Vector('a', 'b', 'c').coflatMap(xs => xs.size)
   * // Vector(3, 2, 1)
   * ```
   */
  public coflatMap<B>(f: (xs: Vector<A>) => B): Vector<B> {
    return this.tails()
      .filter(xs => xs.nonEmpty)
      .map(f).toVector;
  }

  /**
   * Returns a new vector concatenating its nested vectors.
   *
   * `xss.flatten()` is equivalent to `xss.flatMap(id)`.
   */
  public flatten<A>(this: Vector<Vector<A>>): Vector<A> {
    return this.flatMap(id);
  }

  /**
   * _O(n)_ Inserts the given separator `sep` in between each of the elements of
   * the vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector('a', 'b', 'c').intersperse(',')
   * // Vector('a', ',', 'b', ',', 'c')
   * ```
   */
  public intersperse<A>(this: Vector<A>, sep: A): Vector<A> {
    if (this.size <= 1) return this;
    const sz = 2 * this.size - 1;
    const ys = new Array(sz);
    ys[0] = this.xs[this.start];
    for (let i = this.start + 1, j = 1; j < sz; i++, j += 2) {
      ys[j] = sep;
      ys[j + 1] = this.xs[i];
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(n * m)_ Transposes rows and columns of the vector.
   *
   * @note This function is total, which means that in case some rows are shorter
   * than others, their elements are skipped in the result.
   *
   * @examples
   *
   * ```typescript
   * > Vector(Vector(1, 2, 3), Vector(4, 5, 6)).transpose()
   * // Vector(Vector(1, 4), Vector(2, 5), Vector(3, 6))
   *
   * > Vector(Vector(10, 11), Vector(20), Vector(), Vector(30, 31, 32)).transpose()
   * // Vector(Vector(10, 20, 30), Vector(11, 31), Vector(32))
   * ```
   */
  public transpose<A>(this: Vector<Vector<A>>): Vector<Vector<A>> {
    const rs = [] as A[][];
    let rsSz = 0;

    for (let i = this.start, send = this.end; i < send; i++) {
      let k = 0;
      for (let xs = this.xs[i], j = xs.start, end = xs.end; j < end; j++) {
        if (k >= rsSz) {
          rs.push([]);
          rsSz++;
        }
        rs[k].push(xs.xs[j]);
        k++;
      }
    }

    return Vector.fromArray(rs.map(xs => Vector.fromArray(xs)));
  }

  // -- Zips

  /**
   * _O(min(n, m))_ Returns a vector of pairs of corresponding elements of each
   * vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).zip(Vector('a', 'b', 'c'))
   * // Vector([1, 'a'], [2, 'b'], [3, 'c'])
   *
   * > Vector(1, 2, 3).zip(Vector('a', 'b'))
   * // Vector([1, 'a'], [2, 'b'])
   *
   * > Vector('a', 'b').zip(Vector(1, 2, 3))
   * // Vector(['a', 1], ['b', 2])
   *
   * > Vector.empty.zip(Vector(1, 2, 3))
   * // Vector()
   *
   * > Vector(1, 2, 3).zip(Vector.empty)
   * // Vector()
   * ```
   */
  public zip<B>(that: Vector<B>): Vector<[A, B]> {
    return this.zipWith(that, (a, b) => [a, b]);
  }

  /**
   * Lazy version of {@link zip} that returns a {@link View}.
   */
  public zipView<B>(that: Vector<B>): View<[A, B]> {
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
   * > Vector(1, 2, 3).zipWith(Vector(4, 5, 6), (x, y) => x + y)
   * // Vector(5, 7, 9)
   * ```
   */
  public zipWith<B, C>(that: Vector<B>, f: (a: A, b: B) => C): Vector<C> {
    const sz = Math.min(this.size, that.size);
    const cs = new Array<C>(sz);
    const sx = this.start;
    const xs = this.xs;
    const sy = that.start;
    const ys = that.xs;
    for (let i = 0; i < sz; i++) {
      cs[i] = f(xs[sx + i], ys[sy + i]);
    }
    return Vector.fromArray(cs);
  }

  /**
   * Lazy version of {@link zipWith} that returns a `View`.
   */
  public zipWithView<B, C>(that: Vector<B>, f: (a: A, b: B) => C): View<C> {
    return View.build((ez, g) =>
      this.foldRight2(that, ez, (a, b, r) => g(f(a, b), r)),
    );
  }

  /**
   * _O(n)_ Returns a vector where each element is zipped with its index in
   * the resulting vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector('a', 'b', 'c').zipWithIndex
   * // Vector(['a', 0], ['a', 1], ['a', 2])
   *
   * > Vector(1, 2, 3, 4, 5, 6).filter(x => x % 2 === 0).zipWithIndex.take(3)
   * // Vector([2, 0], [4, 1], [6, 2])
   *
   * > Vector(1, 2, 3, 4, 5, 6).zipWithIndex.filter(([x]) => x % 2 === 0).take(3)
   * // Vector([2, 1], [4, 3], [6, 5])
   * ```
   */
  public get zipWithIndex(): Vector<[A, number]> {
    let idx = 0;
    return this.map(x => [x, idx++]);
  }

  public align<B>(that: Vector<B>): Vector<Ior<A, B>> {
    const szx = this.size;
    const szy = that.size;
    const cs = new Array<Ior<A, B>>(Math.max(szx, szy));
    const sx = this.start;
    const xs = this.xs;
    const sy = that.start;
    const ys = that.xs;
    let i = 0;
    for (let sz = Math.min(szx, szy); i < sz; i++) {
      cs[i] = Ior.Both(xs[sx + i], ys[sy + i]);
    }
    for (; i < szx; i++) {
      cs[i] = Ior.Left(xs[sx + i]);
    }
    for (; i < szy; i++) {
      cs[i] = Ior.Right(ys[sy + i]);
    }
    return Vector.fromArray(cs);
  }

  public zipAll<B>(that: Vector<B>, defaultX: A, defaultY: B): Vector<[A, B]> {
    return this.zipAllWith(that, defaultX, defaultY, (a, b) => [a, b]);
  }

  public zipAllWith<B, C>(
    that: Vector<B>,
    defaultX: A,
    defaultY: B,
    f: (a: A, b: B) => C,
  ): Vector<C> {
    const szx = this.size;
    const szy = that.size;
    const cs = new Array<C>(Math.max(szx, szy));
    const sx = this.start;
    const xs = this.xs;
    const sy = this.start;
    const ys = that.xs;
    let i = 0;
    for (let sz = Math.min(szx, szy); i < sz; i++) {
      cs[i] = f(xs[sx + i], ys[sy + i]);
    }
    for (; i < szx; i++) {
      cs[i] = f(xs[sx + i], defaultY);
    }
    for (; i < szy; i++) {
      cs[i] = f(defaultX, ys[sy + i]);
    }
    return Vector.fromArray(cs);
  }

  public unzip<A, B>(this: Vector<readonly [A, B]>): [Vector<A>, Vector<B>] {
    return this.unzipWith(id);
  }

  public unzipWith<B, C>(f: (a: A) => readonly [B, C]): [Vector<B>, Vector<C>] {
    const sz = this.size;
    const bs = new Array<B>(sz);
    const cs = new Array<C>(sz);

    const start = this.start;
    const xs = this.xs;
    for (let i = 0; i < sz; i++) {
      const bc = f(xs[i + start]);
      bs[i] = bc[0];
      cs[i] = bc[1];
    }

    return [Vector.fromArray(bs), Vector.fromArray(cs)];
  }

  private foldRight2<B, C>(
    that: Vector<B>,
    ez: Eval<C>,
    f: (a: A, b: B, ez: Eval<C>) => Eval<C>,
  ): Eval<C> {
    const sz = Math.min(this.size, that.size);
    const xs = this.xs;
    const ys = that.xs;
    const start1 = this.start;
    const start2 = that.start;

    let idx = 0;
    const go: Eval<C> = Eval.defer(() =>
      idx >= sz ? ez : f(xs[idx + start1], ys[idx++ + start2], go),
    );
    return go;
  }

  // -- Scans

  /**
   * _O(n)_ Returns a vector of cumulative results reduced from left:
   *
   * `Vector(x1, x2, ...).scanLeft(z, f)` is equivalent to `Vector(z, f(z, x1), f(f(z, x1), x2), ...)`
   *
   *
   * Relationship with {@link foldLeft}:
   *
   * `xs.scanLeft(z, f).last == xs.foldLeft(z, f)`
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).scanLeft(0, (z, x) => z + x)
   * // Vector(0, 1, 3, 6)
   *
   * > Vector.empty.scanLeft(42, (z, x) => z + x)
   * // Vector(42)
   *
   * > Vector.range(1, 5).scanLeft(100, (x, y) => x - y)
   * // Vector(100, 99, 97, 94, 90)
   * ```
   */
  public scanLeft<B>(z: B, f: (b: B, a: A) => B): Vector<B> {
    const sz = this.size;
    const start = this.start;
    const xs = this.xs;
    const ys = new Array<B>(sz + 1);
    ys[0] = z;
    for (let i = 0; i < sz; i++) {
      ys[i + 1] = f(ys[i], xs[i + start]);
    }
    return Vector.fromArray(ys);
  }

  /**
   * Variant of {@link scanLeft} with no initial value.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).scanLeft1((z, x) => z + x)
   * // Vector(1, 3, 6)
   *
   * > Vector.empty.scanLeft1((z, x) => z + x)
   * // Vector()
   *
   * > Vector.range(1, 5).scanLeft1((x, y) => x - y)
   * // Vector(1, -1, -4, -8)
   */
  public scanLeft1<A>(this: Vector<A>, f: (acc: A, x: A) => A): Vector<A> {
    const ys = this.toArray;
    for (let i = 1, len = ys.length; i < len; i++) {
      ys[i] = f(ys[i - 1], ys[i]);
    }
    return Vector.fromArray(ys);
  }

  /**
   * _O(n)_ Right-to-left dual of {@link scanLeft}.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).scanRight_(0, (x, z) => x + z)
   * // Vector(6, 5, 3, 0)
   *
   * > Vector.empty.scanRight_(42, (x, z) => x + z)
   * // Vector(42)
   *
   * > Vector.range(1, 5).scanRight_(100, (x, z) => x - z)
   * // Vector(98, -97, 99, -96, 100)
   * ```
   */
  public scanRight_<B>(z: B, f: (a: A, b: B) => B): Vector<B> {
    const sz = this.size;
    const last = this.end - 1;
    const xs = this.xs;
    const ys = new Array<B>(sz + 1);
    ys[sz] = z;
    for (let i = 0; i < sz; i++) {
      ys[sz - 1 - i] = f(xs[last - i], ys[sz - i]);
    }
    return Vector.fromArray(ys);
  }

  /**
   * Version of {@link scanRight_} with no initial value.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).scanRight1_((x, z) => x + z)
   * // Vector(6, 5, 3)
   *
   * > Vector.empty.scanRight1_((x, z) => x + z)
   * // Vector()
   *
   * > Vector.range(1, 5).scanRight1_((x, z) => x - z)
   * // Vector(-2, 3, -1, 4)
   * ```
   */
  public scanRight1_<A>(this: Vector<A>, f: (x: A, acc: A) => A): Vector<A> {
    const ys = this.toArray;
    for (let i = 1, len = ys.length; i <= len; i++) {
      ys[len - i - 1] = f(ys[len - i - 1], ys[len - i]);
    }
    return Vector.fromArray(ys);
  }

  // -- Set operations

  /**
   * _O(n^2)_ Removes duplicate elements from the vector.
   *
   * @see {@link distinctBy} for the user supplied equality check.
   *
   * @note In case the `Eq<A>` is not provided, the implementation falls back
   * to default equality comparison with _O(n)_.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4, 3, 2, 1, 2, 4, 3, 5).distinct()
   * // Vector(1, 2, 3, 4, 5)
   * ```
   */
  public distinct<A>(this: Vector<A>, E?: Eq<A>): Vector<A> {
    return E ? this.distinctBy(E.equals) : this.distinctPrim();
  }

  /**
   * Version of {@link distinct} function using a user-supplied equality check `eq`.
   */
  public distinctBy(eq: (x: A, y: A) => boolean): Vector<A> {
    const ys: A[] = [];
    const xs = this.xs;
    outer: for (let i = this.start, end = this.end; i < end; i++) {
      for (let j = 0, len = ys.length; j < len; j++)
        if (eq(xs[i], ys[j])) continue outer;
      ys.push(xs[i]);
    }
    return Vector.fromArray(ys);
  }

  private distinctPrim(): Vector<A> {
    const ys = new Set<A>();
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      if (ys.has(xs[i])) continue;
      ys.add(xs[i]);
    }
    return Vector.fromArray([...ys]);
  }

  /**
   * _O(n)_ Removes the first occurrence of `x` in the vector.
   *
   * @see {@link removeBy} for the use-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).remove(1)
   * // Vector(2, 3, 1, 2, 3)
   *
   * > Vector(2, 3).remove(1)
   * // Vector(2, 3)
   *
   * > Vector().remove(1)
   * // Vector()
   * ```
   */
  public remove<A>(
    this: Vector<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Vector<A> {
    return this.removeBy(x, E.equals);
  }

  /**
   * Version of {@link remove} function using a user-supplied equality check `eq`.
   */
  public removeBy<A>(
    this: Vector<A>,
    x: A,
    eq: (x: A, y: A) => boolean,
  ): Vector<A> {
    const toRemove = this.findIndex(y => eq(x, y));
    return toRemove.isEmpty ? this : this.removeAt(toRemove.get);
  }

  /**
   * _O(n * m)_ A non-associative collection difference. `difference` removes
   * first occurrence of each element of `that` in the current vector.
   *
   * `xs.concat(ys).difference(xs) === ys`
   *
   * @see {@link differenceBy} for the user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 1, 2, 3).difference(Vector(2, 3))
   * // Vector(1, 1, 2, 3)
   *
   * > Vector(1, 2, 3, 1, 2, 3).difference(Vector(1, 1, 2))
   * // Vector(3, 2, 3)
   *
   * > Vector.range(1, 9).difference(Vector(1, 2, 3))
   * // Vector(4, 5, 6, 7, 8)
   * ```
   */
  public difference<A>(
    this: Vector<A>,
    that: Vector<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Vector<A> {
    return this.differenceBy(that, E.equals);
  }
  /**
   * Alias for {@link difference}.
   */
  public '\\'<A>(
    this: Vector<A>,
    that: Vector<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Vector<A> {
    return this.difference(that, E);
  }

  /**
   * Version of {@link difference} that uses user-supplied equality check `eq`.
   */
  public differenceBy<A>(
    this: Vector<A>,
    that: Vector<A>,
    eq: (x: A, y: A) => boolean,
  ): Vector<A> {
    return that.foldLeft(this, (xs, x) => xs.removeBy(x, eq));
  }

  /**
   * _O(max(n, m) * m)_ Creates a union of two vectors.
   *
   * Duplicates and the elements from the first vector are removed from the
   * second one. But if there are duplicates in the original vector, they are
   * present in the result as well.
   *
   * @see {@link unionBy} for the user-supplied equality check.
   *
   * @note In case the `Eq<A>` is not provided, the implementation falls back
   * to default equality comparison with _O(max(n, m))_.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).union(Vector(2, 3, 4))
   * // Vector(1, 2, 3, 4)
   *
   * > Vector(1, 2, 3).union(Vector(1, 2, 3, 3, 4))
   * // Vector(1, 2, 3, 4)
   *
   * > Vector(1, 1, 2, 3, 6).union(Vector(2, 3, 4))
   * // Vector(1, 1, 2, 3, 6, 4)
   *
   * > Vector.range(1).union(Vector.range(1)).take(5)
   * // Vector(1, 2, 3, 4, 5)
   *
   * > Vector(1, 2, 3).union(Vector.rage(1)).take(5)
   * // Vector(1, 2, 3, 4, 5)
   * ```
   */
  public union<A>(this: Vector<A>, that: Vector<A>, E?: Eq<A>): Vector<A> {
    return E ? this.unionBy(that, E.equals) : this.unionPrim(that);
  }

  /**
   * Version of {@link union} that uses a user-supplied equality check `eq`.
   */
  public unionBy<A>(
    this: Vector<A>,
    that: Vector<A>,
    eq: (x: A, y: A) => boolean,
  ): Vector<A> {
    return this.concat(
      this.foldLeft(that.distinctBy(eq), (xs, x) => xs.removeBy(x, eq)),
    );
  }

  private unionPrim<A>(this: Vector<A>, that: Vector<A>): Vector<A> {
    return this.concat(
      this.foldLeft(that.distinctPrim(), (xs, x) => xs.remove(x)),
    );
  }

  /**
   * _O(n * m)_ Creates an intersection of two vector. If the first vector
   * contains duplicates so does the second
   *
   * @see {@link intersectBy} for a user-supplied equality check.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4).intersect(Vector(2, 4, 6, 8))
   * // Vector(2, 4)
   *
   * > Vector(1, 1, 2, 3).intersect(Vector(1, 2, 2, 5))
   * // Vector(1, 1, 2)
   * ```
   */
  public intersect<A>(
    this: Vector<A>,
    that: Vector<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Vector<A> {
    return this.intersectBy(that, E.equals);
  }

  /**
   * Version of {@link intersect} that uses user-supplied equality check `eq`.
   */
  public intersectBy<A>(
    this: Vector<A>,
    that: Vector<A>,
    eq: (x: A, y: A) => boolean,
  ): Vector<A> {
    return this.filter(x => that.any(y => eq(x, y)));
  }

  // -- Folds

  /**
   * _O(n)_ Apply `f` to each element of the vector for its side-effect.
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
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      f(xs[i]);
    }
  }

  /**
   * Right-to-left dual of {@link forEach}.
   */
  public forEachRight(f: (a: A) => void): void {
    const xs = this.xs;
    for (let i = this.start, end = this.end; i < end; i++) {
      f(xs[end - i - 1]);
    }
  }

  /**
   * _O(n)_ Apply a left-associative operator `f` to each element of the vector
   * reducing it from left to right:
   *
   * ```typescript
   * Vector(x1, x2, ..., xn) === f( ... f(f(z, x1), x2), ... xn)
   * ```
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4, 5).foldLeft(0, (x, y) => x + y)
   * // 15
   *
   * > Vector.empty.foldLeft(42, (x, y) => x + y)
   * // 42
   * ```
   */
  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    const end = this.end;
    const xs = this.xs;
    for (let i = this.start; i < end; i++) {
      z = f(z, xs[i]);
    }
    return z;
  }

  /**
   * _O(n)_ Version of {@link foldLeft} without initial value and therefore it
   * can be applied only to non-empty structures.
   *
   * @note This function is partial.
   *
   * @examples
   *
   * ```typescript
   * > vector(1, 2, 3).foldLeft1((x, y) => x + y)
   * // 6
   *
   * > Seq.empty.foldLeft1((x, y) => x + y)
   * // Uncaught Error: Vector.empty: foldLeft1
   * ```
   */
  public foldLeft1<A>(this: Vector<A>, f: (acc: A, x: A) => A): A {
    if (this.isEmpty) throw new Error('Vector.empty: foldLeft1');
    const end = this.end;
    const xs = this.xs;
    let z = xs[this.start];
    for (let i = this.start + 1; i < end; i++) {
      z = f(z, xs[i]);
    }
    return z;
  }

  /**
   * _O(n)_ Apply a right-associative operator `f` to each element of the vector,
   * reducing it from right to left lazily:
   *
   * ```typescript
   * Vector(x1, x2, ..., xn).foldRight(z, f) === f(x1, Eval.defer(() => f(x2, ... Eval.defer(() => f(xn, z), ... ))))
   * ```
   *
   * @see {@link foldRight_} for the strict, non-short-circuiting version.
   *
   * @examples
   *
   * ```typescript
   * > Vector(false, true, false).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
   * // true
   *
   * > Vector(false).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
   * // false
   *
   * > Vector(true).foldRight(Eval.bottom(), (x, r) => x ? Eval.true : r).value
   * // true
   * ```
   */
  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    let idx = this.start;
    const xs = this.xs;
    const end = this.end;
    const go: Eval<B> = Eval.defer(() => (idx >= end ? ez : f(xs[idx++], go)));
    return go;
  }

  /**
   * _O(n)_ Version of `foldRight` without initial value and therefore it can be
   * applied only to non-empty structures.
   *
   * @note This function is partial.
   *
   * @see {@link foldRight1_} for the strict, non-short-circuiting version.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3).foldRight1((x, ey) => ey.map(y => x + y)).value
   * // 6
   *
   * > Vector.empty.foldRight1((x, ey) => ey.map(y => x + y)).value
   * // Uncaught Error: Vector.empty: foldRight1
   * ```
   */
  public foldRight1<A>(
    this: Vector<A>,
    f: (a: A, r: Eval<A>) => Eval<A>,
  ): Eval<A> {
    const size = this.size;
    switch (size) {
      case 0:
        return Eval.always(() =>
          throwError(new Error('Vector.empty: foldRight1')),
        );
      case 1:
        return Eval.now(this.xs[this.start]);
      default: {
        let idx = this.start;
        const xs = this.xs;
        const end = this.end - 1;
        const go: Eval<A> = Eval.defer(() =>
          idx >= end ? Eval.now(xs[idx]) : f(xs[idx++], go),
        );
        return go;
      }
    }
  }

  /**
   * Strict, non-short-circuiting version of the {@link foldRight}.
   */
  public foldRight_<B>(z: B, f: (a: A, b: B) => B): B {
    const xs = this.xs;
    for (let i = this.end - 1; i >= this.start; i--) {
      z = f(xs[i], z);
    }
    return z;
  }

  /**
   * Strict, non-short-circuiting version of the {@link foldRight1}.
   */
  public foldRight1_<A>(this: Vector<A>, f: (x: A, acc: A) => A): A {
    if (this.isEmpty) throw new Error('Vector.empty: foldRight1_');
    const xs = this.xs;
    let z = xs[this.end - 1];
    for (let i = this.end - 2; i >= this.start; i--) {
      z = f(xs[i], z);
    }
    return z;
  }

  private foldRightReversed<B>(
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): Eval<B> {
    let idx = this.end - 1;
    const xs = this.xs;
    const start = this.start;
    const go: Eval<B> = Eval.defer(() => (idx < start ? ez : f(xs[idx--], go)));
    return go;
  }

  /**
   * _O(n)_ Right associative, lazy fold mapping each element of the structure
   * into a monoid `M` and combining their results using {@link Monoid.combineEval}.
   *
   * `xs.folMap(M, f)` is equivalent to `xs.foldRight(Eval.now(M.empty), (a, eb) => M.combineEval_(f(a), eb)).value`
   *
   * @see {@link foldMapK} for a version accepting a `MonoidK` instance
   * @see {@link foldMapLeft} for a left-associative, strict variant
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 3, 5).foldMap(Monoid.addition, id)
   * // 9
   *
   * > Vector(1, 3, 5).foldMap(Monoid.product, id)
   * // 15
   * ```
   */
  public foldMap<M>(M: Monoid<M>, f: (a: A) => M): M {
    return this.foldRight(Eval.now(M.empty), (x, r) => M.combineEval_(f(x), r))
      .value;
  }

  /**
   * Version of {@link foldMap} that accepts {@link MonoidK} instance.
   */
  public foldMapK<F, B>(
    F: MonoidK<F>,
    f: (a: A) => Kind<F, [B]>,
  ): Kind<F, [B]> {
    return this.foldMap(F.algebra<B>(), f);
  }

  /**
   * Left-associative, strict version of {@link foldMap}.
   */
  public foldMapLeft<M>(M: Monoid<M>, f: (a: A) => M): M {
    return this.foldLeft(M.empty, (b, x) => M.combine_(b, f(x)));
  }

  // -- Sorted Vectors

  /**
   * _O(n * log(n))_ Return sorted vector.
   *
   * @see {@link sortBy} for user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 6, 4, 3, 2, 5).sort()
   * // Vector(1, 2, 3, 4, 5, 6)
   * ```
   */
  public sort<A>(
    this: Vector<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Vector<A> {
    return this.sortBy(O.compare);
  }

  /**
   * _O(n * log(n))_ Return a vector sorted by comparing results of function `f`
   * applied to each of the element of the vector.
   *
   * @examples
   *
   * ```typescript
   * > Vector([2, 'world'], [4, '!'], [1, 'Hello']).sortOn(([fst, ]) => fst)
   * // Vector([1, 'Hello'], [2, 'world'], [4, '!']])
   * ```
   */
  public sortOn<B>(
    f: (a: A) => B,
    O: Ord<B> = Ord.fromUniversalCompare(),
  ): Vector<A> {
    return this.sortBy((l, r) => O.compare(f(l), f(r)));
  }

  /**
   * Version of {@link sort} function using a user-supplied comparator `cmp`.
   */
  public sortBy(cmp: (l: A, r: A) => Compare): Vector<A> {
    return Vector.fromArray(this.toArray.sort((x, y) => cmp(x, y) - 1));
  }

  /**
   * _O(n)_ Inserts the element at the first position which is less, or equal to
   * the inserted element. In particular, if the vector is sorted to begin with,
   * it will remain to be sorted.
   *
   * @see {@link insertBy} for user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 5, 6, 7).insert(4)
   * // Vector(1, 2, 3, 4, 5, 6, 7)
   * ```
   */
  public insert<A>(
    this: Vector<A>,
    x: A,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Vector<A> {
    return this.insertBy(x, O.compare);
  }

  /**
   * Version of {@link insert} function using a user-supplied comparator `cmp`.
   */
  public insertBy<A>(
    this: Vector<A>,
    x: A,
    cmp: (x: A, y: A) => Compare,
  ): Vector<A> {
    const idx = this.findIndex(y => cmp(x, y) !== Compare.GT);
    return idx.isEmpty ? this.append(x) : this.insertAt(idx.get, x);
  }

  // -- Traversals

  /**
   * Transform each element of the structure into an applicative action and
   * evaluate them left-to-right combining their result into a `List`.
   *
   * `traverse` uses {@link Applicative.map2Eval} function of the provided
   * applicative `G` allowing for short-circuiting.
   *
   * @see {@link traverse_} for result-ignoring version.
   *
   * @examples
   *
   * ```typescript
   * > Vector(1, 2, 3, 4).traverse(Option.Monad, Some)
   * // Some(Vector(1, 2, 3, 4))
   *
   * > Vector(1, 2, 3, 4).traverse(Option.Monad, _ => None)
   * // None
   * ```
   */
  public traverse<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [B]>,
  ): Kind<G, [Vector<B>]> {
    return isIdentityTC(G)
      ? (this.map(f) as any)
      : G.map_(
          Traversable.Array.traverse_(G)(this.toArray, f),
          Vector.fromArray,
        );
  }

  /**
   * Transform each element of the structure into an applicative action and
   * evaluate them left-to-right ignoring the results.
   *
   * `traverse_` uses {@link Applicative.map2Eval} function of the provided
   * applicative `G` allowing for short-circuiting.
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
   * _O(n)_ Version of {@link traverse} which removes elements of the original
   * vector.
   *
   * @examples
   *
   * ```typescript
   * > const m: Map<number, string> = Map([1, 'one'], [3, 'three'])
   * > Vector(1, 2, 3).traverseFilter(
   * >   Monad.Eval,
   * >   k => Eval.now(m.lookup(k)),
   * > ).value
   * // Vector('one', 'three')
   * ```
   */
  public traverseFilter<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [Option<B>]>,
  ): Kind<G, [Vector<B>]> {
    return isIdentityTC(G)
      ? (this.collect(f as any) as any)
      : G.map_(
          TraversableFilter.Array.traverseFilter_(G)(this.toArray, f),
          Vector.fromArray,
        );
  }

  // -- Strings

  public join(this: Vector<string>, sep: string = ','): string {
    if (this.isEmpty) return '';
    return this.tail.foldLeft(this.head, (r, x) => r + sep + x);
  }

  public toString(): string {
    return `Vector(${this.map(String).join(',')})`;
  }

  // -- Misc

  public equals<A>(
    this: Vector<A>,
    that: Vector<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    if (this === that) return true;
    if (this.size !== that.size) return false;
    const sx = this.start;
    const sy = that.start;
    for (let i = 0, sz = this.size; i < sz; i++) {
      if (E.notEquals(this.xs[i + sx], that.xs[i + sy])) return false;
    }
    return true;
  }
}

Vector.empty = new _Vector([], 0, 0);

Vector.tailRecM_ = <A, B>(
  a: A,
  f: (a: A) => Vector<Either<A, B>>,
): Vector<B> => {
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

  return Vector.fromArray(buf);
};

Vector.Eq = cached(
  <A>(E: Eq<A>): Eq<Vector<A>> =>
    Eq.of<Vector<A>>({
      equals: (xs, ys) => xs.equals(ys, E),
    }),
);

Vector.EqK = null as any as EqK<VectorF>;
Vector.MonadPlus = null as any as MonadPlus<VectorF>;
Vector.Monad = null as any as Monad<VectorF>;
Vector.Alternative = null as any as Alternative<VectorF>;
Vector.Foldable = null as any as Foldable<VectorF>;
Vector.Traversable = null as any as Traversable<VectorF>;
Vector.TraversableFilter = null as any as TraversableFilter<VectorF>;
Vector.CoflatMap = null as any as CoflatMap<VectorF>;
Vector.Align = null as any as Align<VectorF>;
Vector.Unzip = null as any as Unzip<VectorF>;

const vectorEqK = lazy(() => EqK.of<VectorF>({ liftEq: Vector.Eq }));

const vectorFunctor = lazy(() =>
  Functor.of<VectorF>({
    map_: (xs, f) => xs.map(f),
  }),
);

const vectorFunctorFilter = lazy(() =>
  FunctorFilter.of<VectorF>({
    ...vectorFunctor(),
    mapFilter_: (xs, f) => xs.collect(f),
    collect_: (xs, f) => xs.collect(f),
    filter_: <A>(xs: Vector<A>, f: (a: A) => boolean): Vector<A> =>
      xs.filter(f),
    filterNot_: (xs, f) => xs.filterNot(f),
  }),
);

const vectorMonoidK = lazy(() =>
  MonoidK.of<VectorF>({
    emptyK: () => Vector.empty,
    combineK_: (xs, ys) => xs.concat(ys),
    combineKEval_: (xs, ys) => (xs.isEmpty ? ys : ys.map(ys => xs.concat(ys))),
  }),
);

const vectorApplicative = lazy(() =>
  Applicative.of<VectorF>({
    ...vectorFunctor(),
    pure: Vector.singleton,
    ap_: (ff, fa) => ff.map2(fa, (f, a) => f(a)),
    map2_: (xs, ys, f) => xs.map2(ys, f),
    map2Eval_: (xs, eys, f) => xs.map2Eval(eys, f),
  }),
);

const vectorAlternative = lazy(() =>
  Alternative.of<VectorF>({
    ...vectorMonoidK(),
    ...vectorApplicative(),
  }),
);

const vectorMonad = lazy(() =>
  Monad.of<VectorF>({
    ...vectorApplicative(),
    flatMap_: (fa, f) => fa.flatMap(f),
    tailRecM_: Vector.tailRecM_,
  }),
);

const vectorMonadPlus = lazy(() =>
  MonadPlus.of<VectorF>({
    ...vectorMonad(),
    ...vectorFunctorFilter(),
    ...vectorAlternative(),
  }),
);

const vectorFoldable = lazy(() =>
  Foldable.of<VectorF>({
    foldLeft_: (xs, z, f) => xs.foldLeft(z, f),
    foldRight_: (xs, ez, f) => xs.foldRight(ez, f),
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(xs: Vector<A>, f: (a: A) => M) =>
        xs.foldMap(M, f),

    elem_: (xs, idx) => xs.getOption(idx),
    any_: (xs, f) => xs.any(f),
    all_: (xs, f) => xs.all(f),
    count_: (xs, f) => xs.count(f),
    get_: (xs, f) => xs.getOption(f),
    size: xs => xs.size,
    isEmpty: xs => xs.isEmpty,
    nonEmpty: xs => xs.nonEmpty,
    iterator: xs => xs.iterator,
    toArray: xs => xs.toArray,
  }),
);

const vectorTraversable = lazy(() =>
  Traversable.of<VectorF>({
    ...vectorFunctor(),
    ...vectorFoldable(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(xs: Vector<A>, f: (a: A) => Kind<G, [B]>) =>
        xs.traverse(G, f),
  }),
);

const vectorTraversableFilter = lazy(() =>
  TraversableFilter.of<VectorF>({
    ...vectorTraversable(),
    ...vectorFunctorFilter(),
    traverseFilter_:
      <G>(G: Applicative<G>) =>
      <A, B>(xs: Vector<A>, f: (a: A) => Kind<G, [Option<B>]>) =>
        xs.traverseFilter(G, f),
  }),
);

const vectorCoflatMap = lazy(() =>
  CoflatMap.of<VectorF>({
    ...vectorFunctor(),
    coflatMap_: (xs, f) => xs.coflatMap(f),
  }),
);

const vectorAlign = lazy(() =>
  Align.of<VectorF>({
    ...vectorFunctor(),
    align_: (xs, ys) => xs.align(ys),
  }),
);

const vectorUnzip = lazy(() =>
  Unzip.of<VectorF>({
    ...vectorFunctor(),
    zipWith_: (xs, ys, f) => xs.zipWith(ys, f),
    zip_: (xs, ys) => xs.zip(ys),
    unzip: xs => xs.unzip(),
    unzipWith_: (xs, f) => xs.unzipWith(f),
  }),
);

Object.defineProperty(Vector, 'EqK', {
  get() {
    return vectorEqK();
  },
});
Object.defineProperty(Vector, 'Monad', {
  get() {
    return vectorMonad();
  },
});
Object.defineProperty(Vector, 'MonadPlus', {
  get() {
    return vectorMonadPlus();
  },
});
Object.defineProperty(Vector, 'Alternative', {
  get() {
    return vectorAlternative();
  },
});
Object.defineProperty(Vector, 'Foldable', {
  get() {
    return vectorFoldable();
  },
});
Object.defineProperty(Vector, 'Traversable', {
  get() {
    return vectorTraversable();
  },
});
Object.defineProperty(Vector, 'TraversableFilter', {
  get() {
    return vectorTraversableFilter();
  },
});
Object.defineProperty(Vector, 'CoflatMap', {
  get() {
    return vectorCoflatMap();
  },
});
Object.defineProperty(Vector, 'Align', {
  get() {
    return vectorAlign();
  },
});
Object.defineProperty(Vector, 'Unzip', {
  get() {
    return vectorUnzip();
  },
});

function iob(): never {
  throw new Error('IndexOutOfBounds');
}

// -- HKT

export interface VectorF extends TyK<[unknown]> {
  [$type]: Vector<TyVar<this, 0>>;
}
