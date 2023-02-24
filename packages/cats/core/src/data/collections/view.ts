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
import { Alternative } from '../../alternative';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { Foldable } from '../../foldable';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Monad } from '../../monad';
import { MonoidK } from '../../monoid-k';
import { TraversableFilter } from '../../traversable-filter';
import { Unzip } from '../../unzip';

import { Either, Left, Right } from '../either';
import { isIdentityTC } from '../identity';
import { None, Option, Some } from '../option';

import { Set as OrdSet } from './set';
import { List, ListBuffer } from './list';
import { LazyList } from './lazy-list';
import { Vector } from './vector';
import { Map } from './map';
import { Seq } from './seq';

/**
 * Lazy, ordered sequence collection.
 *
 * View is a collection which operations are lazy, or non-strict. This means that
 * the operations are not performed until the collection is effectively traversed
 * (e.g., using `forEach`/`foldLeft`) or converted to a strict collection.
 *
 * This way we can effectively avoid creating intermediate copies of collections
 * when performing chain of operations on a collection. For example, the
 * following code should not create any intermediate copies of the `List`:
 *
 * ```typescript
 * const xs: List<A> = ...;
 * const ys = xs.view
 *  .map(f)
 *  .filter(p)
 *  .map(h)
 *  .toList;
 * ```
 *
 * To construct a view, use one of the constructor attached on the `View` class
 * directly, or transform any of the fp4ts collections to a `View` using the
 * an appropriate `.view` method.
 *
 * To construct a fully customized view, one can use view's dedicated `build`
 * constructor. Views are [church-encoded](https://en.wikipedia.org/wiki/Church_encoding#Represent_the_list_using_right_fold)
 * lists implemented by their `foldRight` method. This representation allows us
 * to represent possibly infinite collections using finite memory and traverse
 * them very efficiently because we don't need to allocate any additional memory
 * to store contained data.
 *
 * @see _View
 * @see _View.foldRight
 */
export type View<A> = _View<A>;
/**
 *
 * Construct a view by enumerating its contents.
 */
export const View = function <A = never>(...xs: readonly A[]): View<A> {
  return View.fromArray(xs);
};

/**
 * Create a view by providing it's `foldRight` method.
 */
View.build = <A>(
  g: <B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>) => Eval<B>,
): View<A> => new _View(g);

/**
 * Construct an empty `View` that does not contain any elements.
 */
View.empty = null as any as View<never>; // View.build<never>((ez, _f) => ez);
// ^  defined below to allow class to load

View.cons = <A>(x: A, exs: View<A>): View<A> => exs.prepend(x);

View.consEval = <A>(x: A, exs: Eval<View<A>>): View<A> =>
  View.build((ez, f) =>
    f(
      x,
      exs.flatMap(fldr => fldr.foldRight(ez, f)),
    ),
  );

/**
 * Construct a singleton `View`.
 */
View.singleton = <A>(x: A): View<A> => View.build((ez, f) => f(x, ez));

/**
 * Defer the definition of the `View`.
 *
 * This function is helpful when defining recursive views such as:
 *
 * ```typescript
 * > const xs: View<number> = View.defer(() => View.range(0, 2).concat(xs));
 * > xs.take(20).toArray
 * // [0, 1, 2, 0, 1, 2, 0, 1, 2, ...
 * ```
 */
View.defer = <A>(thunk: () => View<A>): View<A> => {
  const l = lazy(thunk);
  return View.build((ez, f) => Eval.defer(() => l().foldRight(ez, f)));
};

/**
 * Create a possibly infinite stream of numbers starting at `from` lower bounds
 * and ended by `to - 1`. Should one provide only the lower bound, the view
 * returned by the function is going to be unbounded (or, infinite) as well.
 *
 * @examples
 *
 * ```typescript
 * > View.range(0, 5).toArray
 * // [0, 1, 2, 3, 4]
 *
 * > View.range(4).toArray
 * // [4, 5, 6, 7, 8, 9, ...
 * ```
 */
View.range = (from: number, to: number = Infinity): View<number> =>
  View.build(<B>(ez: Eval<B>, f: (a: number, eb: Eval<B>) => Eval<B>) => {
    let cur = from;
    const go: Eval<B> = Eval.defer(() => (cur >= to ? ez : f(cur++, go)));
    return go;
  });

/**
 * Creates an infinite stream of values where every element is an `a`.
 *
 * @examples
 *
 * ```typescript
 * > View.repeat(42).take(10).toArray
 * // [42, 42, 42, ...
 * ```
 */
View.repeat = <A>(a: A): View<A> =>
  View.build(<B>(_ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>) => {
    const go: Eval<B> = Eval.defer(() => f(a, go));
    return go;
  });

/**
 * Creates an infinite stream of repeated application of `f` on `a`:
 *
 * ```typescript
 * View.iterate(x, f) == [x, f(x), f(f(x)), f(f(f(x))), ...
 * ```
 *
 * @examples
 *
 * ```typescript
 * > View.iterate(x, f).take(10).toArray
 * // [x, f(x), f(f(x)), f(f(f(x))), ...
 *
 * > View.iterate(true, x => !x).take(5).toArray
 * // [true, false, true, false, true]
 *
 * > View.iterate(0, x => x + 1).take(5).toArray
 * // [0, 1, 2, 3, 4]
 * ```
 */
View.iterate = <A>(a: A, f: (a: A) => A): View<A> =>
  View.build(<B>(_ez: Eval<B>, g: (a: A, eb: Eval<B>) => Eval<B>) => {
    let x = a;
    const go: Eval<B> = Eval.defer(() => g((x = f(x)), go));
    return g(x, go);
  });

/**
 * Creates a view of size `n` filled with elements `a`.
 *
 * @examples
 *
 * ```typescript
 * > View.replicate(true, 0).toArray
 * // []
 *
 * > View.replicate(true, -1).toArray
 * // []
 *
 * > View.replicate(true, 5).toArray
 * // [true, true, true, true, true]
 * ```
 */
View.replicate = <A>(a: A, n: number): View<A> => View.repeat(a).take(n);

/**
 * Dual to `foldRight` function: while `foldRight` reduces the structure into
 * a single result, `unfoldRight` build a (potentially infinite) view from the
 * seed value `z` and a function `f`. The build ends once function `f` returns
 * `None`.
 *
 * ```typescript
 * const iterate = <A>(a: A, f: (a: A) => A): View<A> =>
 *   View.unfoldRight(a, a => Some([a, f(a)]);
 * ```
 *
 * @examples
 *
 * ```typescript
 * > View.unfoldRight(10, x => x > 0 ? Some([x, x - 1]) : None).toArray;
 * // [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
 * ```
 */
View.unfoldRight = <A, B>(z: B, f: (b: B) => Option<[A, B]>): View<A> =>
  View.build(<X>(ez: Eval<X>, g: (a: A, ex: Eval<X>) => Eval<X>) => {
    let cur = z;
    const end = () => ez;
    const cont = ([a, next]: [A, B]) => ((cur = next), g(a, go));
    const go: Eval<X> = Eval.defer(() => f(cur).fold(end, cont));
    return go;
  });

View.tailRecM_ = <A, B>(a: A, f: (a: A) => View<Either<A, B>>): View<B> => {
  return View.build(
    <X>(ez: Eval<X>, g: (b: B, ex: Eval<X>) => Eval<X>): Eval<X> => {
      const go = (ea: Either<A, B>, ex: Eval<X>): Eval<X> =>
        ea.isEmpty
          ? Eval.defer(() => f(ea.getLeft).foldRight(ex, go)) // stack safety granted by Eval
          : g(ea.get, ex);

      return f(a).foldRight(ez, go);
    },
  );
};

/**
 * Construct a view from an array.
 */
View.fromArray = <A>(xs: readonly A[]): View<A> => {
  switch (xs.length) {
    case 0:
      return View.empty;
    case 1:
      return View.singleton(xs[0]);
    default:
      return View.build(<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>) => {
        let idx = 0;
        const sz = xs.length;
        const go: Eval<B> = Eval.defer(() =>
          idx >= sz ? ez : f(xs[idx++], go),
        );
        return go;
      });
  }
};

/**
 * Construct a view from a `List`.
 */
View.fromList = <A>(xs: List<A>): View<A> =>
  View.build(<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>) =>
    xs.foldRight(ez, f),
  );

/**
 * Construct a view from a `LazyList`.
 */
View.fromLazyList = <A>(xs: LazyList<A>): View<A> =>
  View.build(<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>) =>
    xs.foldRight(ez, f),
  );

/**
 * Construct a view from a `strings`. The resulting view is a view of single
 * character strings from the source string.
 *
 * @examples
 *
 * ```typescript
 * > View.fromString('abc').toArray;
 * // ['a', 'b', 'c']
 * ```
 */
View.fromString = (s: string): View<string> => View.fromIterable(s);

/**
 * Constructs a view by splitStringAt the provided `src` string using separator `sep`.
 *
 * @examples
 *
 * ```typescript
 * > View.splitStringAt('a b c', ' ').toArray
 * // ['a', 'b', 'c']
 *
 * > View.splitStringAt(' a b c', ' ').toArray
 * // ['', 'a', 'b', 'c']
 *
 * > View.splitStringAt('a b c ', ' ').toArray
 * // ['a', 'b', 'c', '']
 *
 * > View.splitStringAt('a  b c', ' ').toArray
 * // ['a', '', 'b', 'c', '']
 *
 * > View.splitStringAt('abc', '').toArray
 * // ['a', 'b', 'c']
 * ```
 */
View.splitStringAt = (src: string, sep: string): View<string> =>
  sep === ''
    ? View.fromString(src)
    : View.build(<B>(ez: Eval<B>, g: (a: string, eb: Eval<B>) => Eval<B>) => {
        let rem = src;
        const go: Eval<B> = Eval.defer(() => {
          if (rem === '') return g('', ez);

          const idx = rem.indexOf(sep);
          if (idx < 0) return g(rem, ez);

          const next = rem.slice(0, idx);
          rem = rem.slice(idx + sep.length);
          return g(next, go);
        });
        return go;
      });

/**
 * Construct a view from any `Iterable<A>`.
 */
View.fromIterable = <A>(xs: Iterable<A>): View<A> =>
  xs instanceof _View
    ? xs
    : View.build(<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>) => {
        const it: Iterator<A> = xs[Symbol.iterator]();
        const go: Eval<B> = Eval.defer(() => {
          const x = it.next();
          return x.done ? ez : f(x.value, go);
        });
        return go;
      });

/**
 * Construct a view from an `Kind<F, [A]>` using its `Foldable` instance.
 */
