// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $type,
  Eval,
  HKT,
  Kind,
  lazy,
  PrimitiveType,
  throwError,
  tupled,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { Applicative } from '../../applicative';
import { Foldable } from '../../foldable';
import { EqK } from '../../eq-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { MonoidK } from '../../monoid-k';
import { SemigroupK } from '../../semigroup-k';
import { MonadPlus } from '../../monad-plus';
import { Defer } from '../../defer';
import { Alternative } from '../../alternative';
import { Align } from '../../align';
import { MonadDefer } from '../../monad-defer';
import { TraversableFilter } from '../../traversable-filter';
import { Apply, TraverseStrategy } from '../../apply';

import { None, Option, Some } from '../option';
import { Ior } from '../ior';
import { Iter } from '../iterator';
import { isIdentityTC } from '../identity';
import { List, ListBuffer } from './list';
import { Vector } from './vector';
import { View } from './view';

/**
 * `LazyList` is implementation of fully lazy linked list.
 *
 * Equivalent to:
 *
 * ```typescript
 * type LazyList<A> = Eval<Option<[A, LazyList<A>]>>
 * ```
 */
export type LazyList<A> = _LazyList<A>;
export const LazyList: LazyListObj = function <A>(...xs: A[]): LazyList<A> {
  return LazyList.fromArray(xs);
} as any;

interface LazyListObj {
  empty: LazyList<never>;
  singleton<A>(x: A): LazyList<A>;
  consEval<A>(x: A, exs: Eval<LazyList<A>>): LazyList<A>;
  defer<A>(thunk: () => LazyList<A>): LazyList<A>;
  unfoldRight<A, B>(z: B, f: (b: B) => Option<[A, B]>): LazyList<A>;
  range(from: number, until?: number, step?: number): LazyList<number>;
  iterate<A>(a: A, f: (a: A) => A): LazyList<A>;

  <A>(...xs: A[]): LazyList<A>;
  fromArray<A>(xs: A[]): LazyList<A>;
  fromList<A>(xs: List<A>): LazyList<A>;
  fromVector<A>(xs: Vector<A>): LazyList<A>;
  fromView<A>(xs: View<A>): LazyList<A>;
  fromIterator<A>(xs: Iterator<A>): LazyList<A>;
  fromFoldable<F>(F: Foldable<F>): <A>(fa: Kind<F, [A]>) => LazyList<A>;

  // -- Instances

  EqK: EqK<LazyListF>;
  Defer: Defer<LazyListF>;
  Align: Align<LazyListF>;
  SemigroupK: SemigroupK<LazyListF>;
  MonoidK: MonoidK<LazyListF>;
  Alternative: Alternative<LazyListF>;
  Functor: Functor<LazyListF>;
  FunctorFilter: FunctorFilter<LazyListF>;
  Applicative: Applicative<LazyListF>;
  Monad: MonadDefer<LazyListF>;
  MonadPlus: MonadPlus<LazyListF>;
  Foldable: Foldable<LazyListF>;
  TraversableFilter: TraversableFilter<LazyListF>;
}

export class _LazyList<out A> {
  static defer = <A>(thunk: () => LazyList<A>): LazyList<A> =>
    new _LazyList(Eval.defer(() => thunk().source));

  static consEval = <A>(x: A, exs: Eval<LazyList<A>>): LazyList<A> =>
    new _LazyList(
      Eval.now(
        new Cons(
          x,
          exs.flatMap(l => l.source),
        ),
      ),
    );

  public constructor(private _source: Eval<Source<A>>) {}

  private _forcedSource?: Source<A>;
  private get source(): Eval<Source<A>> {
    return this._forcedSource
      ? Eval.now(this._forcedSource)
      : (this._source = this._source.memoize);
  }

  private get forceSource(): Source<A> {
    if (this._forcedSource) return this._forcedSource;
    this._forcedSource = this._source.value;
    (this._source as any) = null; // Dereference tail to allow for GC
    return this._forcedSource;
  }

