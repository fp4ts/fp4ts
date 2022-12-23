// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $type,
  compose,
  Eval,
  id,
  Kind,
  Lazy,
  lazyVal,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { Monoid, Ord } from '@fp4ts/cats-kernel';
import { Align } from '../../align';
import { Foldable } from '../../foldable';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { MonoidK } from '../../monoid-k';
import { Ior } from '../ior';
import { None, Option, Some } from '../option';
import { Iter } from './iterator';
import { LazyList } from './lazy-list';
import { List } from './list';
import { Vector } from './vector';

/**
 * Views are collections which operations are non-strict. This means that the
 * operations are not performed until the collection is effectively traversed
 * (using `foldLeft`/`foldRight`) or converted to a strict collection.
 *
 * This way one can effectively avoid creating intermediate copies when performing
 * chain of operations on the collection. For example, the following code should
 * not create any intermediate copies of the `List` except from the one, result:
 *
 * ```typescript
 * const xs: List<A> = ...;
 * const ys = xs.view
 *   .map(f)
 *   .filter(p)
 *   .map(h)
 *   .toList;
 * ```
 *
 * Furthermore, the `View` also "fuses" possible operations into one, making the
 * collection transformations even more efficient. The above example effectively
 * produces:
 *
 * ```typescript
 * const ys = List.fromIterator(
 *   Iter.collect_(xs.iterator, x => Some(f(x)).filter(p).map(h)),
 * );
 * ```
 */
export type View<A> = _View<A>;
export const View: ViewObj = function <A>(...xs: A[]): View<A> {
  return View.fromArray(xs);
} as any;

interface ViewObj {
  <A>(...xs: A[]): View<A>;
  fromArray<A>(xs: A[]): View<A>;
  fromList<A>(xs: List<A>): View<A>;
  fromVector<A>(xs: Vector<A>): View<A>;
  fromLazyList<A>(xs: LazyList<A>): View<A>;
  fromIterable<A>(it: Iterable<A>): View<A>;
  fromIteratorProvider<A>(it: () => Iterator<A>): View<A>;

  readonly empty: View<never>;
  singleton<A>(a: A): View<A>;
  range(from: number, to?: number): View<number>;
  unfoldRight<A, B>(z: B, f: (b: B) => Option<[A, B]>): View<A>;

  // -- Instances

  readonly Functor: Functor<ViewF>;
  readonly FunctorFilter: FunctorFilter<ViewF>;
  readonly Align: Align<ViewF>;
  readonly Foldable: Foldable<ViewF>;
  readonly MonoidK: MonoidK<ViewF>;
}

abstract class _View<out A> implements Iterable<A> {
  public abstract readonly iterator: Iterator<A>;

  public [Symbol.iterator](): Iterator<A> {
    return this.iterator;
  }

  public get toArray(): A[] {
    return [...this];
  }
  public get toList(): List<A> {
    return List.fromIterator(this.iterator);
  }
  public get toVector(): Vector<A> {
    return Vector.fromIterator(this.iterator);
  }
  public get toLazyList(): LazyList<A> {
    return LazyList.fromIterator(this.iterator);
  }

  public prepend<A>(this: View<A>, x: A): View<A> {
    return new SingletonView(x).concat(this);
  }
  public append<A>(this: View<A>, x: A): View<A> {
    return this.concat(new SingletonView(x));
  }

  public all<B extends A>(p: (a: A) => a is B): this is View<B>;
  public all(p: (a: A) => boolean): boolean;
  public all(p: (a: A) => boolean): boolean {
    return this.foldRight(Eval.true, (a, eb) => (p(a) ? eb : Eval.false)).value;
  }

  public any(p: (a: A) => boolean): boolean {
    return this.foldRight(Eval.false, (a, eb) => (p(a) ? Eval.true : eb)).value;
  }

  public count(f: (a: A) => boolean): number {
    return this.foldLeft(0, (x, a) => (f(a) ? x + 1 : x));
  }

  public take(n: number): View<A> {
    return n <= 0 ? EmptyView : new TakeView(this, n);
  }
  public drop(n: number): View<A> {
    return n <= 0 ? this : new DropView(this, n);
  }