View.fromFoldable =
  <F>(F: Foldable<F>) =>
  <A>(fa: Kind<F, [A]>): View<A> =>
    View.build((ez, f) => F.foldRight_(fa, ez, f));

/**
 * Construct a view from an `Iterator`.
 *
 * This constructor actually creates a `LazyList` from the iterator first, to
 * ensure we can actually traverse the values yielded by the iterator more than
 * once.
 */
View.fromIterator = <A>(iter: Iterator<A>): View<A> =>
  View.fromLazyList(LazyList.fromIterator(iter));

export class _View<A> {
  public constructor(
    /**
     * Apply a right-associative operator `f` to each element of the `View`,
     * reducing the view from right to left lazily:
     *
     * ```typescript
     * View(x1, x2, ..., xn).foldRight(z, f) === f(x1, Eval.defer(() => f(x2, ... Eval.defer(() => f(xn, z), ... ))))
     * ```
     *
     * @examples
     *
     * ```typescript
     * > View(false, true, false).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
     * // true
     *
     * > View(false).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
     * // false
     *
     * > View.repeat(true).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
     * // true
     * ```
     *
     * #### Laziness and short-circuiting
     *
     * Although `foldRight` on infinite structures usually doesn't terminate, it
     * may terminate in one of the following conditions:
     *
     *   1. the folding function `f` is short-circuiting
     *   2. the folding function is lazy in its second argument
     *
     * This behavior is provided using the `Eval` data type from `@fp4ts/core`
     * package.
     *
     * ##### Short-circuiting
     *
     * Should the tail of the computation not be needed, the computation on infinite
     * structure terminates:
     *
     * ```typescript
     * > View.repeat(true)
     * >   .foldRight(Eval.false, (x, r) => x ? Eval.true // short-circuit
     *                                        : r
     *       ).value
     * // true
     * ```
     *
     * But the following doesn't:
     *
     * ```
     * > View.repeat(false).foldRight(Eval.false, (x, r) => x ? Eval.true : r).value
     * // *hangs*
     * ```
     * ##### Laziness
     *
     * Executing `foldRight` on an infinite structure terminates if the folding
     * function `f` is lazy in its second argument. In other words, the `Eval`
     * instance passed as the tail of the computation is not required to be
     * used for the result:
     *
     * ```typescript
     * > const add = (x: number) => (y: number): number => x + y
     * > View.repeat(1)
     * >   .foldRight(
     * >     Eval.now(View.empty as View<number>),
     * >     (i: number, eac: Eval<View<number>>) =>
     * >       // we return immediate (or, strict) result within which we
     * >       // encapsule the tail of the infinite structure using `consEval`.
     * >       Eval.now(View.consEval(i, eac.map(ac => ac.map(add(3))))
     * >   )
     * > ).value
     * >  .take(5) // execute eval
     * // [1, 4, 7, 10, 13]
     * ```
     */
    public readonly foldRight: <B>(
      ez: Eval<B>,
      f: (a: A, eb: Eval<B>) => Eval<B>,
    ) => Eval<B>,
  ) {}

  /**
   * Extracts the first element of the view, which must be non-empty.
   *
   * `head` is a strict, short-circuiting operation that evaluates view until
   * the first element is found.
   *
   * @note This function is partial.
   *
   * @see headOption for a safe variant
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).head
   * // 1
   *
   * > View.range(1).head
   * // 1
   *
   * > View.empty.head
   * // Uncaught Error: View.head: empty View
   * ```
   */
  public get head(): A {
    return this.foldRight(emptyHead as Eval<A>, (a, _eb) => Eval.now(a)).value;
  }

  /**
   * Safe version of the `head` which optionally returns the first element of
   * the view.
   *
   * `headOption` is a strict, short-circuiting operation that evaluates view
   * until the first element is found.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).head
   * // Some(1)
   *
   * > View.range(1).head
   * // Some(1)
   *
   * > View.empty.head
   * // None
   * ```
   */
  public get headOption(): Option<A> {
    return this.foldMapK(Option.Alternative, Some);
  }

  /**
   * Extracts the elements of the view which come after the initial head. Equivalent
   * to:
   *
   * ```typescript
   * xs.tail == xs.drop(1)
   * ```
   *
   * As such, it is safe to perform `tail` on empty views as well. `tail` is lazy
   * and does not evaluate the view immediately.
   *
   * @examples
   *
   *```typescript
   * > View(1, 2, 3).tail.toArray
   * // [2, 3]
   *
   * > View(1).tail.toArray
   * // []
   *
   * > View.empty.tail.toArray
   * // []
   * ```
   */
  public get tail(): View<A> {
    return this.drop(1);
  }

  /**
   * Extracts the last element of the view, which must be non-empty.
   *
   * `last` is a strict function requiring the entire view to be evaluated.
   *
   * @note This is a partial function.
   *
   * @see lastOption for a safe variant
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).last
   * // 3
   *
   * > View(1).last
   * // 1
   *
   * > View.empty.last
   * // Uncaught Error: View.last: empty View
   *
   * > View.range(1).last
   * // *hangs*
   * ```
   */
  public get last(): A {
    return this.lastOption.getOrElse(emptyLast);
  }

  /**
   * Optionally extracts the last element of the view.
   *
   * `last` is a strict function requiring the entire view to be evaluated.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).last
   * // Some(3)
   *
   * > View(1).last
   * // Some(1)
   *
   * > View.empty.last
   * // None
   *
   * > View.range(1).last
   * // *hangs*
   * ```
   */
  public get lastOption(): Option<A> {
    let last: A | undefined;
    let seen = false;
    this.forEach(x => ((seen = true), (last = x)));
    return seen ? Some(last!) : None;
  }

  /**
   * Extract all elements of the view expect from the last one.
   *
   * `init` is lazy and does not require view to be evaluated immediately.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).init.toArray
   * // [1, 2]
   *
   * > View(1).init.toArray
   * // []
   *
   * > View.empty.init.toArray
   * // []
   * ```
   */
  public get init(): View<A> {
    return this.zipPrevWith((prev, _x) => prev);
  }

  /**
   * Returns `true` if the view is empty, or `false` otherwise.
   *
   * `isEmpty` is a strict, short-circuiting function that requires evaluation
   * of at least a single element.
   *
   * @examples
   *
   * ```typescript
   * > View.empty.isEmpty
   * // true
   *
   * > View(1).isEmpty
   * // false
   *
   * > View.repeat(1).isEmpty
   * // false
   * ```
   */
  public get isEmpty(): boolean {
    return this.foldMap(Monoid.conjunction, _ => false);
  }