  public get isEmpty(): boolean {
    return this.forceSource === Nil;
  }
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }

  public get head(): A {
    return this.headOption.getOrElse(() =>
      throwError(new Error('LazyList.Nil.head')),
    );
  }

  public get headOption(): Option<A> {
    const source = this.forceSource;
    return source === Nil ? None : Some(source.head);
  }

  public get tail(): LazyList<A> {
    const source = this.forceSource;
    return source === Nil ? LazyList.empty : new _LazyList(source.tail);
  }

  public get last(): A {
    return this.lastOption.getOrElse(() =>
      throwError(new Error('LazyList.Nil.last')),
    );
  }

  public get lastOption(): Option<A> {
    let cur = this.forceSource;
    while (cur !== Nil) {
      const tmp = cur.forceTail;
      if (tmp === Nil) return Some(cur.head);
      cur = tmp;
    }
    return None;
  }

  public get init(): LazyList<A> {
    const go = (src: Source<A>): Source<A> => {
      const tail = src.forceTail;
      return tail === Nil
        ? Nil
        : new Cons(
            src.head,
            Eval.later(() => go(tail)),
          );
    };
    return new _LazyList(this.source.map(src => (src === Nil ? Nil : go(src))));
  }

  public get size(): number {
    return this.foldLeft(0, (x, _) => x + 1);
  }

  public get uncons(): Option<[A, LazyList<A>]> {
    const source = this.forceSource;
    return source === Nil
      ? None
      : Some([source.head, new _LazyList(source.tail)]);
  }

  public get view(): View<A> {
    return View.fromLazyList(this);
  }

  public get toArray(): A[] {
    return this.foldLeft([] as A[], (xs, x) => {
      xs.push(x);
      return xs;
    });
  }

  public get toList(): List<A> {
    return this.foldLeft(new ListBuffer<A>(), (ac, x) => ac.addOne(x)).toList;
  }

  public get toVector(): Vector<A> {
    return Vector.fromArray(this.toArray);
  }

  public get iterator(): Iterator<A> {
    let cur_: Eval<Source<A>> = this.source;
    return Iter.lift(() => {
      const tmp = cur_.value;
      return tmp === Nil
        ? Iter.Result.done
        : ((cur_ = tmp.tail), Iter.Result.pure(tmp.head));
    });
  }

  public get reverse(): LazyList<A> {
    return new _LazyList(
      this.source.map(cur => {
        let acc: Source<A> = Nil;
        while (cur !== Nil) {
          acc = new Cons(cur.head, Eval.now(acc));
          cur = cur.forceTail;
        }
        return acc;
      }),
    );
  }

  [Symbol.iterator](): Iterator<A> {
    return this.iterator;
  }

  public prepend<B>(this: LazyList<B>, x: B): LazyList<B> {
    return new _LazyList(Eval.now(new Cons(x, this.source)));
  }
  public cons<B>(this: LazyList<B>, x: B): LazyList<B> {
    return this.prepend(x);
  }
  public '+::'<B>(this: LazyList<B>, x: B): LazyList<B> {
    return this.prepend(x);
  }

  public append<B>(this: LazyList<B>, x: B): LazyList<B> {
    return this.concat(LazyList.singleton(x));
  }
  public snoc<B>(this: LazyList<B>, x: B): LazyList<B> {
    return this.append(x);
  }
  public '::+'<B>(this: LazyList<B>, x: B): LazyList<B> {
    return this.append(x);
  }

  public concat<B>(this: LazyList<B>, that: LazyList<B>): LazyList<B> {
    return new _LazyList(this.source.flatMap(src => src.concat(that.source)));
  }
  public '+++'<B>(this: LazyList<B>, that: LazyList<B>): LazyList<B> {
    return this.concat(that);
  }

  public concatEval<B>(
    this: LazyList<B>,
    that: Eval<LazyList<B>>,
  ): LazyList<B> {
    return new _LazyList(
      this.source.flatMap(src => src.concat(that.flatMap(xs => xs.source))),
    );
  }

  public all(p: (a: A) => boolean): boolean {
    return this.foldRight(Eval.now(true), (x, eb) => (!p(x) ? Eval.false : eb))
      .value;
  }
  public any(p: (a: A) => boolean): boolean {
    return this.foldRight(Eval.now(false), (x, eb) => (p(x) ? Eval.true : eb))
      .value;
  }
  public count(p: (a: A) => boolean): number {
    return this.foldLeft(0, (x, y) => (p(y) ? x + 1 : x));
  }

  public take(n: number): LazyList<A> {
    return n <= 0
      ? LazyList.empty
      : new _LazyList(this.source.map(src => src.take(n)));
  }

  public takeWhile<B extends A>(p: (a: A) => a is B): LazyList<B>;
  public takeWhile(p: (a: A) => boolean): LazyList<A>;
  public takeWhile(p: (a: A) => boolean): LazyList<A> {
    return new _LazyList(this.source.map(source => source.takeWhile(p)));
  }

  public drop(n: number): LazyList<A> {
    return n <= 0
      ? this
      : new _LazyList(this.source.map(source => source.drop(n)));
  }

  public dropWhile(p: (a: A) => boolean): LazyList<A> {
    return new _LazyList(this.source.map(source => source.dropWhile(p)));
  }

  public slice(from: number, until: number): LazyList<A> {
    from = Math.max(from, 0);
    until = Math.max(until, 0);
    return until <= from ? LazyList.empty : this.drop(from).take(until - from);
  }

  public splitAt(n: number): [LazyList<A>, LazyList<A>] {
    return [this.take(n), this.drop(n)];
  }

  public filter<B extends A>(f: (a: A) => a is B): LazyList<B>;
  public filter(f: (a: A) => boolean): LazyList<A>;
  public filter(f: (a: A) => boolean): LazyList<A> {
    return new _LazyList(this.source.map(source => source.filter(f)));
  }

  public filterNot(f: (a: A) => boolean): LazyList<A> {
    return this.filter(x => !f(x));
  }

  public collect<B>(f: (a: A) => Option<B>): LazyList<B> {
    return new _LazyList(this.source.map(source => source.collect(f)));
  }

  public map<B>(f: (a: A) => B): LazyList<B> {
    return new _LazyList(this.source.map(source => source.map(f)));
  }

  public map2<B, C>(that: LazyList<B>, f: (a: A, b: B) => C): LazyList<C> {
    return new _LazyList(
      this.source.flatMap(l =>
        l === Nil
          ? Eval.now(Nil)
          : that.source.flatMap(r =>
              r === Nil
                ? Eval.now(Nil)
                : l.flatMap(l => Eval.now(r.map(r => f(l, r)))),
            ),
      ),
    );
  }

  public map2Eval<B, C>(
    that: Eval<LazyList<B>>,
    f: (a: A, b: B) => C,
  ): Eval<LazyList<C>> {
    return this.source.flatMap(source =>
      source === Nil
        ? Eval.now(LazyList.empty)
        : that.map(that => this.map2(that, f)),
    );
  }

  public flatMap<B>(f: (a: A) => LazyList<B>): LazyList<B> {
    return new _LazyList(
      this.source.flatMap(src =>
        src === Nil
          ? Eval.now(Nil)
          : src.foldRight(Eval.now(Nil as Source<B>), (a, ebs) =>
              f(a).source.flatMap(bs => bs.concat(ebs)),
            ),
      ),
    );
  }

  public zip<B>(that: LazyList<B>): LazyList<[A, B]> {
    return this.zipWith(that, tupled);
  }
  public zipWith<B, C>(that: LazyList<B>, f: (a: A, b: B) => C): LazyList<C> {
    return new _LazyList(
      this.source.flatMap(l =>
        l === Nil ? Eval.now(Nil) : that.source.map(r => l.zipWith(r, f)),
      ),
    );
  }

  public align<B>(this: LazyList<A>, that: LazyList<B>): LazyList<Ior<A, B>> {
    return this.map(Some).zipAllWith(
      that.map(Some),
      () => None,
      () => None,
      (a, b) => Ior.fromOptions(a, b).get,
    );
  }

  public zipAllWith<B, C>(
    this: LazyList<A>,
    that: LazyList<B>,
    defaultA: () => A,
    defaultB: () => B,
    f: (a: A, b: B) => C,
  ): LazyList<C> {
    return new _LazyList(
      this.source.flatMap(l =>
        that.source.map(r => l.zipAllWith(r, defaultA, defaultB, f)),
      ),
    );
  }

  public get zipWithIndex(): LazyList<[A, number]> {
    return this.zip(LazyList.range(0));
  }

  public foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M {
    return f =>
      this.foldRight(Eval.now(M.empty), (a, efb) => M.combineEval_(f(a), efb))
        .value;
  }

  public foldMapLeft<M>(M: Monoid<M>): (f: (a: A) => M) => M {
    return f => this.foldLeft(M.empty, (b, a) => M.combine_(b, f(a)));
  }

  public foldMapK<F>(
    F: MonoidK<F>,
  ): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]> {
    return this.foldMap(F.algebra<any>());
  }

  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    let cur = this.forceSource;
    while (cur !== Nil) {
      z = f(z, cur.head);
      cur = cur.forceTail;
    }
    return z;
  }

  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    return this.source.flatMap(source => source.foldRight(ez, f));
  }

  public scanLeft<B>(z: B, f: (b: B, a: A) => B): LazyList<B> {
    return new _LazyList(
      Eval.now(
        new Cons(
          z,
          this.source.map(source => source.scanLeft(z, f)),
        ),
      ),
    );
  }

  public scanRight<B>(
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): LazyList<B> {
    return new _LazyList(
      this.source.flatMap(source => source.scanRight(ez, f)),
    );
  }

  public traverse<G>(
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [LazyList<B>]> {
    return isIdentityTC(G)
      ? f => this.map(f) as any
      : Apply.TraverseStrategy(G)(Rhs => this.traverseImpl(G, Rhs));
  }

  private traverseImpl<G, Rhs>(
    G: Applicative<G>,
    Rhs: TraverseStrategy<G, Rhs>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [LazyList<B>]> {
    return <B>(f: (a: A) => Kind<G, [B]>): Kind<G, [LazyList<B>]> => {
      const go = (xs: Source<A>): Kind<Rhs, [Kind<G, [LazyList<B>]>]> =>
        xs === Nil
          ? Rhs.toRhs(() => G.pure(LazyList.empty))
          : Rhs.map2Rhs(
              f(xs.head),
              Rhs.defer(() => go(xs.forceTail)),
              (y, ys) => ys.cons(y),
            );

      return Rhs.toG(Rhs.defer(() => go(this.forceSource)));
    };
  }

  public traverseFilter<G>(
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [Option<B>]>) => Kind<G, [LazyList<B>]> {
    return isIdentityTC(G)
      ? f => this.collect(f as any) as any
      : Apply.TraverseStrategy(G)(Rhs => this.traverseFilterImpl(G, Rhs));
  }

  private traverseFilterImpl<G, Rhs>(
    G: Applicative<G>,
    Rhs: TraverseStrategy<G, Rhs>,
  ): <B>(f: (a: A) => Kind<G, [Option<B>]>) => Kind<G, [LazyList<B>]> {
    return <B>(f: (a: A) => Kind<G, [Option<B>]>): Kind<G, [LazyList<B>]> => {
      const go = (xs: Source<A>): Kind<Rhs, [Kind<G, [LazyList<B>]>]> =>
        xs === Nil
          ? Rhs.toRhs(() => G.pure(LazyList.empty))
          : Rhs.map2Rhs(
              f(xs.head),
              Rhs.defer(() => go(xs.forceTail)),
              (y, ys) => (y.nonEmpty ? ys.cons(y.get) : ys),
            );

      return Rhs.toG(Rhs.defer(() => go(this.forceSource)));
    };
  }

  public distinct<A>(this: LazyList<A>, E: Eq<A>): LazyList<A>;
  public distinct<A extends PrimitiveType>(this: LazyList<A>): LazyList<A>;
  public distinct(E: Eq<any> = Eq.fromUniversalEquals()): LazyList<any> {
    return this.distinctBy(E.equals);
  }

  public distinctBy(cmp: (x: A, y: A) => boolean): LazyList<A> {
    return new _LazyList(this.source.map(source => source.distinctBy(cmp)));
  }

  public sort<A>(
    this: LazyList<A>,
    O: Ord<A> = Ord.fromUniversalCompare(),
  ): LazyList<A> {
    return LazyList.defer(() =>
      LazyList.fromArray(this.toArray.sort((a, b) => O.compare(a, b) - 1)),
    );
  }

  public equals<A>(this: LazyList<A>, that: LazyList<A>, E: Eq<A>): boolean {
    let xs = this.forceSource;
    let ys = that.forceSource;
    while (xs !== Nil && ys !== Nil) {
      if (xs === ys) return true;
      if (E.notEquals(xs.head, ys.head)) return false;
      xs = xs.forceTail;
      ys = ys.forceTail;
    }
    return xs === ys;
  }

  public toString(): string {
    return 'LazyList(..)';
  }
}

Object.defineProperty(LazyList, 'empty', {
  get() {
    return new _LazyList(Eval.now(Nil));
  },
});

LazyList.singleton = <A>(x: A): LazyList<A> =>
  new _LazyList(Eval.now(new Cons(x, Eval.now(Nil))));

LazyList.defer = <A>(thunk: () => LazyList<A>): LazyList<A> =>
  _LazyList.defer(thunk);

LazyList.consEval = <A>(x: A, exs: Eval<LazyList<A>>): LazyList<A> =>
  _LazyList.consEval(x, exs);

LazyList.unfoldRight = <A, B>(
  z: B,
  f: (b: B) => Option<[A, B]>,
): LazyList<A> => {
  const go = (b: B): Source<A> =>
    f(b).fold(
      () => Nil,
      ([a, b]) =>
        new Cons(
          a,
          Eval.later(() => go(b)),
        ),
    );
  return new _LazyList(Eval.later(() => go(z)));
};

LazyList.range = (
  from: number,
  to: number = Infinity,
  step: number = 1,
): _LazyList<number> => {
  const go = (n: number): Source<number> =>
    n >= to
      ? Nil
      : new Cons(
          n,
          Eval.later(() => go(n + step)),
        );
  return new _LazyList(Eval.later(() => go(from)));
};

LazyList.iterate = <A>(s: A, f: (a: A) => A): LazyList<A> => {
  const go = (a: A): Source<A> =>
    new Cons(
      a,
      Eval.later(() => go(f(a))),
    );
  return new _LazyList(Eval.later(() => go(s)));
};

LazyList.fromArray = <A>(xs: A[]): LazyList<A> =>
  xs.length === 0
    ? LazyList.empty
    : xs.length === 1
    ? LazyList.singleton(xs[0])
    : LazyList.fromIterator(xs[Symbol.iterator]());

LazyList.fromList = <A>(xs: List<A>): LazyList<A> =>
  LazyList.fromIterator(xs.iterator);

LazyList.fromVector = <A>(xs: Vector<A>): LazyList<A> =>
  LazyList.fromIterator(xs.iterator);

LazyList.fromView = <A>(xs: View<A>): LazyList<A> =>
  new _LazyList(
    xs.foldRight(Eval.now(Nil as Source<A>), (x, xs) =>
      Eval.now(new Cons(x, xs)),
    ),
  );

LazyList.fromIterator = <A>(it: Iterator<A>): LazyList<A> => {
  const go = (next: IteratorResult<A>): Source<A> =>
    next.done
      ? Nil
      : new Cons(
          next.value,
          Eval.later(() => go(it.next())),
        );
  return new _LazyList(Eval.later(() => go(it.next())));
};

LazyList.fromFoldable =
  <F>(F: Foldable<F>) =>
  <A>(fa: Kind<F, [A]>): LazyList<A> =>
    new _LazyList(
      F.foldRight_(fa, Eval.now(Nil as Source<A>), (h, tl) =>
        Eval.now(new Cons(h, tl)),
      ),
    );

abstract class Source<out A> {
  abstract readonly head: A;
  abstract readonly tail: Eval<Source<A>>;
  abstract readonly forceTail: Source<A>;

  abstract take(n: number): Source<A>;
  abstract takeWhile(p: (a: A) => boolean): Source<A>;
  abstract drop(n: number): Source<A>;
  abstract dropWhile(p: (a: A) => boolean): Source<A>;
  abstract filter<B extends A>(f: (a: A) => a is B): Source<B>;
  abstract filter(f: (a: A) => boolean): Source<A>;
  abstract collect<B>(f: (a: A) => Option<B>): Source<B>;
  abstract concat<B>(this: Source<B>, that: Eval<Source<B>>): Eval<Source<B>>;

  abstract map<B>(f: (a: A) => B): Source<B>;
  abstract flatMap<B>(f: (a: A) => Eval<Source<B>>): Eval<Source<B>>;
  abstract foldRight<B>(
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): Eval<B>;

  abstract scanLeft<B>(z: B, f: (b: B, a: A) => B): Source<B>;
  abstract scanRight<B>(
    ez: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ): Eval<Cons<B>>;

  abstract zipWith<B, C>(that: Source<B>, f: (a: A, b: B) => C): Source<C>;

  abstract zipAllWith<A, B, C>(
    this: Source<A>,
    that: Source<B>,
    defaultA: () => A,
    defaultB: () => B,
    f: (a: A, b: B) => C,
  ): Source<C>;

  abstract distinctBy(cmp: (x: A, y: A) => boolean): Source<A>;
}

const Nil: Source<never> = new (class Nil extends Source<never> {
  get head(): never {
    throw new Error();
  }
  get tail(): never {
    throw new Error();
  }
  get forceTail(): never {
    throw new Error();
  }

  take() {
    return this;
  }

  takeWhile() {
    return this;
  }

  drop() {
    return this;
  }

  dropWhile() {
    return this;
  }

  filter() {
    return this;
  }
  collect() {
    return this;
  }

  map() {
    return this;
  }

  concat<B>(that: Eval<Source<B>>) {
    return that;
  }

  flatMap<B>(f: (a: never) => Eval<Source<B>>): Eval<Source<B>> {
    return Eval.now(this);
  }

  foldRight<B>(ez: Eval<B>, f: (a: never, eb: Eval<B>) => Eval<B>): Eval<B> {
    return ez;
  }

  scanLeft() {
    return this;
  }

  scanRight<B>(
    ez: Eval<B>,
    f: (a: never, b: Eval<B>) => Eval<B>,
  ): Eval<Cons<B>> {
    return ez.map(h => new Cons(h, Eval.now(this)));
  }

  zipWith<B, C>(that: Source<B>, f: (a: never, b: B) => C): Source<C> {
    throw new Error('Nil.zipWith');
  }

  zipAllWith<A, B, C>(
    this: Source<A>,
    that: Source<B>,
    defaultA: () => A,
    defaultB: () => B,
    f: (a: A, b: B) => C,
  ): Source<C> {
    return that.map(b => f(defaultA(), b));
  }

  distinctBy() {
    return this;
  }
})();

class Cons<out A> extends Source<A> {
  public constructor(public readonly head: A, private _tail: Eval<Source<A>>) {
    super();
  }
  private _forcedTail?: Source<A>;

  public get tail(): Eval<Source<A>> {
    return this._forcedTail
      ? Eval.now(this._forcedTail)
      : (this._tail = this._tail.memoize);
  }

  public get forceTail(): Source<A> {
    if (this._forcedTail) return this._forcedTail;

    const source = this._tail.value;
    this._forcedTail = source;
    (this._tail as any) = null; // Deference tail to allow for GC
    return source;
  }

  public take(n: number): Source<A> {
    return n <= 1
      ? new Cons(this.head, Eval.now(Nil))
      : new Cons(
          this.head,
          this.tail.map(tail => tail.take(n - 1)),
        );
  }

  public takeWhile(p: (a: A) => boolean): Source<A> {
    return p(this.head)
      ? new Cons(
          this.head,
          this.tail.map(tail => tail.takeWhile(p)),
        )
      : Nil;
  }

  public drop(n: number): Source<A> {
    let cur = this as Source<A>;
    while (cur != Nil && n > 0) {
      cur = cur.forceTail;
      n -= 1;
    }
    return cur;
  }

  public dropWhile(p: (a: A) => boolean): Source<A> {
    let cur = this as Source<A>;
    while (cur !== Nil && p(cur.head)) {
      cur = cur.forceTail;
    }
    return cur;
  }

  public filter<B extends A>(f: (a: A) => a is B): Source<B>;
  public filter(f: (a: A) => boolean): Source<A>;
  public filter(f: (a: A) => boolean): Source<A> {
    if (f(this.head))
      return new Cons(
        this.head,
        this.tail.map(tail => tail.filter(f)),
      );

    for (let cur = this.forceTail; cur !== Nil; cur = cur.forceTail)
      if (f(cur.head))
        return new Cons(
          cur.head,
          cur.tail.map(tail => tail.filter(f)),
        );
    return Nil;
  }

  public collect<B>(f: (a: A) => Option<B>): Source<B> {
    const x = f(this.head);
    if (x.nonEmpty)
      return new Cons(
        x.get,
        this.tail.map(tail => tail.collect(f)),
      );

    for (let cur = this.forceTail; cur !== Nil; cur = cur.forceTail) {
      const x = f(cur.head);
      if (x.nonEmpty)
        return new Cons(
          x.get,
          cur.tail.map(tail => tail.collect(f)),
        );
    }
    return Nil;
  }

  public map<B>(f: (a: A) => B): Source<B> {
    return new Cons(
      f(this.head),
      this.tail.map(tail => tail.map(f)),
    );
  }

  public concat<B>(this: Cons<B>, that: Eval<Source<B>>): Eval<Source<B>> {
    return Eval.now(
      new Cons(
        this.head,
        this.tail.flatMap(tail => tail.concat(that)),
      ),
    );
  }

  public flatMap<B>(f: (a: A) => Eval<Source<B>>): Eval<Source<B>> {
    return f(this.head).flatMap(hds =>
      hds.concat(this.tail.flatMap(tail => tail.flatMap(f))),
    );
  }

  public zipWith<B, C>(that: Source<B>, f: (a: A, b: B) => C): Source<C> {
    return that === Nil
      ? Nil
      : new Cons(
          f(this.head, that.head),
          this.tail.map(tail =>
            tail === Nil
              ? Nil // do not force rhs unless there is something to zip it with
              : tail.zipWith(that.forceTail, f),
          ),
        );
  }

  public zipAllWith<A, B, C>(
    this: Source<A>,
    that: Source<B>,
    defaultA: () => A,
    defaultB: () => B,
    f: (a: A, b: B) => C,
  ): Source<C> {
    return that === Nil
      ? this.map(a => f(a, defaultB()))
      : new Cons(
          f(this.head, that.head),
          this.tail.map(l =>
            l.zipAllWith(that.forceTail, defaultA, defaultB, f),
          ),
        );
  }

  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    return f(
      this.head,
      this.tail.flatMap(tail => tail.foldRight(ez, f)),
    );
  }

  public scanLeft<B>(z: B, f: (b: B, a: A) => B): Source<B> {
    const q = f(z, this.head);
    return new Cons(
      q,
      this.tail.map(tail => tail.scanLeft(q, f)),
    );
  }

  public scanRight<B>(
    ez: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ): Eval<Cons<B>> {
    const eqs = this.tail.flatMap(tail => tail.scanRight(ez, f)).memoize;
    return f(
      this.head,
      eqs.map(qs => qs.head),
    ).map(hd => new Cons(hd, eqs));
  }

  public distinctBy(cmp: (x: A, y: A) => boolean): Source<A> {
    const loop = (ys: Source<A>, dubs: A[]): Source<A> => {
      while (ys !== Nil && dubs.findIndex(z => cmp(ys.head, z)) >= 0) {
        ys = ys.forceTail;
      }
      return ys === Nil
        ? Nil
        : new Cons(
            ys.head,
            ys.tail.map(yss => (dubs.push(ys.head), loop(yss, dubs))),
          );
    };
    return loop(this, []);
  }
}