  public filter<B extends A>(f: (a: A) => a is B): View<B>;
  public filter(f: (a: A) => boolean): View<A>;
  public filter(f: (a: A) => boolean): View<A> {
    return new FilterView(this, f);
  }

  public filterNot(f: (a: A) => boolean): View<A> {
    return this.filter(x => !f(x));
  }

  public collect<B>(f: (a: A) => Option<B>): View<B> {
    return new CollectView(this, f);
  }

  public concat<A>(this: View<A>, that: View<A>): View<A> {
    return that === EmptyView ? this : new ConcatView(this, that);
  }

  public map<B>(f: (a: A) => B): View<B> {
    return new MapView(this, f);
  }

  public flatMap<B>(f: (a: A) => Iterable<B>): View<B> {
    return new FlatMapView(this, x => View.fromIterable(f(x)));
  }

  public zip<B>(that: View<B>): View<[A, B]> {
    return new ZipView(this, that);
  }
  public zipWith<B, C>(that: View<B>, f: (a: A, b: B) => C): View<C> {
    return new ZipWithView(this, that, f);
  }

  public zipAll<A, B>(
    this: View<A>,
    that: View<B>,
    defaultL: () => A,
    defaultR: () => B,
  ): View<[A, B]> {
    return new ZipAllView(this, that, defaultL, defaultR);
  }
  public zipAllWith<A, B, C>(
    this: View<A>,
    that: View<B>,
    defaultL: () => A,
    defaultR: () => B,
    f: (a: A, b: B) => C,
  ): View<C> {
    return new ZipAllWithView(this, that, defaultL, defaultR, f);
  }

  public forEach(f: (a: A) => void): void {
    const it = this.iterator;
    for (let i = it.next(); !i.done; i = it.next()) {
      f(i.value);
    }
  }

  public foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M {
    return f =>
      this.foldRight(Eval.now(M.empty), (a, eb) => M.combineEval_(f(a), eb))
        .value;
  }

  public foldMapK<F>(
    F: MonoidK<F>,
  ): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]> {
    return <B>(f: (a: A) => Kind<F, [B]>) =>
      this.foldRight(Eval.now(F.emptyK<B>()), (a, eb) =>
        F.combineKEval_(f(a), eb),
      ).value;
  }

  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    return Iter.foldLeft_(this.iterator, z, f);
  }

  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    return Iter.foldRight_(this.iterator, ez, f);
  }

  public scanLeft<B>(z: B, f: (b: B, a: A) => B): View<B> {
    return new ScanLeftView(this, z, f);
  }

  public distinct(): View<A> {
    return new DistinctBy(this, id);
  }
  public distinctBy<B>(f: (a: A) => B): View<A> {
    return new DistinctBy(this, f);
  }

  public distinctOrd<A>(this: View<A>, O: Ord<A>): View<A> {
    return new DistinctByOrd(this, id, O);
  }
  public distinctByOrd<B>(f: (a: A) => B, O: Ord<B>): View<A> {
    return new DistinctByOrd(this, f, O);
  }

  public toString(): string {
    return 'View(..)';
  }
}

View.fromArray = <A>(xs: A[]): View<A> => {
  switch (xs.length) {
    case 0:
      return EmptyView;
    case 1:
      return new SingletonView(xs[0]);
    default:
      return View.fromIterable(xs);
  }
};
View.fromList = <A>(xs: List<A>): View<A> =>
  xs.isEmpty ? EmptyView : View.fromIterable(xs);
View.fromVector = <A>(xs: Vector<A>): View<A> =>
  xs.isEmpty ? EmptyView : View.fromIterable(xs);
View.fromLazyList = <A>(xs: LazyList<A>): View<A> => View.fromIterable(xs);
View.fromIterable = <A>(it: Iterable<A>): View<A> =>
  it instanceof _View
    ? it
    : View.fromIteratorProvider(() => it[Symbol.iterator]());
View.fromIteratorProvider = <A>(it: () => Iterator<A>): View<A> =>
  new IteratorView(it);

View.singleton = x => new SingletonView(x);
View.range = (from, to) =>
  View.fromIteratorProvider(() => Iter.range(from, to));