  /**
   * Returns `true` if the view is not empty, or `false` otherwise. An inverse of
   * `isEmpty`:
   *
   * ```typescript
   * xs.nonEmpty == !xs.isEmpty
   * ```
   *
   * `nonEmpty` is a strict, short-circuiting function that requires evaluation
   * of at least a single element.
   *
   * @examples
   *
   * ```typescript
   * > View.empty.nonEmpty
   * // false
   *
   * > View(1).nonEmpty
   * // true
   *
   * > View.repeat(1).nonEmpty
   * // true
   * ```
   */
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }

  /**
   * Returns the size of the view.
   *
   * `size` is a strict function that requires evaluation of the entire view.
   *
   * @examples
   *
   * ```typescript
   * > View.empty.size
   * // 0
   *
   * > View(1, 2, 3)
   * // 3
   *
   * > View.repeat(1)
   * // *hangs*
   * ```
   */
  public get size(): number {
    return this.foldLeft(0, (x, _) => x + 1);
  }

  /**
   * Converts the view into an array.
   */
  public get toArray(): A[] {
    const rs: A[] = [];
    this.forEach(x => rs.push(x));
    return rs;
  }

  /**
   * Converts the view into a `List`.
   */
  public get toList(): List<A> {
    return this.foldLeft(new ListBuffer<A>(), (b, x) => b.addOne(x)).toList;
  }

  /**
   * Converts the view into a `LazyList`. Since `LazyList` is a lazy collection,
   * the view does not get evaluated until the elements are accessed.
   */
  public get toLazyList(): LazyList<A> {
    return LazyList.fromView(this);
  }

  /**
   * Converts the view into a `Vector`.
   */
  public get toVector(): Vector<A> {
    return Vector.fromArray(this.toArray);
  }

  /**
   * Converts the view into a `Seq`.
   */
  public get toSeq(): Seq<A> {
    return this.foldLeft(Seq.empty as Seq<A>, (b, x) => b.prepend(x));
  }

  /**
   * Convert the view into an `Option`, returning `Some(head)` in case of an
   * non-empty view, or `None` otherwise.
   *
   * `xs.toOption` is equivalent to `xs.headOption`.
   *
   * `headOption` is strict and short-circuiting, requiring evaluation of at least
   * one element of the view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).toOption
   * // Some(1)
   *
   * > View(1).toOption
   * // Some(1)
   *
   * > View.repeat(1).toOption
   * // Some(1)
   *
   * > View.empty.toOption
   * // None
   * ```
   */
  public get toOption(): Option<A> {
    return this.foldRight(emptyOption as Eval<Option<A>>, (x, _r) =>
      Eval.now(Some(x)),
    ).value;
  }

  /**
   * Convert the view into an `Either`, returning `Right(head)` in case of an
   * non-empty view, or `Left(left)` otherwise.
   *
   * `xs.toRight(left)` is equivalent to `xs.toOption.toRight(left)`
   *
   * `toRight` is strict and short-circuiting, requiring evaluation of at least
   * one element of the view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).toRight(() => 42)
   * // Right(1)
   *
   * > View(1).toRight(() => 42)
   * // Right(1)
   *
   * > View.repeat(1).toRight(() => 42)
   * // Right(1)
   *
   * > View.empty.toRight(() => 42)
   * // Left(42)
   * ```
   */
  public toRight<E>(left: () => E): Either<E, A> {
    return this.foldRight(
      Eval.later(() => Left<E, A>(left())),
      (x, _r) => Eval.now(Right(x)),
    ).value;
  }

  /**
   * Convert the view into an `Either`, returning `Left(head)` in case of an
   * non-empty view, or `Right(right)` otherwise.
   *
   * `xs.toLeft(right)` is equivalent to `xs.toOption.toLeft(right)`
   *
   * `toRight` is strict and short-circuiting, requiring evaluation of at least
   * one element of the view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).toLeft(() => 42)
   * // Left(1)
   *
   * > View(1).toLeft(() => 42)
   * // Left(1)
   *
   * > View.repeat(1).toLeft(() => 42)
   * // Left(1)
   *
   * > View.empty.toLeft(() => 42)
   * // Right(42)
   * ```
   */
  public toLeft<B>(right: () => B): Either<A, B> {
    return this.foldRight(
      Eval.later(() => Right<B, A>(right())),
      (x, _r) => Eval.now(Left(x)),
    ).value;
  }

  /**
   * Converts the view into a `Set` using provided `Ord<A>` instance, or
   * `Ord.fromUniversalCompare()` if not provided.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).toSet()
   * // Set(1, 2, 3)
   *
   * > View(1, 2, 2, 3, 3).toSet()
   * // Set(1, 2, 3)
   *
   * > View.empty.toSet()
   * // Set()
   *
   * > View.repeat(1).toSet()
   * // *hangs*
   * ```
   */
  public toSet<A>(
    this: View<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): OrdSet<A> {
    return this.foldLeft(OrdSet.empty as OrdSet<A>, (xs, x) => xs.insert(x, O));
  }

  /**
   * Converts the view of tuples `[K, V] into a `Map` using provided `Ord<A>`
   * instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * @examples
   *
   * ```typescript
   * > View([1, 'a'], [2, 'b'], [3, 'c']).toMap()
   * // Map([1, 'a'], [2, 'b'], [3, 'c'])
   *
   * > View([1, 'a'], [2, 'b'], [2, 'c'], [3, 'd'], [3, 'd']).toMap()
   * // Map([1, 'a'], [2, 'c'], [3, 'd'])
   *
   * > View.empty.toMap()
   * // Map()
   *
   * > View.repeat([1, 'a']).toMap()
   * // *hangs*
   * ```
   */
  public toMap<K, V>(
    this: View<[K, V]>,
    O: Ord<K> = Ord.fromUniversalCompare(),
  ): Map<K, V> {
    return this.foldLeft(Map.empty as Map<K, V>, (xs, [k, v]) =>
      xs.insert(k, v, O),
    );
  }

  /**
   * Returns an iterator of the elements of the view.
   *
   * @examples
   *
   * ```typescript
   * > const it = View.empty.iterator
   * > it.next()
   * // { value: undefined, done: true }
   *
   * > const it = View(1, 2).iterator
   * > it.next()
   * // { value: 1, done: false }
   * > it.next()
   * // { value: 2, done: false }
   * > it.next()
   * // { value: undefined, done: true }
   *
   * > const it = View.repeat(1).iterator
   * > it.next()
   * // { value: 1, done: false }
   * > it.next()
   * // { value: 1, done: false }
   * ```
   */
  public get iterator(): Iterator<A> {
    let done: boolean = false;
    let value: A | undefined;
    let next: Eval<void> = Eval.defer(() =>
      this.foldRight(
        Eval.always(() => {
          done = true;
        }),
        (x, r) => {
          value = x;
          next = r;
          return Eval.unit;
        },
      ),
    );

    return {
      next() {
        next.value;
        return done
          ? { value: undefined, done: true }
          : { value: value!, done: false };
      },
    };
  }

  public [Symbol.iterator](): Iterator<A> {
    return this.iterator;
  }

  /**
   * Prepend an element `x` at the beginning the view.
   *
   * @examples
   *
   * ```typescript
   * > View.empty.prepend(42).toArray
   * // [42]
   *
   * > View(1, 2, 3).prepend(42).toArray
   * // [42, 1, 2, 3]
   *
   * > View.repeat(1).prepend(42).take(3).toArray
   * // [42, 1, 1]
   * ```
   */
  public prepend<A>(this: View<A>, x: A): View<A> {
    return View.build((ez, f) =>
      f(
        x,
        Eval.defer(() => this.foldRight(ez, f)),
      ),
    );
  }

  /**
   * Appends an element `x` at the end the view.
   *
   * @examples
   *
   * ```typescript
   * > View.empty.append(42).toArray
   * // [42]
   *
   * > View(1, 2, 3).append(42).toArray
   * // [1, 2, 3, 42]
   *
   * > View.repeat(1).append(42).take(3).toArray
   * // [1, 1, 1]
   * ```
   */
  public append<A>(this: View<A>, x: A): View<A> {
    return View.build((ez, f) =>
      this.foldRight(
        Eval.defer(() => f(x, ez)),
        f,
      ),
    );
  }

  /**
   * Ties a finite view into an infinite one.
   *
   * @note In case the initial view is empty, the view will never terminate.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2).cycle().take(20).toArray
   * // [1, 2, 1, 2, 1, ...
   *
   * > View.empty.cycle().take(20).toArray
   * // *hangs*
   * ```
   */
  public cycle(): View<A> {
    return View.build(<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>) => {
      const go: Eval<B> = Eval.defer(() => this.foldRight(go, f));
      return go;
    });
  }

  /**
   * Returns `true` if for all elements of the view satisfy the predicate `p`,
   * or `false` otherwise.
   *
   * ```typescript
   * xs.all(p) === !xs.any(x => !p(x))
   * ```
   *
   * `all` is strict and short-circuiting requiring evaluation of at least one
   * element of the view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).all(() => true)
   * // true
   *
   * > View(1, 2, 3).all(x => x < 3)
   * // false
   *
   * > View.empty.all(() => false)
   * // true
   *
   * > View.repeat(1).all(() => false)
   * // false
   *
   * > View.repeat(1).all(() => false)
   * // *hangs*
   * ```
   */
  public all<B extends A>(p: (a: A) => a is B): this is View<B>;
  public all(p: (a: A) => boolean): boolean;
  public all(p: (a: A) => boolean): boolean {
    return this.foldMap(Monoid.conjunction, p);
  }

  /**
   * Returns `true` if for at least one element of the view satisfy the predicate
   * `p`, or `false` otherwise.
   *
   * ```typescript
   * xs.any(p) == !xs.all(x => !p(x))
   * ```
   *
   * `any` is strict and short-circuiting requiring evaluation of at least one
   * element of the view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).any(() => true)
   * // true
   *
   * > View(1, 2, 3).any(x => x < 10)
   * // false
   *
   * > View.empty.any(() => true)
   * // false
   *
   * > View.repeat(1).any(() => false)
   * // false
   *
   * > View.repeat(1).any(() => true)
   * // *hangs*
   * ```
   */
  public any(p: (a: A) => boolean): boolean {
    return this.foldMap(Monoid.disjunction, p);
  }

  /**
   * Returns number of elements of the view for which satisfy the predicate `p`.
   *
   * `count` is strict and requires evaluation of the entire view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).count(x => x >= 2)
   * // 2
   *
   * > View.empty.count(x => true)
   * // 0
   *
   * > View.repeat(1).count(x => false)
   * // *hangs*
   * ```
   */
  public count(p: (a: A) => boolean): number {
    return this.foldLeft(0, (x, a) => (p(a) ? x + 1 : x));
  }

  /**
   * Returns max element of the non-empty view, using the provided `Ord<A>`
   * instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * `max` is strict and requires evaluation of the entire view.
   *
   * @note This function is partial.
   *
   * @see maxBy for user-supplied comparison function.
   * @see maxOption for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).max()
   * // 3
   *
   * > View.empty.max()
   * // Uncaught Error: View.max: empty View
   *
   * > View.repeat(1).max()
   * // *hangs*
   * ```
   */
  public max<A>(this: View<A>, O: Ord<A> = Ord.fromUniversalCompare()): A {
    return this.maxOption(O).getOrElse(emptyMax);
  }

  /**
   * Version of `max` function using a user-supplied comparator `cmp`.
   *
   * @note This function is partial.
   *
   * @see maxByOption for a safe variant.
   */
  public maxBy(cmp: (l: A, r: A) => Compare): A {
    return this.maxOptionBy(cmp).getOrElse(emptyMax);
  }

  /**
   * Optionally returns max element of the empty view, using the provided `Ord<A>`
   * instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * `maxOption` is strict and requires evaluation of the entire view.
   *
   * @see maxOptionBy for user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).maxOption()
   * // Some(3)
   *
   * > View.empty.maxOption()
   * // None
   *
   * > View.repeat(1).maxOption()
   * // *hangs*
   * ```
   */
  public maxOption<A>(
    this: View<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Option<A> {
    return this.maxOptionBy(O.compare);
  }

  /**
   * Version of `maxOption` function using a user-supplied comparator `cmp`.
   */
  public maxOptionBy(cmp: (l: A, r: A) => Compare): Option<A> {
    let seen: boolean = false;
    const max = this.foldLeft(undefined as A | undefined, (max, x) =>
      seen ? (cmp(x, max!) === Compare.GT ? x : max) : ((seen = true), x),
    );
    return seen ? Some(max!) : None;
  }

  /**
   * Returns min element of the non-empty view, using the provided `Ord<A>`
   * instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * `min` is strict and requires evaluation of the entire view.
   *
   * @note This function is partial.
   *
   * @see maxBy for user-supplied comparison function.
   * @see minOption for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).min()
   * // 1
   *
   * > View.empty.min()
   * // Uncaught Error: View.min: empty View
   *
   * > View.repeat(1).min()
   * // *hangs*
   * ```
   */
  public min<A>(this: View<A>, O: Ord<A> = Ord.fromUniversalCompare()): A {
    return this.minOption(O).getOrElse(emptyMin);
  }

  /**
   * Version of `min` function using a user-supplied comparator `cmp`.
   *
   * @note This function is partial.
   *
   * @see minOptionBy for a safe variant.
   */
  public minBy(cmp: (l: A, r: A) => Compare): A {
    return this.minOptionBy(cmp).getOrElse(emptyMin);
  }

  /**
   * Optionally returns min element of the empty view, using the provided `Ord<A>`
   * instance, or `Ord.fromUniversalCompare()` if not provided.
   *
   * `minOption` is strict and requires evaluation of the entire view.
   *
   * @see maxOptionBy for user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).minOption()
   * // Some(1)
   *
   * > View.empty.minOption()
   * // None
   *
   * > View.repeat(1).minOption()
   * // *hangs*
   * ```
   */
  public minOption<A>(
    this: View<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): Option<A> {
    return this.minOptionBy(O.compare);
  }

  /**
   * Version of `minOption` function using a user-supplied comparator `cmp`.
   */
  public minOptionBy(cmp: (l: A, r: A) => Compare): Option<A> {
    let seen: boolean = false;
    const min = this.foldLeft(undefined as A | undefined, (min, x) =>
      seen ? (cmp(x, min!) === Compare.LT ? x : min) : ((seen = true), x),
    );
    return seen ? Some(min!) : None;
  }

  /**
   * Returns sum of the elements of the view.
   *
   * `sum` is strict and requires evaluation of the entire view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4, 5).sum()
   * // 15
   *
   * > View.empty.sum()
   * // 0
   *
   * > View.repeat(1).sum()
   * // *hangs*
   * ```
   */
  public sum(this: View<number>): number {
    return this.foldLeft(0, (n, x) => n + x);
  }

  /**
   * Returns product of the elements of the view.
   *
   * `product` is strict and requires evaluation of the entire view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).product()
   * // 120
   *
   * > View.empty.product()
   * // 1
   *
   * > View.repeat(1).product()
   * // *hangs*
   * ```
   */
  public product(this: View<number>): number {
    return this.foldLeft(1, (n, x) => n * x);
  }

  // -- Sub-sequence

  /**
   * Returns prefix of length `n` of the given view if the size of the view is
   * `< n`, otherwise the view itself.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4).take(3).toArray
   * // [1, 2, 3]
   *
   * > View(1, 2).take(3).toArray
   * // [1, 2]
   *
   * > View.empty.take(3).toArray
   * // []
   *
   * > View(1, 2).take(-1).toArray
   * // []
   *
   * > View.range(1).take(3).toArray
   * // [1, 2, 3]
   * ```
   */
  public take(n: number): View<A> {
    if (n <= 0) return View.empty;
    return View.build((ez, g) => {
      let rem = n;
      return this.foldRight(ez, (a, eb) =>
        rem-- === 1
          ? g(a, ez) // ensure we terminate asap and remain lazy
          : g(a, eb),
      );
    });
  }

  /**
   * Returns suffix of the given view after the first `n` elements.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4).drop(3).toArray
   * // [3]
   *
   * > View(1, 2).drop(3).toArray
   * // [1, 2]
   *
   * > View.empty.drop(3).toArray
   * // []
   *
   * > View(1, 2).drop(-1).toArray
   * // [1, 2]
   *
   * > View.range(1).drop(3).take(5).toArray
   * // [4, 5, 6, 7, 8]
   * ```
   */
  public drop(n: number): View<A> {
    if (n <= 0) return this;
    return View.build((ez, g) => {
      let rem = n;
      return this.foldRight(ez, (a, eb) => (rem <= 0 ? g(a, eb) : (rem--, eb)));
    });
  }

  /**
   * Combination of `drop` and `take`, equivalent to:
   *
   * ```typescript
   * xs.slice(from, until) === xs.drop(from).take(until - from);
   * ```
   */
  public slice(from: number, until: number): View<A> {
    from = Math.max(from, 0);
    until = Math.max(until, 0);
    return this.drop(from).take(until - from);
  }

  /**
   * Return a tuple where the first element if the view's prefix of size `n`
   * and the second element is its remainder.
   *
   * ```typescript
   * > View(1, 2, 3).splitAt(1).map(xs => xs.toArray)
   * // [[1], [2, 3]]
   * ```
   */
  public splitAt(n: number): [View<A>, View<A>] {
    return [this.take(n), this.drop(n)];
  }

  /**
   * Returns a longest prefix of elements satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4, 1, 2, 3, 4).takeWhile(x => x < 3).toArray
   * // [1, 2]
   *
   * > View(1, 2, 3).takeWhile(x => x < 5).toArray
   * // [1, 2, 3]
   *
   * > View(1, 2, 3).takeWhile(x => x < 0).toArray
   * // []
   *
   * > View.range(1).takeWhile(x => x < 3).toArray
   * // [1, 2]
   * ```
   */
  public takeWhile<B extends A>(p: (a: A) => a is B): View<B>;
  public takeWhile(p: (a: A) => boolean): View<A>;
  public takeWhile(p: (a: A) => boolean): View<A> {
    return View.build((ez, g) =>
      this.foldRight(ez, (a, eb) => (p(a) ? g(a, eb) : ez)),
    );
  }

  /**
   * Returns a remainder of the view after removing its longer prefix satisfying
   * the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4, 1, 2, 3, 4).dropWhile(x => x < 3).toArray
   * // [3, 4, 1, 2, 3, 4]
   *
   * > View(1, 2, 3).dropWhile(x => x < 5).toArray
   * // []
   *
   * > View(1, 2, 3).dropWhile(x => x < 0).toArray
   * // [1, 2, 3]
   *
   * > View.range(1).dropWhile(x => x < 3).take(3).toArray
   * // [3, 4, 5]
   * ```
   */
  public dropWhile(p: (a: A) => boolean): View<A> {
    return View.build((ez, g) => {
      let dropping = true;
      return this.foldRight(ez, (a, eb) =>
        dropping && (dropping = p(a)) ? eb : g(a, eb),
      );
    });
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
   * > View(1, 2, 3, 4, 1, 2, 3, 4)
   * >   .dropWhile(x => x < 3)
   * >   .map(xs => xs.toArray)
   * // [[1, 2], [3, 4, 1, 2, 3, 4]]
   *
   * > View(1, 2, 3)
   * >   .dropWhile(_ => true)
   * >   .map(xs => xs.toArray)
   * // [[1, 2, 3], []]
   *
   * > View(1, 2, 3)
   * >   .dropWhile(_ => false)
   * >   .map(xs => xs.toArray)
   * // [[], [1, 2, 3]]
   * ```
   */
  public span<B extends A>(p: (a: A) => a is B): [View<B>, View<A>];
  public span(p: (a: A) => boolean): [View<A>, View<A>];
  public span(p: (a: A) => boolean): [View<A>, View<A>] {
    return [this.takeWhile(p), this.dropWhile(p)];
  }

  /**
   * Returns a view of of all possible prefixes of the view, shortest first.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).inits().map(xs => xs.toArray).toArray
   * // [[], [1], [1, 2], [1, 2, 3]]
   * ```
   */
  public inits(): View<View<A>> {
    return View.build((ez, g) => {
      let taken = 0;
      return this.foldRight(
        Eval.defer(() => g(this, ez)),
        (_a, eb) => g(this.take(taken++), eb),
      );
    });
  }

  /**
   * Returns a view of of all possible suffixes of the view, longest first.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).inits().map(xs => xs.toArray).toArray
   * // [[1, 2, 3], [2, 3], [3], []]
   * ```
   */
  public tails(): View<View<A>> {
    return View.build((ez, g) => {
      let dropped = 0;
      return this.foldRight(
        Eval.defer(() => g(View.empty, ez)),
        (_a, eb) => g(this.drop(dropped++), eb),
      );
    });
  }

  // -- Searching

  /**
   * Returns `true` if the view contains the element `a`, or `false` otherwise.
   *
   * `elem` is a strict, short-circuiting operation that requires evaluation of
   * at least one element.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).elem(2)
   * // true
   *
   * > View(1, 2, 3).elem(-1)
   * // false
   *
   * > View([1, 2], [2, 3]).elem([1, 2], Eq.tuple(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()))
   * // true
   *
   * > View.range(1).elem(1)
   * // true
   *
   * > View.range(1).elem(-1)
   * // *hangs*
   * ```
   */
  public elem<A>(
    this: View<A>,
    a: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    return this.any(x => E.equals(x, a));
  }

  /**
   * Negation of `elem`:
   *
   * ```typescript
   * xs.notElem(x) === !xs.elem(x)
   * ```
   */
  public notElem<A>(
    this: View<A>,
    a: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): boolean {
    return !this.elem(a, E);
  }

  /**
   * Looks up a key in the view forming association list.
   *
   * `lookup` is a strict, short-circuiting operation that requires evaluation of
   * at least one element.
   *
   * @examples
   *
   * ```typescript
   * > View([1, 'one'], [2, 'two'], [3, 'three']).lookup(2)
   * // Some('two')
   *
   * > View([1, 'one']).lookup(2)
   * // None
   *
   * > View.empty.lookup(2)
   * // None
   *
   * > View([1, 'one'], [2, 'two']).cycle().lookup(2)
   * // Some(2)
   *
   * > View.cycle([1, 'one']).lookup(2)
   * // *hangs*
   * ```
   */
  public lookup<K, V>(
    this: View<readonly [K, V]>,
    k: K,
    E: Eq<K> = Eq.fromUniversalEquals(),
  ): Option<V> {
    return this.foldMapK(Option.Alternative, ([k2, v]) =>
      E.equals(k, k2) ? Some(v) : None,
    );
  }

  /**
   * Optionally returns the first element of the structure matching the
   * predicate `p`.
   *
   * `find` is a strict, short-circuiting operation that requires evaluation of
   * at least one element.
   *
   * @examples
   *
   * ```typescript
   * > View.iterate(0, x => x + 5).find(x => x > 42)
   * // Some(45)
   *
   * > View(1, 2, 3).find(x => x < 0)
   * // None
   *
   * > View.iterate(0, x => x + 5).find(x => x < 0)
   * // *hangs*
   * ```
   */
  public find<B extends A>(p: (a: A) => a is B): Option<B>;
  public find(p: (a: A) => boolean): Option<A>;
  public find(p: (a: A) => boolean): Option<A> {
    return this.foldMapK(Option.Alternative, a => (p(a) ? Some(a) : None));
  }

  /**
   * Returns a view where all elements of the original view satisfy the predicate
   * `p`.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4).filter(x => x % 2 === 0).toArray
   * // [2, 4]
   *
   * > View.range(1).filter(x => x % 2 === 0).take(3).toArray
   * // [2, 4, 6]
   * ```
   */
  public filter<B extends A>(p: (a: A) => a is B): View<B>;
  public filter(p: (a: A) => boolean): View<A>;
  public filter(p: (a: A) => boolean): View<A> {
    return View.build((ez, g) =>
      this.foldRight(ez, (a, eb) => (p(a) ? g(a, eb) : eb)),
    );
  }

  /**
   * Returns a view where all elements of the original view do not satisfy the
   * predicate `p`.
   *
   * `xs.filterNot(p)` is equivalent to `xs.filter(x => !p(x))`
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4).filterNot(x => x % 2 === 0).toArray
   * // [1, 3]
   *
   * > View.range(1).filterNot(x => x % 2 === 0).take(3).toArray
   * // [1, 3, 5]
   * ```
   */
  public filterNot(p: (a: A) => boolean): View<A> {
    return this.filter(x => !p(x));
  }

  /**
   * A version of `map` which removes elements of the original view.
   *
   * If the function `f` is a combination of a predicate `p: (a: A) => boolean`
   * that determines whether or not a particular element should be kept in the
   * resulting view, and a transformation `g: (a: A) => B`, then `xs.collect(f)`
   * is equivalent to `xs.filter(p).map(f)`.
   *
   * @examples
   *
   * ```typescript
   * > View('1', 'Foo', '3')
   * >   .collect(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * >   .toArray
   * // [1, 3]
   * ```
   */
  public collect<B>(f: (a: A) => Option<B>): View<B> {
    return View.build((ez, g) =>
      this.foldRight(ez, (a, eb) => {
        const x = f(a);
        return x.nonEmpty ? g(x.get, eb) : eb;
      }),
    );
  }

  /**
   * A version of `collect` which drops the remainder of the view starting with
   * the first element for which the function `f` returns `None`.
   *
   * If the function `f` is a combination of a predicate `p: (a: A) => boolean`
   * that determines whether or not a particular element should be kept in the
   * resulting view, and a transformation `g: (a: A) => B`, then
   * `xs.collectWhile(f)` is equivalent to `xs.takeWhile(p).map(f)`.
   *
   * @examples
   *
   * ```typescript
   * > View('1', 'Foo', '3')
   * >   .collectWhile(s => Some(parseInt(x)).filterNot(Number.isNaN))
   * >   .toArray
   * // [1]
   * ```
   */
  public collectWhile<B>(f: (a: A) => Option<B>): View<B> {
    return View.build((ez, g) =>
      this.foldRight(ez, (a, eb) => {
        const x = f(a);
        return x.nonEmpty ? g(x.get, eb) : ez;
      }),
    );
  }

  /**
   * Returns a tuple where the first element is a view containing the elements
   * which satisfy the predicate `p` and the second one which contains the rest
   * of them.
   *
   * `xs.partition(p)` is equivalent to `[xs.filter(p), xs.filterNot(p)]`.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4, 5, 6)
   * >   .partition(x => x % 2 === 0)
   * >   .map(xs => xs.toArray)
   * // [[2, 4, 6], [1, 3, 5]]
   * ```
   */
  public partition<B extends A>(p: (a: A) => a is B): [View<B>, View<A>];
  public partition(p: (a: A) => boolean): [View<A>, View<A>];
  public partition(p: (a: A) => boolean): [View<A>, View<A>] {
    return [this.filter(p), this.filterNot(p)];
  }

  // -- Indexing

  /**
   * Returns an element at the index `idx`.
   *
   * `get` is a strict, short-circuiting operation that requires evaluation of
   * at least on element.
   *
   * @note This function is partial.
   *
   * @see getOption for a safe variant.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).get(0)
   * // 1
   *
   * > View(1, 2, 3).get(2)
   * // 3
   *
   * > View(1, 2, 3).get(3)
   * // Uncaught Error: IndexOutOfBounds
   *
   * > View(1, 2, 3).get(-1)
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public get(idx: number): A {
    if (idx < 0) return iob();
    return this.foldRight(indexOutOfBounds as Eval<A>, (x, eb) =>
      idx-- > 0 ? eb : Eval.now(x),
    ).value;
  }

  /**
   * Optionally returns an element at the index `idx`.
   *
   * `getOption` is a strict, short-circuiting operation that requires
   * evaluation of at least on element.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).getOption(0)
   * // Some(1)
   *
   * > View(1, 2, 3).getOption(2)
   * // Some(3)
   *
   * > View(1, 2, 3).getOption(3)
   * // None
   *
   * > View(1, 2, 3).getOption(-1)
   * // None
   * ```
   */
  public getOption(idx: number): Option<A> {
    if (idx < 0) return None;
    return this.foldRight(emptyOption as Eval<Option<A>>, (x, eb) =>
      idx-- > 0 ? eb : Eval.now(Some(x)),
    ).value;
  }

  /**
   * Replace an element at the index `idx` with the new value `x`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > View('a', 'b', 'c').replaceAt(0, 'x').toArray
   * // ['x', 'b', 'c']
   *
   * > View('a', 'b', 'c').replaceAt(2, 'x').toArray
   * // ['a', 'b', 'x']
   *
   * > View('a', 'b', 'c').replaceAt(3, 'x').toArray
   * // Uncaught Error: IndexOutOfBounds
   *
   * > View('a', 'b', 'c').replaceAt(-1, 'x').toArray
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public replaceAt<A>(this: View<A>, idx: number, x: A): View<A> {
    return this.modifyAt(idx, _ => x);
  }

  /**
   * Transforms an element at the index `idx` using the function `f`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > View('a', 'b', 'c').modifyAt(0, c => c.toUpperCase()).toArray
   * // ['A', 'b', 'c']
   *
   * > View('a', 'b', 'c').modifyAt(2, c => c.toUpperCase()).toArray
   * // ['a', 'b', 'C']
   *
   * > View('a', 'b', 'c').modifyAt(3, c => c.toUpperCase()).toArray
   * // Uncaught Error: IndexOutOfBounds
   *
   * > View('a', 'b', 'c').modifyAt(-1, c => c.toUpperCase()).toArray
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public modifyAt<A>(this: View<A>, idx: number, f: (a: A) => A): View<A> {
    return View.build((ez, g) => {
      if (idx < 0) return iob();
      let i = idx;
      return this.foldRight(
        Eval.defer(() => (i >= 0 ? iob() : ez)),
        (a, eb) => (i < 0 ? g(a, eb) : i-- === 0 ? g(f(a), eb) : g(a, eb)),
      );
    });
  }

  /**
   * Inserts an element `x` at the index `idx` shifting the remainder of the
   * view.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > View('a', 'b', 'c').insertAt(0, 'x').toArray
   * // ['x', 'a', 'b', 'c']
   *
   * > View('a', 'b', 'c').insertAt(2, 'x').toArray
   * // ['a', 'b', 'x', 'c']
   *
   * > View('a', 'b', 'c').insertAt(3, 'x').toArray
   * // ['a', 'b', 'c', 'x']
   *
   * > View('a', 'b', 'c').insertAt(4, 'x').toArray
   * // Uncaught Error: IndexOutOfBounds
   *
   * > View('a', 'b', 'c').insertAt(-1, 'x').toArray
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public insertAt<A>(this: View<A>, idx: number, x: A): View<A> {
    return View.build((ez, g) => {
      if (idx < 0) return iob();
      let i = idx;
      return this.foldRight(
        Eval.defer(() => (i > 0 ? iob() : i === 0 ? g(x, ez) : ez)),
        (a, eb) =>
          i < 0
            ? g(a, eb)
            : i-- === 0
            ? g(
                x,
                Eval.defer(() => g(a, eb)),
              )
            : g(a, eb),
      );
    });
  }

  /**
   * Removes an element `x` at the index `idx`.
   *
   * @note This is a partial function.
   *
   * @examples
   *
   * ```typescript
   * > View('a', 'b', 'c').removeAt(0).toArray
   * // ['b', 'c']
   *
   * > View('a', 'b', 'c').removeAt(2).toArray
   * // ['a', 'b']
   *
   * > View('a', 'b', 'c').removeAt(3).toArray
   * // Uncaught Error: IndexOutOfBounds
   *
   * > View('a', 'b', 'c').removeAt(-1).toArray
   * // Uncaught Error: IndexOutOfBounds
   * ```
   */
  public removeAt(idx: number): View<A> {
    if (idx < 0) return iob();
    return View.build((ez, g) => {
      let i = idx;
      return this.foldRight(
        Eval.defer(() => (i >= 0 ? iob() : ez)),
        (a, eb) => (i < 0 ? g(a, eb) : i-- === 0 ? eb : g(a, eb)),
      );
    });
  }

  /**
   * Returns the first index of on occurrence of the element `x` in the view, or
   * `None` when it does not exist.
   *
   * `elemIndex` is a strict, short-circuiting operation that requires evaluation
   * of at least on element.
   *
   * @see elemIndices to get indices of _all_ occurrences of the element `x`.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 1, 2, 3).elemIndex(1)
   * // Some(0)
   *
   * > View(1, 2, 3).elemIndex(3)
   * // Some(2)
   *
   * > View(1, 2, 3).elemIndex(0)
   * // None
   *
   * > View.range(1).elemIndex(40)
   * // Some(39)
   * ```
   */
  public elemIndex<A>(
    this: View<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): Option<number> {
    return this.findIndex(y => E.equals(x, y));
  }

  /**
   * Returns the indices of all occurrence of the element `x` in the view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 1, 2, 3).elemIndices(1).toArray
   * // [0, 3]
   *
   * > View(1, 2, 3).elemIndices(3).toArray
   * // [2]
   *
   * > View(1, 2, 3).elemIndices(0).toArray
   * // []
   *
   * > View.range(1).elemIndices(40).toArray
   * // *hangs*
   * ```
   */
  public elemIndices<A>(
    this: View<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): View<number> {
    return this.findIndices(y => E.equals(x, y));
  }

  /**
   * Returns index of the first element satisfying the predicate `p`.
   *
   * `findIndex` is a strict, short-circuiting operation that requires evaluation
   * of at least on element.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 1, 2, 3).findIndex(x => x > 1)
   * // Some(1)
   *
   * > View(1, 2, 3).findIndex(x => x === 3)
   * // Some(2)
   *
   * > View(1, 2, 3).findIndex(x => x > 20)
   * // None
   *
   * > View.range(1).findIndex(x => x < 100)
   * // *hangs*
   * ```
   */
  public findIndex(p: (a: A) => boolean): Option<number> {
    let idx = 0;
    return this.foldRight(emptyOption as Eval<Option<number>>, (x, eb) =>
      p(x) ? Eval.now(Some(idx)) : (idx++, eb),
    ).value;
  }

  /**
   * Returns indices of all elements satisfying the predicate `p`.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 1, 2, 3).findIndices(x => x > 1).toArray
   * // [1, 2, 4, 5]
   *
   * > View(1, 2, 3).findIndices(x => x === 3).toArray
   * // [2]
   *
   * > View(1, 2, 3).findIndices(x => x > 20).toArray
   * // []
   *
   * > View.range(1).findIndices(x => x < 100).toArray
   * // *hangs*
   * ```
   */
  public findIndices(p: (a: A) => boolean): View<number> {
    return View.build((ez, g) => {
      let idx = 0;
      return this.foldRight(ez, (a, eb) => {
        const i = idx++;
        return p(a) ? g(i, eb) : eb;
      });
    });
  }

  // -- Combining and transforming

  /**
   * Returns view with elements in reversed order.
   *
   * `reverse` is a strict operation requiring evaluation of the entire view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).reverse.toArray
   * // [3, 2, 1]
   *
   * > View(42).reverse.toArray
   * // [42]
   *
   * > View.empty.reverse.toArray
   * // []
   *
   * > View.range(1).reverse.toArray
   * // *hangs**
   * ```
   */
  public get reverse(): View<A> {
    return View.fromArray(this.toArray.reverse());
  }

  /**
   * Appends all elements of the second view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).concat(View(4, 5, 6)).toArray
   * // [1, 2, 3, 4, 5, 6]
   *
   * > View(1, 2, 3).concat(View.range(4)).take(6).toArray
   * // [1, 2, 3, 4, 5, 6]
   * ```
   */
  public concat<A>(this: View<A>, that: View<A>): View<A> {
    return View.build((ez, g) =>
      this.foldRight(
        Eval.defer(() => that.foldRight(ez, g)),
        g,
      ),
    );
  }

  /**
   * Version of `concat` lazy in its second argument.
   *
   * @see concat
   */
  public concatEval<A>(this: View<A>, that: Eval<View<A>>): View<A> {
    return View.build((ez, g) =>
      this.foldRight(
        that.flatMap(that => that.foldRight(ez, g)),
        g,
      ),
    );
  }

  /**
   * Returns a new view by transforming each element using the function `f`.
   *
   * @examples
   *
   * ```typescript
   * > View('a', 'b', 'c').map(x => x.toUpperCase()).toArray
   * // ['A', 'B', 'C']
   *
   * > View.empty.map(() => { throw new Error(); }).toArray
   * // []
   *
   * > View.range(1).map(x => x + 1).take(3).toArray
   * // [2, 3, 4]
   * ```
   */
  public map<B>(f: (a: A) => B): View<B> {
    return View.build((ez, g) => this.foldRight(ez, (a, eb) => g(f(a), eb)));
  }

  /**
   * Returns a view by transforming combination of elements from both views using
   * the function `f`.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2).map2(View('a', 'b'), tupled).toArray
   * // [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
   *
   * > View.empty.map2(View.repeat(1), tupled).toArray
   * // []
   *
   * > View.repeat(1).map2(View.empty, tupled).toArray
   * // *hangs*
   * ```
   */
  public map2<B, C>(that: View<B>, f: (a: A, b: B) => C): View<C> {
    return View.build((ez, g) =>
      this.foldRight(ez, (x, eb) =>
        that.foldRight(eb, (y, ec) => g(f(x, y), ec)),
      ),
    );
  }

  /**
   * Lazy version of `map2`.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2).map2Eval(Eval.now(View('a', 'b')), tupled).value.toArray
   * // [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
   *
   * > View.empty.map2Eval(Eval.bottom(), tupled).value.toArray
   * // []
   * ```
   */
  public map2Eval<B, C>(
    that: Eval<View<B>>,
    f: (a: A, b: B) => C,
  ): Eval<View<C>> {
    that = that.memoize;
    return Eval.now(
      View.build((ez, g) =>
        this.foldRight(ez, (x, eb) =>
          that.flatMap(that => that.foldRight(eb, (y, ec) => g(f(x, y), ec))),
        ),
      ),
    );
  }

  /**
   * Returns a new view by transforming each element using the function `f` and
   * concatenating their results.
   *
   * @examples
   *
   * ```typescript
   * > View(View.range(1), View.range(10), View.range(100))
   * >   .flatMap(xs => xs.take(3))
   * >   .toArray
   * // [1, 2, 3, 10, 11, 12, 100, 101, 102]
   * ```
   */
  public flatMap<B>(f: (a: A) => View<B>): View<B> {
    return View.build((ez, g) =>
      this.foldRight(ez, (a, eb) => f(a).foldRight(eb, g)),
    );
  }

  /**
   * Returns a new view concatenating its nested views.
   *
   * `xss.flatten()` is equivalent to `xss.flatMap(id)`.
   */
  public flatten<A>(this: View<View<A>>): View<A> {
    return this.flatMap(id);
  }

  /**
   * Inserts the given separator `sep` in between each of the elements of the view.
   *
   * @examples
   *
   * ```typescript
   * > View('a', 'b', 'c').intersperse(',').toArray
   * // ['a', ',', 'b', ',', 'c']
   * ```
   */
  public intersperse<A>(this: View<A>, sep: A): View<A> {
    return View.build((ez, f) => {
      let prepend = false;
      return this.foldRight(ez, (a, eb) =>
        prepend
          ? f(
              sep,
              Eval.defer(() => f(a, eb)),
            )
          : ((prepend = true), f(a, eb)),
      );
    });
  }

  // -- Zips

  /**
   * Returns a view of pairs of corresponding elements of each view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).zip(View('a', 'b', 'c')).toArray
   * // [[1, 'a'], [2, 'b'], [3, 'c']]
   *
   * > View.range(1).zip(View('a', 'b')).toArray
   * // [[1, 'a'], [2, 'b']]
   *
   * > View('a', 'b').zip(View.range(1)).toArray
   * // [['a', 1], ['b', 2]]
   *
   * > View.empty.zip(View.range(1)).toArray
   * // []
   *
   * > View.range(1).zip(View.empty).toArray
   * // []
   * ```
   */
  public zip<B>(that: View<B>): View<[A, B]> {
    return this.zipWith(that, tupled);
  }

  /**
   * A version of `zip` that takes a user-supplied zipping function `f`.
   *
   * ```typescript
   * xs.zipWith(ys, tupled) === xs.zip(ys)
   * xs.zipWith(ys, f) === xs.zip(ys).map(([x, y]) => f(x, y))
   * ```
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).zipWith(View(4, 5, 6), (x, y) => x + y).toArray
   * // [5, 7, 9]
   * ```
   */
  public zipWith<B, C>(that: View<B>, f: (a: A, b: B) => C): View<C> {
    return View.build((ez, g) =>
      this.foldRight2(that, ez, (a, b, ec) => g(f(a, b), ec)),
    );
  }

  /**
   * Returns a view where each element is zipped with its index in the resulting
   * sequence.
   *
   * `xs.zipWithIndex` is equivalent to `xs.zipWith(View.range(0))`
   *
   * @examples
   *
   * ```typescript
   * > View('a', 'b', 'c').zipWithIndex.toArray
   * // [['a', 0], ['a', 1], ['a', 2]]
   *
   * > View.range(1).filter(x => x % 2 === 0).zipWithIndex.take(3).toArray
   * // [[2, 0], [4, 1], [6, 2]]
   *
   * > View.range(1).zipWithIndex.filter(([x]) => x % 2 === 0).take(3).toArray
   * // [[2, 1], [4, 3], [6, 5]]
   * ```
   */
  public get zipWithIndex(): View<[A, number]> {
    let idx = 0;
    return View.build((ez, f) =>
      this.foldRight(ez, (a, eb) => f([a, idx++], eb)),
    );
  }

  /**
   * Version of `zip` working on three views.
   */
  public zip3<B, C>(bs: View<B>, cs: View<C>): View<[A, B, C]> {
    return this.zipWith3(bs, cs, tupled);
  }

  /**
   * Version of `zipWith` working on three views.
   */
  public zipWith3<B, C, D>(
    bs: View<B>,
    cs: View<C>,
    f: (a: A, b: B, c: C) => D,
  ): View<D> {
    return View.build((ez, g) =>
      this.foldRight3(bs, cs, ez, (a, b, c, ec) => g(f(a, b, c), ec)),
    );
  }

  /**
   * Transform a view of pairs into a view with its first components and a view
   * with its second components.
   *
   * @examples
   *
   * ```typescript
   * > View(['a', 1], ['b', 2], ['c', 3]).unzip().map(xs => xs.toArray)
   * // [['a', 'b', 'c'], [1, 2, 3]]
   * ```
   */
  public unzip<A, B>(this: View<readonly [A, B]>): [View<A>, View<B>] {
    return [this.map(([a]) => a), this.map(([, b]) => b)];
  }

  /**
   * Version of `unzip` that works on tuples of three.
   */
  public unzip3<A, B, C>(
    this: View<readonly [A, B, C]>,
  ): [View<A>, View<B>, View<C>] {
    return [
      this.map(([a]) => a),
      this.map(([, b]) => b),
      this.map(([, , c]) => c),
    ];
  }

  private foldRight2<B, C>(
    that: View<B>,
    ez: Eval<C>,
    f: (a: A, b: B, ec: Eval<C>) => Eval<C>,
  ): Eval<C> {
    const it = that.iterator;
    return this.foldRight(ez, (a, ec) => {
      const nx = it.next();
      return nx.done ? ez : f(a, nx.value, ec);
    });
  }

  private zipPrevWith<B>(f: (prev: A, cur: A) => B): View<B> {
    return View.build((ez, g) => {
      let seen = false;
      let prev: A | undefined;
      return this.foldRight(ez, (x, eb) => {
        prev = x;
        return seen ? g(f(prev!, x), eb) : ((seen = true), eb);
      });
    });
  }

  private foldRight3<B, C, D>(
    bs: View<B>,
    cs: View<C>,
    ez: Eval<D>,
    f: (a: A, b: B, c: C, ed: Eval<D>) => Eval<D>,
  ): Eval<D> {
    const bb = bs.iterator;
    const cc = cs.iterator;
    return this.foldRight(ez, (a, ec) => {
      const ys = bb.next();
      if (ys.done) return ez;

      const zs = cc.next();
      if (zs.done) return ez;

      return f(a, ys.value, zs.value, ec);
    });
  }

  // -- Scans

  /**
   * Returns a view of cumulative results reduced from left:
   *
   * `View(x1, x2, ...).scanLeft(z, f)` is equivalent to `[z, f(z, x1), f(f(z, x1), x2), ...]`
   *
   *
   * Relationship with `foldLeft`:
   *
   * `xs.scanLeft(z, f).last == xs.foldLeft(z, f)`
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).scanLeft(0, (z, x) => z + x).toArray
   * // [0, 1, 3, 6]
   *
   * > View.empty.scanLeft(42, (z, x) => z + x).toArray
   * // [42]
   *
   * > View.range(1, 5).scanLeft(100, (x, y) => x - y).toArray
   * // [100, 99, 97, 94, 90]
   *
   * > View.range(1).scanLeft(0, (x, y) => x + y).take(5).toArray
   * // [0, 1, 3, 6, 10]
   * ```
   */
  public scanLeft<B>(z: B, f: (b: B, a: A) => B): View<B> {
    return View.build((ez, g) =>
      g(
        z,
        Eval.defer(() => this.foldRight(ez, (a, eb) => g((z = f(z, a)), eb))),
      ),
    );
  }

  /**
   * Right-to-left dual of `scanLeft`.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).scanRight(Eval.zero, (x, ez) => ez.map(z => x + z)).toArray
   * // [6, 5, 3, 0]
   *
   * > View.empty.scanRight(Eval.now(42), (x, ez) => ez.map(z => x + z)).toArray
   * // [42]
   *
   * > View.range(1, 5).scanRight(Eval.now(100), (x, ey) => ey.map(y => x - y)).toArray
   * // [98, -97, 99, -96, 100]
   *
   * > View.range(1).scanRight(Eval.zero, (x, ez) => ez.map(z => x + z)).toArray
   * // *hangs*
   * ```
   */
  public scanRight<B>(eb: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): View<B> {
    return View.build(<C>(ez: Eval<C>, g: (b: B, ec: Eval<C>) => Eval<C>) => {
      const cont = ({ eb, ec }: { eb: Eval<B>; ec: Eval<C> }): Eval<C> =>
        eb.flatMap(b => g(b, ec));

      return this.foldRight(Eval.now({ eb, ec: ez }), (a, ebc) => {
        ebc = ebc.memoize;
        return Eval.now({
          eb: ebc.flatMap(({ eb }) => f(a, eb)).memoize,
          ec: ebc.flatMap(cont),
        });
      }).flatMap(cont);
    });
  }

  // -- Set operations

  /**
   * Removes duplicate elements from the view.
   *
   * @see distinctBy for the user supplied equality check.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4, 3, 2, 1, 2, 4, 3, 5).distinct().toArray
   * // [1, 2, 3, 4, 5]
   * ```
   */
  public distinct<A>(this: View<A>, E?: Eq<A>): View<A> {
    return E ? this.distinctBy(E.equals) : this.distinctPrim();
  }

  /**
   * Version of `distinct` function using a user-supplied equality check `eq`.
   */
  public distinctBy(eq: (x: A, y: A) => boolean): View<A> {
    return View.build((ez, g) => {
      const _seen: A[] = [];
      const seen = (x: A): boolean => _seen.some(a => eq(x, a));
      return this.foldRight(ez, (a, eb) =>
        seen(a) ? eb : (_seen.push(a), g(a, eb)),
      );
    });
  }

  private distinctPrim(): View<A> {
    return View.build((ez, g) => {
      const set = new Set();
      return this.foldRight(ez, (a, eb) =>
        set.has(a) ? eb : (set.add(a), g(a, eb)),
      );
    });
  }

  /**
   * Removes the first occurrence of `x` in the view.
   *
   * @see removeBy for the use-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 1, 2, 3).remove(1).toArray
   * // [2, 3, 1, 2, 3]
   *
   * > View(2, 3).remove(1).toArray
   * // [2, 3]
   *
   * > View.repeat(1).remove(1).take(3).toArray
   * // [1, 1, 1]
   * ```
   */
  public remove<A>(
    this: View<A>,
    x: A,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): View<A> {
    return this.removeBy(x, E.equals);
  }

  /**
   * Version of `remove` function using a user-supplied equality check `eq`.
   */
  public removeBy(x: A, eq: (x: A, y: A) => boolean): View<A> {
    return View.build((ez, g) => {
      let deleted = false;
      return this.foldRight(ez, (a, eb) =>
        !deleted && eq(x, a) ? ((deleted = true), eb) : g(a, eb),
      );
    });
  }

  /**
   * A non-associative collection difference. `difference` removes first occurrence
   * of each element of `that` in the current view.
   *
   * @see differenceBy for the user-supplied comparison function.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 1, 2, 3).difference(View(2, 3)).toArray
   * // [1, 1, 2, 3]
   *
   * > View(1, 2, 3, 1, 2, 3).difference(View(1, 1, 2)).toArray
   * // [3, 2, 3]
   *
   * > View.range(1).difference(View(1, 2, 3)).take(5).toArray
   * // [4, 5, 6, 7, 8]
   *
   * > View(1, 2, 3, 4).difference(View.range(1)).take(5).toArray
   * // *hangs*
   * ```
   */
  public difference<A>(
    this: View<A>,
    that: View<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): View<A> {
    return this.differenceBy(that, E.equals);
  }
  /**
   * Alias for `difference`.
   */
  public '\\'<A>(
    this: View<A>,
    that: View<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): View<A> {
    return this.difference(that, E);
  }

  /**
   * Version of `difference` that uses user-supplied equality check `eq`.
   */
  public differenceBy<A>(
    this: View<A>,
    that: View<A>,
    eq: (x: A, y: A) => boolean,
  ): View<A> {
    return that.foldLeft(this, (xs, x) => xs.removeBy(x, eq));
  }

  /**
   * Creates a union of two views.
   *
   * Duplicates and the elements from the first view are removed from the second
   * one. But if there are duplicates in the original view, they are present in
   * the result as well.
   *
   * @see unionBy for the user-supplied equality check.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).union(View(2, 3, 4)).toArray
   * // [1, 2, 3, 4]
   *
   * > View(1, 2, 3).union(View(1, 2, 3, 3, 4)).toArray
   * // [1, 2, 3, 4]
   *
   * > View(1, 1, 2, 3, 6).union(View(2, 3, 4)).toArray
   * // [1, 1, 2, 3, 6, 4]
   *
   * > View.range(1).union(View.range(1)).take(5).toArray
   * // [1, 2, 3, 4, 5]
   *
   * > View(1, 2, 3).union(View.rage(1)).take(5).toArray
   * // [1, 2, 3, 4, 5]
   * ```
   */
  public union<A>(this: View<A>, that: View<A>, E?: Eq<A>): View<A> {
    return E ? this.unionBy(that, E.equals) : this.unionPrim(that);
  }

  private unionPrim<A>(this: View<A>, that: View<A>): View<A> {
    return this.concat(
      View.defer(() =>
        this.foldLeft(that.distinctPrim(), (xs, x) => xs.remove(x)),
      ),
    );
  }

  /**
   * Version of `union` that uses a user-supplied equality check `eq`.
   */
  public unionBy<A>(
    this: View<A>,
    that: View<A>,
    eq: (x: A, y: A) => boolean,
  ): View<A> {
    return this.concat(
      View.defer(() =>
        this.foldLeft(that.distinctBy(eq), (xs, x) => xs.removeBy(x, eq)),
      ),
    );
  }

  /**
   * Creates an intersection of two views. If the first list contains duplicates
   * so does the second
   *
   * @see intersectBy for a user-supplied equality check.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4).intersect(View(2, 4, 6, 8)).toArray
   * // [2, 4]
   *
   * > View(1, 1, 2, 3).intersect(View(1, 2, 2, 5)).toArray
   * // [1, 1, 2]
   * ```
   */
  public intersect<A>(
    this: View<A>,
    that: View<A>,
    E: Eq<A> = Eq.fromUniversalEquals(),
  ): View<A> {
    return this.intersectBy(that, E.equals);
  }

  /**
   * Version of `intersect` that uses user-supplied equality check `eq`.
   */
  public intersectBy<A>(
    this: View<A>,
    that: View<A>,
    eq: (x: A, y: A) => boolean,
  ): View<A> {
    return View.build((ez, g) =>
      this.foldRight(ez, (x, eb) => (that.any(y => eq(x, y)) ? g(x, eb) : eb)),
    );
  }

  // -- Folds

  /**
   * Apply `f` to each element of the view for its side-effect.
   *
   * `forEach` is a strict, _non_-short-circuiting function needing to evaluate
   * the entire view.
   *
   * @examples
   *
   * ```typescript
   * > let acc = 0;
   * > View(1, 2, 3, 4, 5).forEach(x => acc += x)
   * > acc
   * // 15
   *
   * > let acc = 0;
   * > View.range(1).forEach(x => acc += x)
   * // *hangs*
   * ```
   */
  public forEach(f: (a: A) => void): void {
    this.foldRight(Eval.unit, (a, eb) => (f(a), eb)).value;
  }

  /**
   * Apply a left-associative operator `f` to each element of the `View` reducing
   * the view from left to right:
   *
   * ```typescript
   * View(x1, x2, ..., xn) === f( ... f(f(z, x1), x2), ... xn)
   * ```
   *
   * `foldLeft` is a strict, _non_-short-circuiting function needing to evaluate
   * the entire view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4, 5).foldLeft(0, (x, y) => x + y)
   * // 15
   *
   * > View.empty.foldLeft(42, (x, y) => x + y)
   * // 42
   *
   * > View.range(1).foldLeft(0, (x, y) => x + y)
   * // *hangs*
   * ```
   */
  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    this.forEach(a => (z = f(z, a)));
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
   * > View(1, 2, 3).foldLeft1((x, y) => x + y)
   * // 6
   *
   * > View.empty.foldLeft1((x, y) => x + y)
   * // Uncaught Error: View.foldLeft1: empty View
   *
   * > View.range(1).foldLeft1((x, y) => x + y)
   * // *hangs*
   * ```
   */
  public foldLeft1<A>(this: View<A>, f: (acc: A, a: A) => A): A {
    let hasSeen = false;
    let z: A | undefined;
    this.forEach(a => (hasSeen ? (z = f(z!, a)) : ((hasSeen = true), (z = a))));
    return hasSeen ? z! : emptyFoldLeft();
  }

  /**
   * Version of `foldRight` without initial value and therefore it can be applied
   * only to non-empty structures.
   *
   * @note This function is partial.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).foldRight1((x, ey) => ey.map(y => x + y)).value
   * // 6
   *
   * > View.empty.foldRight1((x, ey) => ey.map(y => x + y)).value
   * // Uncaught Error: View.foldRight1: empty View
   *
   * > View.range(1).foldRight1((x, ey) => ey.map(y => x + y)).value
   * // *hangs*
   * ```
   */
  public foldRight1<A>(
    this: View<A>,
    f: (a: A, eac: Eval<A>) => Eval<A>,
  ): Eval<A> {
    const END = {};
    const r = this.foldRight(Eval.now(END as Eval<A>), (a, eb) =>
      Eval.now(eb.flatMap(opt => (opt === END ? Eval.now(a) : f(a, opt)))),
    ).value;
    return r === END ? Eval.later(emptyFoldRight) : r;
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
   * > View(1, 3, 5).foldMap(Monoid.addition, id)
   * // 9
   *
   * > View(1, 3, 5).foldMap(Monoid.product, id)
   * // 15
   *
   * > View.range(1).foldMap(Monoid.disjunction, x => x > 5)
   * // true
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
  public foldMapK<F, B>(
    F: MonoidK<F>,
    f: (a: A) => Kind<F, [B]>,
  ): Kind<F, [B]> {
    return this.foldMap(F.algebra<B>(), f);
  }

  /**
   * Left-associative, strict version of `foldMap`.
   *
   * `foldMapLeft` is a strict, _non_-short-circuiting function needing to evaluate
   * the entire view.
   */
  public foldMapLeft<M>(M: Monoid<M>, f: (a: A) => M): M {
    return this.foldLeft(M.empty, (b, a) => M.combine_(b, f(a)));
  }

  // -- Traversals

  /**
   * Transform each element of the structure into an applicative action and
   * evaluate them left-to-right combining their result into a `View`.
   *
   * `traverse` uses `map2Eval` function of the provided applicative `G` allowing
   * for short-circuiting.
   *
   * @see traverse_ for result-ignoring version.
   * @see traverseList for a `List` producing traversal.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3, 4).traverse(Option.Monad, Some).map(xs => xs.toArray)
   * // Some([1, 2, 3, 4])
   *
   * > View(1, 2, 3, 4).traverse(Option.Monad, _ => None).map(xs => xs.toArray)
   * // None
   *
   * > View.range(1).traverse(Option.Monad, Some).map(xs => xs.toArray)
   * // *hangs*
   *
   * > View.range(1).traverse(Option.Monad, _ => None).map(xs => xs.toArray)
   * // None
   * ```
   */
  public traverse<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [B]>,
  ): Kind<G, [View<B>]> {
    return isIdentityTC(G)
      ? (this.map(f) as any)
      : G.map_(this.traverseList(G, f), xs => xs.view);
  }

  /**
   * Version of `traverse` that instead of a `View`, produces a `List`. This is
   * a function typically used when views are used for "fusion":
   *
   * ```typescript
   * const xs: List<A> = ...;
   * const ys: Kind<G, [List<B>]> = xs.view
   *  .map(f)
   *  .filter(g)
   *  .traverseList(G, h);
   * ```
   */
  public traverseList<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [B]>,
  ): Kind<G, [List<B>]> {
    return this.foldRight(Eval.now(G.pure(List.empty as List<B>)), (x, eys) =>
      G.map2Eval_(f(x), eys, List.cons),
    ).value;
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
   * @see sequenceList for `List` producing version.
   *
   * @examples
   *
   * ```View
   * > View(Some(1), Some(2), Some(3)).sequence(Option.Monad).map(xs => xs.toArray)
   * // Some([1, 2, 3])
   *
   * > View(Some(1), Some(2), None).sequence(Option.Monad)
   * // None
   * ```
   */
  public sequence<G, A>(
    this: View<Kind<G, [A]>>,
    G: Applicative<G>,
  ): Kind<G, [View<A>]> {
    return this.traverse(G, id);
  }

  /**
   * Version of `sequence` that instead of a `View`, produces a `List`. This
   * version is typically used when views are used for "fusion":
   *
   * ```typescript
   * const xs: List<A> = ...;
   * const ys: Kind<G, [List<B>]> = xs.view
   *  .filter(p)
   *  .map(f)
   *  .sequenceList(G);
   * ```
   */
  public sequenceList<G, A>(
    this: View<Kind<G, [A]>>,
    G: Applicative<G>,
  ): Kind<G, [List<A>]> {
    return this.traverseList(G, id);
  }

  /**
   * Transform each element of the structure into an applicative action and
   * evaluate them left-to-right ignoring the results.
   *
   * `traverseA` uses `map2Eval` function of the provided applicative `G` allowing
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
   * `sequenceA` uses `map2Eval` function of the provided applicative `G` allowing
   * for short-circuiting.
   */
  public sequence_<G>(
    this: View<Kind<G, [unknown]>>,
    G: Applicative<G>,
  ): Kind<G, [void]> {
    return this.traverse_(G, id);
  }

  /**
   * Version of `traverse` which removes elements of the original view.
   *
   * @see traverseFilterList for `List` producing variant.
   *
   * @examples
   *
   * ```typescript
   * > const m: Map<number, string> = Map([1, 'one'], [3, 'three'])
   * > View(1, 2, 3).traverseFilter(
   * >   Monad.Eval,
   * >   k => Eval.now(m.lookup(k)),
   * > ).value.toArray
   * // ['one', 'three']
   * ```
   */
  public traverseFilter<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [Option<B>]>,
  ): Kind<G, [View<B>]> {
    return isIdentityTC(G)
      ? (this.collect(f as any) as any)
      : G.map_(this.traverseFilterList(G, f), xs => xs.view);
  }

  /**
   * Version of `traverseFilter` producing a `List`. This version is typically
   * used when views are used for "fusion".
   */
  public traverseFilterList<G, B>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [Option<B>]>,
  ): Kind<G, [List<B>]> {
    const consOpt = (x: Option<B>, ys: List<B>): List<B> =>
      x === None ? ys : ys.prepend(x.get);

    return this.foldRight(Eval.now(G.pure(List.empty as List<B>)), (x, eys) =>
      G.map2Eval_(f(x), eys, consOpt),
    ).value;
  }

  // -- Strings

  /**
   * Given a view of strings, combine them into a single string separated by the
   * separator `sep`.
   *
   * `join` is a strict, _non_-short-circuiting function needing to evaluate
   * the entire view.
   *
   * @examples
   *
   * ```typescript
   * > View(1, 2, 3).join()
   * // '1,2,3'
   *
   * > View('a', 'b', 'c').join(' ')
   * // 'a b c'
   *
   * > View('a', 'b', 'c').join('')
   * // 'abc'
   * ```
   */
  public join(this: View<string>, sep: string = ','): string {
    return this.intersperse(sep).foldLeft('', (xs, ys) => xs + ys);
  }

  public toString(): string {
    return `View(..)`;
  }
}