// -- Instances

const lazyListEqK = lazy(() =>
  EqK.of<LazyListF>({
    liftEq: <A>(A: Eq<A>) =>
      Eq.of({ equals: (lhs: LazyList<A>, rhs) => lhs.equals(rhs, A) }),
  }),
);

const lazyListDefer = lazy(() =>
  Defer.of<LazyListF>({ defer: LazyList.defer }),
);

const lazyListAlign = lazy(() =>
  Align.of<LazyListF>({
    ...lazyListFunctor(),
    align_: (fa, fb) => fa.align(fb),
    zipAll: (fa, fb, a, b) =>
      fa.zipAllWith(
        fb,
        () => a,
        () => b,
        tupled,
      ),
  }),
);

const lazyListSemigroupK = lazy(() =>
  SemigroupK.of<LazyListF>({
    combineK_: (fa, fb) => fa.concat(fb),
    combineKEval_: (fa, efb) => Eval.now(fa.concatEval(efb)),
  }),
);
const lazyListMonoidK = lazy(() =>
  MonoidK.of<LazyListF>({
    emptyK: () => LazyList.empty,
    combineK_: lazyListSemigroupK().combineK_,
    combineKEval_: lazyListSemigroupK().combineKEval_,
  }),
);
const lazyListAlternative = lazy(() =>
  Alternative.of<LazyListF>({
    ...lazyListApplicative(),
    ...lazyListMonoidK(),
  }),
);