View.unfoldRight = <A, B>(z: B, f: (b: B) => Option<[A, B]>): View<A> =>
  new UnfoldRight(z, f);

const EmptyView = new (class EmptyView extends _View<never> {
  public readonly iterator: Iterator<never> = Iter.empty;

  public override take(n: number): View<never> {
    return this;
  }
  public override drop(n: number): View<never> {
    return this;
  }
  public override filter(f: (a: never) => boolean): View<never> {
    return this;
  }
  public override filterNot(f: (a: never) => boolean): View<never> {
    return this;
  }
  public override collect<B>(f: (a: never) => Option<B>): View<B> {
    return this;
  }
  public override concat<B>(that: View<B>): View<B> {
    return that;
  }
  public override map<B>(f: (a: never) => B): View<B> {
    return this;
  }
  public override flatMap<B>(f: (a: never) => View<B>): View<B> {
    return this;
  }
  public override zip<B>(that: View<B>): View<[never, B]> {
    return this;
  }
  public override zipWith<B, C>(
    that: View<B>,
    f: (a: never, b: B) => C,
  ): View<C> {
    return this;
  }
})();

class SingletonView<A> extends _View<A> {
  public constructor(public readonly value: A) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.pure(this.value);
  }
}

class IteratorView<A> extends _View<A> {
  public constructor(public readonly it: () => Iterator<A>) {
    super();
  }
  public get iterator(): Iterator<A> {
    return this.it();
  }
}

class UnfoldRight<A, B> extends _View<A> {
  public constructor(
    public readonly initial: B,
    public readonly build: (b: B) => Option<[A, B]>,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.unfoldRight(this.initial, this.build);
  }
}

class TakeView<A> extends _View<A> {
  public constructor(public readonly self: View<A>, public readonly n: number) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.take_(this.self.iterator, this.n);
  }

  public override take(n: number): View<A> {
    return n <= 0 ? EmptyView : n < this.n ? new TakeView(this.self, n) : this;
  }
}

class DropView<A> extends _View<A> {
  public constructor(public readonly self: View<A>, public readonly n: number) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.drop_(this.self.iterator, this.n);
  }

  public override drop(n: number): View<A> {
    return n <= 0 ? this : new DropView(this.self, n + this.n);
  }
}

class FilterView<A> extends _View<A> {
  public constructor(
    public readonly self: View<A>,
    public readonly f: (a: A) => boolean,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.filter_(this.self.iterator, this.f);
  }

  public override filter(f: (a: A) => boolean): View<A> {
    const g = this.f;
    return new FilterView(this.self, x => g(x) && f(x));
  }

  public override collect<B>(f: (a: A) => Option<B>): View<B> {
    const g = this.f;
    return this.self.collect(a => (g(a) ? f(a) : None));
  }

  public override map<B>(f: (a: A) => B): View<B> {
    const g = this.f;
    return this.self.collect(a => (g(a) ? Some(f(a)) : None));
  }
}

class CollectView<E, A> extends _View<A> {
  public constructor(
    public readonly self: View<E>,
    public readonly f: (a: E) => Option<A>,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.collect_(this.self.iterator, this.f);
  }

  public override filter<B extends A>(f: (a: A) => a is B): View<B>;
  public override filter(f: (a: A) => boolean): View<A>;
  public override filter(f: (a: A) => boolean): View<A> {
    const g = this.f;
    return new CollectView(this.self, e => g(e).filter(f));
  }

  public override collect<B>(f: (a: A) => Option<B>): View<B> {
    const g = this.f;
    return new CollectView(this.self, e => g(e).flatMap(f));
  }

  public override map<B>(f: (a: A) => B): View<B> {
    const g = this.f;
    return new CollectView(this.self, e => g(e).map(f));
  }
}

class ConcatView<A> extends _View<A> {
  public constructor(
    public readonly lhs: View<A>,
    public readonly rhs: View<A>,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.concat_(this.lhs.iterator, this.rhs.iterator);
  }

  public override filter<B extends A>(f: (a: A) => a is B): View<B>;
  public override filter(f: (a: A) => boolean): View<A>;
  public override filter(f: (a: A) => boolean): View<A> {
    return new ConcatView(this.lhs.filter(f), this.rhs.filter(f));
  }