const emptyHead = Eval.always(() =>
  throwError(new Error('View.head: empty View')),
);
const emptyLast = () => throwError(new Error('View.last: empty View'));
const emptyMax = () => throwError(new Error('View.max: empty View'));
const emptyMin = () => throwError(new Error('View.min: empty View'));
const emptyFoldLeft = () => throwError(new Error('View.foldLeft1: empty View'));
const emptyFoldRight = () =>
  throwError(new Error('View.foldRight1: empty View'));
const indexOutOfBounds = Eval.always(iob);
const emptyOption = Eval.now(None);

function iob(): never {
  throw new Error('IndexOutOfBounds');
}

// -- Instances

const viewFunctor = lazy(() =>
  Functor.of<ViewF>({
    map_: (fa, f) => fa.map(f),
  }),
);

const viewFunctorFilter = lazy(() =>
  FunctorFilter.of<ViewF>({
    ...viewFunctor(),
    mapFilter_: (fa, f) => fa.collect(f),
    collect_: (fa, f) => fa.collect(f),
    filter_: <A>(fa: View<A>, f: (a: A) => boolean) => fa.filter(f),
    filterNot_: (fa, f) => fa.filterNot(f),
  }),
);

const viewMonoidK = lazy(() =>
  MonoidK.of<ViewF>({
    combineK_: (fa, fb) => fa.concat(fb),
    combineKEval_: (fa, efb) => Eval.now(fa.concatEval(efb)),
    emptyK: () => View.empty,
  }),
);