const lazyListFunctor = lazy(() =>
  Functor.of<LazyListF>({ map_: (fa, f) => fa.map(f) }),
);

const lazyListFunctorFilter = lazy(() =>
  FunctorFilter.of<LazyListF>({
    ...lazyListFunctor(),
    mapFilter_: (fa, f) => fa.collect(f),
    collect_: (fa, f) => fa.collect(f),
    filter_: (<A>(fa: LazyList<A>, f: (a: A) => boolean) =>
      fa.filter(f)) as FunctorFilter<LazyListF>['filter_'],
    filterNot_: (fa, f) => fa.filterNot(f),
  }),
);

const lazyListApplicative = lazy(() =>
  Applicative.of<LazyListF>({
    ...lazyListFunctor(),
    pure: LazyList.singleton,
    ap_: (ff, fa) => ff.map2(fa, (f, a) => f(a)),
    map2_: (fa, fb, f) => fa.map2(fb, f),
    map2Eval_: (fa, efb, f) => fa.map2Eval(efb, f),
  }),
);

const lazyListMonad = lazy(() =>
  MonadDefer.of<LazyListF>({
    ...lazyListApplicative(),
    ...lazyListDefer(),
    flatMap_: (fa, f) => fa.flatMap(f),
  }),
);

const lazyListMonadPlus = lazy(() =>
  MonadPlus.of<LazyListF>({
    ...lazyListMonad(),
    ...lazyListAlternative(),
    ...lazyListFunctorFilter(),
  }),
);