  public override collect<B>(f: (a: A) => Option<B>): View<B> {
    return new ConcatView(this.lhs.collect(f), this.rhs.collect(f));
  }

  public override concat<B>(this: ConcatView<B>, that: View<B>): View<B> {
    return that === EmptyView
      ? this
      : new ConcatView(this.lhs, new ConcatView(this.rhs, that));
  }

  public override map<B>(f: (a: A) => B): View<B> {
    return new ConcatView(this.lhs.map(f), this.rhs.map(f));
  }

  public override flatMap<B>(f: (a: A) => Iterable<B>): View<B> {
    return new ConcatView(this.lhs.flatMap(f), this.rhs.flatMap(f));
  }
}

class MapView<E, A> extends _View<A> {
  public constructor(
    public readonly self: View<E>,
    public readonly f: (a: E) => A,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.map_(this.self.iterator, this.f);
  }

  public override filter<B extends A>(f: (a: A) => a is B): View<B>;
  public override filter(f: (a: A) => boolean): View<A>;
  public override filter(f: (a: A) => boolean): View<A> {
    const g = this.f;
    return this.self.collect(e => Some(g(e)).filter(f));
  }

  public override collect<B>(f: (a: A) => Option<B>): View<B> {
    return this.self.collect(compose(f, this.f));
  }

  public override map<B>(f: (a: A) => B): View<B> {
    return new MapView(this.self, compose(f, this.f));
  }

  public override flatMap<B>(f: (a: A) => Iterable<B>): View<B> {
    return this.self.flatMap(compose(f, this.f));
  }

  public override zip<B>(that: View<B>): View<[A, B]> {
    const g = this.f;
    return this.self.zipWith(that, (e, d) => [g(e), d]);
  }

  public override zipWith<B, C>(that: View<B>, f: (a: A, b: B) => C): View<C> {
    const g = this.f;
    return this.self.zipWith(that, (e, b) => f(g(e), b));
  }
}

class FlatMapView<E, A> extends _View<A> {
  public constructor(
    public readonly self: View<E>,
    public readonly f: (e: E) => View<A>,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    const g = this.f;
    return Iter.flatMap_(this.self.iterator, x => g(x).iterator);
  }
}

class ZipView<D, E> extends _View<[D, E]> {
  public constructor(
    public readonly lhs: View<D>,
    public readonly rhs: View<E>,
  ) {
    super();
  }

  public get iterator(): Iterator<[D, E]> {
    return Iter.zip_(this.lhs.iterator, this.rhs.iterator);
  }

  public override map<B>(f: (a: [D, E]) => B): View<B> {
    return new ZipWithView(this.lhs, this.rhs, (d, e) => f([d, e]));
  }
}

class ZipWithView<D, E, A> extends _View<A> {
  public constructor(
    public readonly lhs: View<D>,
    public readonly rhs: View<E>,
    public readonly f: (d: D, e: E) => A,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.zipWith_(this.lhs.iterator, this.rhs.iterator)(this.f);
  }

  public override map<B>(f: (a: A) => B): View<B> {
    const g = this.f;
    return new ZipWithView(this.lhs, this.rhs, (d, e) => f(g(d, e)));
  }
}

class ZipAllView<D, E> extends _View<[D, E]> {
  public constructor(
    public readonly lhs: View<D>,
    public readonly rhs: View<E>,
    public readonly defaultL: () => D,
    public readonly defaultR: () => E,
  ) {
    super();
  }

  public get iterator(): Iterator<[D, E]> {
    return Iter.zipAll_(
      this.lhs.iterator,
      this.rhs.iterator,
      this.defaultL,
      this.defaultR,
    );
  }

  public override map<B>(f: (a: [D, E]) => B): View<B> {
    return new ZipAllWithView(
      this.lhs,
      this.rhs,
      this.defaultL,
      this.defaultR,
      (d, e) => f([d, e]),
    );
  }
}