const viewApply = lazy(() =>
  Apply.of<ViewF>({
    ...viewFunctor(),
    ap_: (ff, fa) => ff.map2(fa, (f, a) => f(a)),
    map2_: (fa, fb, f) => fa.map2(fb, f),
    map2Eval_: (fa, efb, f) => fa.map2Eval(efb, f),
  }),
);

const viewApplicative = lazy(() =>
  Applicative.of<ViewF>({
    ...viewApply(),
    pure: View.singleton,
  }),
);

const viewAlternative = lazy(() =>
  Alternative.of<ViewF>({
    ...viewMonoidK(),
    ...viewApplicative(),
  }),
);

const viewMonad = lazy(() =>
  Monad.of<ViewF>({
    ...viewApplicative(),
    flatMap_: (fa, f) => fa.flatMap(f),
    flatten: ffa => ffa.flatten(),
    tailRecM_: View.tailRecM_,
  }),
);

const viewFoldable = lazy(() =>
  Foldable.of<ViewF>({
    foldRight_: (fa, ez, f) => fa.foldRight(ez, f),
    foldLeft_: (fa, z, f) => fa.foldLeft(z, f),
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(fa: View<A>, f: (a: A) => M) =>
        fa.foldMap(M, f),
    foldMapLeft_:
      <M>(M: Monoid<M>) =>
      <A>(fa: View<A>, f: (a: A) => M) =>
        fa.foldMapLeft(M, f),
    foldMapK_:
      <F>(F: MonoidK<F>) =>
      <A, B>(fa: View<A>, f: (a: A) => Kind<F, [B]>) =>
        fa.foldMapK(F, f),

    size: fa => fa.size,
    isEmpty: fa => fa.isEmpty,
    nonEmpty: fa => fa.nonEmpty,
    all_: (fa, p) => fa.all(p),
    any_: (fa, p) => fa.any(p),
    count_: (fa, p) => fa.count(p),

    iterator: fa => fa.iterator,
    toArray: fa => fa.toArray,
  }),
);

