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
import {
  Align,
  Alternative,
  Applicative,
  Defer,
  Eq,
  EqK,
  Foldable,
  Functor,
  FunctorFilter,
  Ior,
  isConstTC,
  isIdentityTC,
  Iter,
  MonadDefer,
  MonadPlus,
  Monoid,
  MonoidK,
  None,
  Option,
  Ord,
  SemigroupK,
  Some,
  TraversableFilter,
  TraverseStrategy,
} from '@fp4ts/cats';

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

  NilStep: Step<never>;
  consStep<A>(head: A, tail: Eval<Step<A>>): Step<A>;
  fromStep<A>(s: Step<A>): LazyList<A>;
  fromStepEval<A>(s: Eval<Step<A>>): LazyList<A>;

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
        new ConsStep(
          x,
          exs.flatMap(l => l.source),
        ),
      ),
    );

  static fromStep = <A>(s: Step<A>) => new _LazyList(Eval.now(s));
  static fromStepEval = <A>(s: Eval<Step<A>>) => new _LazyList(s);

  public constructor(private _source: Eval<Step<A>>) {}

  private _forcedSource?: Step<A>;
  private get source(): Eval<Step<A>> {
    return this._forcedSource
      ? Eval.now(this._forcedSource)
      : (this._source = this._source.memoize);
  }

  private get forceSource(): Step<A> {
    if (this._forcedSource) return this._forcedSource;
    this._forcedSource = this._source.value;
    (this._source as any) = null; // Dereference tail to allow for GC
    return this._forcedSource;
  }

  public get isEmpty(): boolean {
    return this.forceSource === NilStep;
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
    return source === NilStep ? None : Some(source.head);
  }

  public get tail(): LazyList<A> {
    const source = this.forceSource;
    return source === NilStep ? LazyList.empty : new _LazyList(source.tail);
  }

  public get last(): A {
    return this.lastOption.getOrElse(() =>
      throwError(new Error('LazyList.Nil.last')),
    );
  }

  public get lastOption(): Option<A> {
    let cur = this.forceSource;
    while (cur !== NilStep) {
      const tmp = cur.forceTail;
      if (tmp === NilStep) return Some(cur.head);
      cur = tmp;
    }
    return None;
  }

  public get init(): LazyList<A> {
    const go = (src: Step<A>): Step<A> => {
      const tail = src.forceTail;
      return tail === NilStep
        ? NilStep
        : new ConsStep(
            src.head,
            Eval.later(() => go(tail)),
          );
    };
    return new _LazyList(
      this.source.map(src => (src === NilStep ? NilStep : go(src))),
    );
  }

  public get size(): number {
    return this.foldLeft(0, (x, _) => x + 1);
  }

  public get uncons(): Option<[A, LazyList<A>]> {
    const source = this.forceSource;
    return source === NilStep
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
    let cur_: Eval<Step<A>> = this.source;
    return Iter.lift(() => {
      const tmp = cur_.value;
      return tmp === NilStep
        ? Iter.Result.done
        : ((cur_ = tmp.tail), Iter.Result.pure(tmp.head));
    });
  }

  public get reverse(): LazyList<A> {
    return new _LazyList(
      this.source.map(cur => {
        let acc: Step<A> = NilStep;
        while (cur !== NilStep) {
          acc = new ConsStep(cur.head, Eval.now(acc));
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
    return new _LazyList(Eval.now(new ConsStep(x, this.source)));
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
        l === NilStep
          ? EvalNil
          : that.source.flatMap(r =>
              r === NilStep
                ? EvalNil
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
      source === NilStep
        ? Eval.now(LazyList.empty)
        : that.map(that => this.map2(that, f)),
    );
  }

  public flatMap<B>(f: (a: A) => LazyList<B>): LazyList<B> {
    return new _LazyList(
      this.foldRight(EvalNil as Eval<Step<B>>, (x, exs) =>
        f(x).source.flatMap(src => src.concat(exs)),
      ),
    );
  }

  public zip<B>(that: LazyList<B>): LazyList<[A, B]> {
    return this.zipWith(that, tupled);
  }
  public zipWith<B, C>(that: LazyList<B>, f: (a: A, b: B) => C): LazyList<C> {
    return new _LazyList(
      this.source.flatMap(l =>
        l === NilStep ? EvalNil : that.source.map(r => l.zipWith(r, f)),
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
    while (cur !== NilStep) {
      z = f(z, cur.head);
      cur = cur.forceTail;
    }
    return z;
  }

  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    const go = (xs: Step<A>): Eval<B> =>
      xs === NilStep ? ez : f(xs.head, xs.tail.flatMap(go));
    return this.source.flatMap(go);
  }

  public scanLeft<B>(z: B, f: (b: B, a: A) => B): LazyList<B> {
    return new _LazyList(
      Eval.now(
        new ConsStep(
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
      : isConstTC(G)
      ? f => this.traverse_(G, f as any) as any
      : G.TraverseStrategy(Rhs => this.traverseImpl(G, Rhs));
  }

  public traverse_<G>(
    G: Applicative<G>,
    f: (a: A) => Kind<G, [unknown]>,
  ): Kind<G, [void]> {
    const discard = (): void => {};

    return this.foldRight(Eval.now(G.unit), (x, eb) =>
      G.map2Eval_(f(x), eb, discard),
    ).value;
  }

  private traverseImpl<G, Rhs>(
    G: Applicative<G>,
    Rhs: TraverseStrategy<G, Rhs>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [LazyList<B>]> {
    return <B>(f: (a: A) => Kind<G, [B]>): Kind<G, [LazyList<B>]> => {
      const go = (xs: Step<A>): Kind<Rhs, [LazyList<B>]> =>
        xs === NilStep
          ? Rhs.toRhs(() => G.pure(LazyList.empty))
          : Rhs.map2(
              Rhs.toRhs(() => f(xs.head)),
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
      : G.TraverseStrategy(Rhs => this.traverseFilterImpl(G, Rhs));
  }

  private traverseFilterImpl<G, Rhs>(
    G: Applicative<G>,
    Rhs: TraverseStrategy<G, Rhs>,
  ): <B>(f: (a: A) => Kind<G, [Option<B>]>) => Kind<G, [LazyList<B>]> {
    return <B>(f: (a: A) => Kind<G, [Option<B>]>): Kind<G, [LazyList<B>]> => {
      const go = (xs: Step<A>): Kind<Rhs, [LazyList<B>]> =>
        xs === NilStep
          ? Rhs.toRhs(() => G.pure(LazyList.empty))
          : Rhs.map2(
              Rhs.toRhs(() => f(xs.head)),
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
    while (xs !== NilStep && ys !== NilStep) {
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

LazyList.singleton = <A>(x: A): LazyList<A> =>
  new _LazyList(Eval.now(new ConsStep(x, EvalNil)));

LazyList.defer = <A>(thunk: () => LazyList<A>): LazyList<A> =>
  _LazyList.defer(thunk);

LazyList.consEval = <A>(x: A, exs: Eval<LazyList<A>>): LazyList<A> =>
  _LazyList.consEval(x, exs);

LazyList.unfoldRight = <A, B>(
  z: B,
  f: (b: B) => Option<[A, B]>,
): LazyList<A> => {
  const go = (b: B): Step<A> =>
    f(b).fold(
      () => NilStep,
      ([a, b]) =>
        new ConsStep(
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
  const go = (n: number): Step<number> =>
    n >= to
      ? NilStep
      : new ConsStep(
          n,
          Eval.later(() => go(n + step)),
        );
  return new _LazyList(Eval.later(() => go(from)));
};

LazyList.iterate = <A>(s: A, f: (a: A) => A): LazyList<A> => {
  const go = (a: A): Step<A> =>
    new ConsStep(
      a,
      Eval.later(() => go(f(a))),
    );
  return new _LazyList(Eval.later(() => go(s)));
};

LazyList.consStep = <A>(head: A, tail: Eval<Step<A>>): Step<A> =>
  new ConsStep(head, tail);
LazyList.fromStep = _LazyList.fromStep;
LazyList.fromStepEval = _LazyList.fromStepEval;

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
    xs.foldRight(EvalNil as Eval<Step<A>>, (x, xs) =>
      Eval.now(new ConsStep(x, xs)),
    ),
  );

LazyList.fromIterator = <A>(it: Iterator<A>): LazyList<A> => {
  const go = (next: IteratorResult<A>): Step<A> =>
    next.done
      ? NilStep
      : new ConsStep(
          next.value,
          Eval.later(() => go(it.next())),
        );
  return new _LazyList(Eval.later(() => go(it.next())));
};

LazyList.fromFoldable =
  <F>(F: Foldable<F>) =>
  <A>(fa: Kind<F, [A]>): LazyList<A> =>
    new _LazyList(
      F.foldRight_(fa, EvalNil as Eval<Step<A>>, (h, tl) =>
        Eval.now(new ConsStep(h, tl)),
      ),
    );

export type LazyListStep<A> = Step<A>;
abstract class Step<out A> {
  abstract readonly head: A;
  abstract readonly tail: Eval<Step<A>>;
  abstract readonly forceTail: Step<A>;

  abstract take(n: number): Step<A>;
  abstract takeWhile(p: (a: A) => boolean): Step<A>;
  abstract drop(n: number): Step<A>;
  abstract dropWhile(p: (a: A) => boolean): Step<A>;
  abstract filter<B extends A>(f: (a: A) => a is B): Step<B>;
  abstract filter(f: (a: A) => boolean): Step<A>;
  abstract collect<B>(f: (a: A) => Option<B>): Step<B>;
  abstract concat<B>(this: Step<B>, that: Eval<Step<B>>): Eval<Step<B>>;

  abstract map<B>(f: (a: A) => B): Step<B>;
  abstract flatMap<B>(f: (a: A) => Eval<Step<B>>): Eval<Step<B>>;
  abstract foldRight<B>(
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): Eval<B>;

  abstract scanLeft<B>(z: B, f: (b: B, a: A) => B): Step<B>;
  abstract scanRight<B>(
    ez: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ): Eval<ConsStep<B>>;

  abstract zipWith<B, C>(that: Step<B>, f: (a: A, b: B) => C): Step<C>;

  abstract zipAllWith<A, B, C>(
    this: Step<A>,
    that: Step<B>,
    defaultA: () => A,
    defaultB: () => B,
    f: (a: A, b: B) => C,
  ): Step<C>;

  abstract distinctBy(cmp: (x: A, y: A) => boolean): Step<A>;
}

const NilStep: Step<never> = new (class Nil extends Step<never> {
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

  concat<B>(that: Eval<Step<B>>) {
    return that;
  }

  flatMap<B>(f: (a: never) => Eval<Step<B>>): Eval<Step<B>> {
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
  ): Eval<ConsStep<B>> {
    return ez.map(h => new ConsStep(h, Eval.now(this)));
  }

  zipWith<B, C>(that: Step<B>, f: (a: never, b: B) => C): Step<C> {
    throw new Error('Nil.zipWith');
  }

  zipAllWith<A, B, C>(
    this: Step<A>,
    that: Step<B>,
    defaultA: () => A,
    defaultB: () => B,
    f: (a: A, b: B) => C,
  ): Step<C> {
    return that.map(b => f(defaultA(), b));
  }

  distinctBy() {
    return this;
  }
})();

class ConsStep<out A> extends Step<A> {
  public constructor(public readonly head: A, private _tail: Eval<Step<A>>) {
    super();
  }
  private _forcedTail?: Step<A>;

  public get tail(): Eval<Step<A>> {
    return this._forcedTail
      ? Eval.now(this._forcedTail)
      : (this._tail = this._tail.memoize);
  }

  public get forceTail(): Step<A> {
    if (this._forcedTail) return this._forcedTail;

    const source = this._tail.value;
    this._forcedTail = source;
    (this._tail as any) = null; // Deference tail to allow for GC
    return source;
  }

  public take(n: number): Step<A> {
    return n <= 1
      ? new ConsStep(this.head, EvalNil)
      : new ConsStep(
          this.head,
          this.tail.map(tail => tail.take(n - 1)),
        );
  }

  public takeWhile(p: (a: A) => boolean): Step<A> {
    return p(this.head)
      ? new ConsStep(
          this.head,
          this.tail.map(tail => tail.takeWhile(p)),
        )
      : NilStep;
  }

  public drop(n: number): Step<A> {
    let cur = this as Step<A>;
    while (cur != NilStep && n > 0) {
      cur = cur.forceTail;
      n -= 1;
    }
    return cur;
  }

  public dropWhile(p: (a: A) => boolean): Step<A> {
    let cur = this as Step<A>;
    while (cur !== NilStep && p(cur.head)) {
      cur = cur.forceTail;
    }
    return cur;
  }

  public filter<B extends A>(f: (a: A) => a is B): Step<B>;
  public filter(f: (a: A) => boolean): Step<A>;
  public filter(f: (a: A) => boolean): Step<A> {
    if (f(this.head))
      return new ConsStep(
        this.head,
        this.tail.map(tail => tail.filter(f)),
      );

    for (let cur = this.forceTail; cur !== NilStep; cur = cur.forceTail)
      if (f(cur.head))
        return new ConsStep(
          cur.head,
          cur.tail.map(tail => tail.filter(f)),
        );
    return NilStep;
  }

  public collect<B>(f: (a: A) => Option<B>): Step<B> {
    const x = f(this.head);
    if (x.nonEmpty)
      return new ConsStep(
        x.get,
        this.tail.map(tail => tail.collect(f)),
      );

    for (let cur = this.forceTail; cur !== NilStep; cur = cur.forceTail) {
      const x = f(cur.head);
      if (x.nonEmpty)
        return new ConsStep(
          x.get,
          cur.tail.map(tail => tail.collect(f)),
        );
    }
    return NilStep;
  }

  public map<B>(f: (a: A) => B): Step<B> {
    return new ConsStep(
      f(this.head),
      this.tail.map(tail => tail.map(f)),
    );
  }

  public concat<B>(this: ConsStep<B>, that: Eval<Step<B>>): Eval<Step<B>> {
    return Eval.now(
      new ConsStep(
        this.head,
        this.tail.flatMap(tail => tail.concat(that)),
      ),
    );
  }

  public flatMap<B>(f: (a: A) => Eval<Step<B>>): Eval<Step<B>> {
    return f(this.head).flatMap(hds =>
      hds.concat(this.tail.flatMap(tail => tail.flatMap(f))),
    );
  }

  public zipWith<B, C>(that: Step<B>, f: (a: A, b: B) => C): Step<C> {
    return that === NilStep
      ? NilStep
      : new ConsStep(
          f(this.head, that.head),
          this.tail.map(tail =>
            tail === NilStep
              ? NilStep // do not force rhs unless there is something to zip it with
              : tail.zipWith(that.forceTail, f),
          ),
        );
  }

  public zipAllWith<A, B, C>(
    this: Step<A>,
    that: Step<B>,
    defaultA: () => A,
    defaultB: () => B,
    f: (a: A, b: B) => C,
  ): Step<C> {
    return that === NilStep
      ? this.map(a => f(a, defaultB()))
      : new ConsStep(
          f(this.head, that.head),
          this.tail.map(l =>
            l.zipAllWith(that.forceTail, defaultA, defaultB, f),
          ),
        );
  }

  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    const go = (xs: Step<A>): Eval<B> =>
      xs === NilStep
        ? ez
        : f(
            xs.head,
            Eval.defer(() => go(xs.forceTail)),
          );
    return go(this);
  }

  public scanLeft<B>(z: B, f: (b: B, a: A) => B): Step<B> {
    const q = f(z, this.head);
    return new ConsStep(
      q,
      this.tail.map(tail => tail.scanLeft(q, f)),
    );
  }

  public scanRight<B>(
    ez: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ): Eval<ConsStep<B>> {
    const eqs = this.tail.flatMap(tail => tail.scanRight(ez, f)).memoize;
    return f(
      this.head,
      eqs.map(qs => qs.head),
    ).map(hd => new ConsStep(hd, eqs));
  }

  public distinctBy(cmp: (x: A, y: A) => boolean): Step<A> {
    const loop = (ys: Step<A>, dubs: A[]): Step<A> => {
      while (ys !== NilStep && dubs.findIndex(z => cmp(ys.head, z)) >= 0) {
        ys = ys.forceTail;
      }
      return ys === NilStep
        ? NilStep
        : new ConsStep(
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

const EvalNil = Eval.now(NilStep);
LazyList.NilStep = NilStep;
LazyList.empty = new _LazyList(EvalNil);

// -- HKT

export interface _LazyList<A> extends HKT<LazyListF, [A]> {}

/**
 * @category Type Constructor
 * @category Collection
 */
export interface LazyListF extends TyK<[unknown]> {
  [$type]: LazyList<TyVar<this, 0>>;
}