class ZipAllWithView<D, E, A> extends _View<A> {
  public constructor(
    public readonly lhs: View<D>,
    public readonly rhs: View<E>,
    public readonly defaultL: () => D,
    public readonly defaultR: () => E,
    public readonly f: (d: D, e: E) => A,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.zipAllWith_(
      this.lhs.iterator,
      this.rhs.iterator,
      this.defaultL,
      this.defaultR,
    )(this.f);
  }

  public override map<B>(f: (a: A) => B): View<B> {
    const g = this.f;
    return new ZipAllWithView(
      this.lhs,
      this.rhs,
      this.defaultL,
      this.defaultR,
      (d, e) => f(g(d, e)),
    );
  }
}

class ScanLeftView<E, A> extends _View<A> {
  public constructor(
    public readonly self: View<E>,
    public readonly z: A,
    public readonly f: (a: A, e: E) => A,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.scan_(this.self.iterator, this.z, this.f);
  }
}

class DistinctBy<A, B> extends _View<A> {
  public constructor(
    public readonly self: View<A>,
    public readonly f: (a: A) => B,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.distinctBy_(this.self.iterator, this.f);
  }
}

class DistinctByOrd<A, B> extends _View<A> {
  public constructor(
    public readonly self: View<A>,
    public readonly f: (a: A) => B,
    public readonly O: Ord<B>,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.distinctByOrd_(this.self.iterator, this.f, this.O);
  }
}

Object.defineProperty(View, 'empty', {
  get() {
    return EmptyView;
  },
});

// -- Instances

const viewFunctor: Lazy<Functor<ViewF>> = lazyVal(() =>
  Functor.of({ map_: (fa, f) => fa.map(f) }),
);

const viewFunctorFilter: Lazy<FunctorFilter<ViewF>> = lazyVal(() =>
  FunctorFilter.of({
    ...viewFunctor(),
    mapFilter_: (fa, f) => fa.collect(f),
    filter_: <A>(fa: View<A>, f: (a: A) => boolean) => fa.filter(f),
    filterNot_: (fa, f) => fa.filterNot(f),
  }),
);

const viewAlign: Lazy<Align<ViewF>> = lazyVal(() =>
  Align.of({
    functor: viewFunctor(),
    align_: (fa, fb) =>
      fa.map(Some).zipAllWith(
        fb.map(Some),
        () => None,
        () => None,
        (a, b) => Ior.fromOptions(a, b).get,
      ),
    zipAll: (fa, fb, a, b) =>
      fa.zipAll(
        fb,
        () => a,
        () => b,
      ),
  }),
);

const viewFoldable: Lazy<Foldable<ViewF>> = lazyVal(() =>
  Foldable.of({
    foldMapK_:
      <F>(F: MonoidK<F>) =>
      <A, B>(fa: View<A>, f: (a: A) => Kind<F, [B]>) =>
        fa.foldMapK(F)(f),
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(fa: View<A>, f: (a: A) => M) =>
        fa.foldMap(M)(f),
    foldLeft_: (fa, z, f) => fa.foldLeft(z, f),
    foldRight_: (fa, ez, f) => fa.foldRight(ez, f),
    iterator: fa => fa.iterator,
    toList: fa => fa.toList,
    all_: (fa, f) => fa.all(f),
    any_: (fa, f) => fa.any(f),
    count_: (fa, f) => fa.count(f),
  }),
);

const viewMonoidK: Lazy<MonoidK<ViewF>> = lazyVal(() =>
  MonoidK.of({
    emptyK: () => View.empty,
    combineK_: (fa, fb) => fa.concat(fb),
  }),
);

Object.defineProperty(View, 'Functor', {
  get() {
    return viewFunctor();
  },
});
Object.defineProperty(View, 'FunctorFilter', {
  get() {
    return viewFunctorFilter();
  },
});
Object.defineProperty(View, 'Align', {
  get() {
    return viewAlign();
  },
});
Object.defineProperty(View, 'Foldable', {
  get() {
    return viewFoldable();
  },
});
Object.defineProperty(View, 'MonoidK', {
  get() {
    return viewMonoidK();
  },
});

// -- HKT

export interface ViewF extends TyK<[unknown]> {
  [$type]: View<TyVar<this, 0>>;
}