const viewTraversableFilter = lazy(() =>
  TraversableFilter.of<ViewF>({
    ...viewFunctorFilter(),
    ...viewFoldable(),
    traverseFilter_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: View<A>, f: (a: A) => Kind<G, [Option<B>]>) =>
        fa.traverseFilter(G, f),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: View<A>, f: (a: A) => Kind<G, [B]>) =>
        fa.traverse(G, f),
    sequence:
      <G>(G: Applicative<G>) =>
      <A>(fa: View<Kind<G, [A]>>) =>
        fa.sequence(G),
  }),
);

const viewUnzip = lazy(() =>
  Unzip.of<ViewF>({
    ...viewFunctor(),
    unzip: fa => fa.unzip(),
    zipWith_: (fa, fb, f) => fa.zipWith(fb, f),
    zip_: (fa, fb) => fa.zip(fb),
  }),
);

View.empty = View.build<never>((ez, _f) => ez);

View.FunctorFilter = null as any as FunctorFilter<ViewF>;
View.MonoidK = null as any as MonoidK<ViewF>;
View.Alternative = null as any as Alternative<ViewF>;
View.Monad = null as any as Monad<ViewF>;
View.Foldable = null as any as Foldable<ViewF>;
View.TraversableFilter = null as any as TraversableFilter<ViewF>;
View.Unzip = null as any as Unzip<ViewF>;

Object.defineProperty(View, 'FunctorFilter', {
  get() {
    return viewFunctorFilter();
  },
});
Object.defineProperty(View, 'MonoidK', {
  get() {
    return viewMonoidK();
  },
});
Object.defineProperty(View, 'Alternative', {
  get() {
    return viewAlternative();
  },
});
Object.defineProperty(View, 'Monad', {
  get() {
    return viewMonad();
  },
});
Object.defineProperty(View, 'Foldable', {
  get() {
    return viewFoldable();
  },
});
Object.defineProperty(View, 'TraversableFilter', {
  get() {
    return viewTraversableFilter();
  },
});
Object.defineProperty(View, 'Unzip', {
  get() {
    return viewUnzip();
  },
});

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface ViewF extends TyK<[unknown]> {
  [$type]: View<TyVar<this, 0>>;
}