const lazyListFoldable = lazy(() =>
  Foldable.of<LazyListF>({
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(fa: LazyList<A>, f: (a: A) => M) =>
        fa.foldMap(M)(f),
    foldMapLeft_:
      <M>(M: Monoid<M>) =>
      <A>(fa: LazyList<A>, f: (a: A) => M) =>
        fa.foldMapLeft(M)(f),
    foldMapK_:
      <F>(F: MonoidK<F>) =>
      <A, B>(fa: LazyList<A>, f: (a: A) => Kind<F, [B]>) =>
        fa.foldMapK(F)(f),
    iterator: fa => fa.iterator,
    foldLeft_: (fa, z, f) => fa.foldLeft(z, f),
    foldRight_: (fa, ez, f) => fa.foldRight(ez, f),
    any_: (fa, f) => fa.any(f),
    all_: (fa, f) => fa.all(f),
    count_: (fa, f) => fa.count(f),
    toArray: fa => fa.toArray,
  }),
);

const lazyListTraversableFilter = lazy(() =>
  TraversableFilter.of<LazyListF>({
    ...lazyListFoldable(),
    ...lazyListFunctor(),
    traverseFilter_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: LazyList<A>, f: (a: A) => Kind<G, [Option<B>]>) =>
        fa.traverseFilter(G)(f),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: LazyList<A>, f: (a: A) => Kind<G, [B]>) =>
        fa.traverse(G)(f),
  }),
);

Object.defineProperty(LazyList, 'EqK', {
  get() {
    return lazyListEqK();
  },
});

Object.defineProperty(LazyList, 'Align', {
  get() {
    return lazyListAlign();
  },
});

Object.defineProperty(LazyList, 'Defer', {
  get() {
    return lazyListDefer();
  },
});

Object.defineProperty(LazyList, 'SemigroupK', {
  get() {
    return lazyListSemigroupK();
  },
});
Object.defineProperty(LazyList, 'MonoidK', {
  get() {
    return lazyListMonoidK();
  },
});
Object.defineProperty(LazyList, 'Alternative', {
  get() {
    return lazyListAlternative();
  },
});

Object.defineProperty(LazyList, 'Functor', {
  get() {
    return lazyListFunctor();
  },
});
Object.defineProperty(LazyList, 'FunctorFilter', {
  get() {
    return lazyListFunctorFilter();
  },
});

Object.defineProperty(LazyList, 'Applicative', {
  get() {
    return lazyListApplicative();
  },
});
Object.defineProperty(LazyList, 'Monad', {
  get() {
    return lazyListMonad();
  },
});
Object.defineProperty(LazyList, 'MonadPlus', {
  get() {
    return lazyListMonadPlus();
  },
});

Object.defineProperty(LazyList, 'Foldable', {
  get() {
    return lazyListFoldable();
  },
});
Object.defineProperty(LazyList, 'TraversableFilter', {
  get() {
    return lazyListTraversableFilter();
  },
});

// -- HKT

export interface _LazyList<A> extends HKT<LazyListF, [A]> {}

/**
 * @category Type Constructor
 * @category Collection
 */
export interface LazyListF extends TyK<[unknown]> {
  [$type]: LazyList<TyVar<this, 0>>;
}
