// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, tupled } from '@fp4ts/core';
import { Eval } from '../../eval';
import { Option } from '../option';
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
 */
export type View<A> = _View<A>;
export const View: ViewObj = function <A>(...xs: A[]): View<A> {
  return View.fromArray(xs);
};

interface ViewObj {
  <A>(...xs: A[]): View<A>;
  fromArray<A>(xs: A[]): View<A>;
  fromList<A>(xs: List<A>): View<A>;
  fromVector<A>(xs: Vector<A>): View<A>;
  fromLazyList<A>(xs: LazyList<A>): View<A>;
  fromIterable<A>(it: Iterable<A>): View<A>;
  fromIteratorProvider<A>(it: () => Iterator<A>): View<A>;
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
    return new FlatMapView(this, f);
  }

  public zip<B>(that: View<B>): View<[A, B]> {
    return new ZipWithView(this, that, tupled);
  }
  public zipWith<B, C>(that: View<B>, f: (a: A, b: B) => C): View<C> {
    return new ZipWithView(this, that, f);
  }

  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    const it = this.iterator;
    for (let i = it.next(); !i.done; i = it.next()) {
      z = f(z, i.value);
    }
    return z;
  }

  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    const it = this.iterator;
    const go = (i: IteratorResult<A>): Eval<B> =>
      i.done
        ? ez
        : f(
            i.value,
            Eval.defer(() => go(it.next())),
          );
    return Eval.defer(() => go(it.next()));
  }

  public scanLeft<B>(z: B, f: (b: B, a: A) => B): View<B> {
    return new ScanLeftView(this, z, f);
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
  View.fromIteratorProvider(() => it[Symbol.iterator]());
View.fromIteratorProvider = <A>(it: () => Iterator<A>): View<A> =>
  new IteratorView(it);

const EmptyView = new (class EmptyView extends _View<never> {
  public readonly iterator: Iterator<never> = Iter.empty;

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

  public readonly iterator: Iterator<A> = Iter.pure(this.value);
}

class IteratorView<A> extends _View<A> {
  public constructor(public readonly it: () => Iterator<A>) {
    super();
  }
  public get iterator(): Iterator<A> {
    return this.it();
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
    return new FilterView(this.self, x => this.f(x) && f(x));
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

  public override collect<B>(f: (a: A) => Option<B>): View<B> {
    return new CollectView(this.self, e => this.f(e).flatMap(f));
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

  public override concat<B>(this: ConcatView<B>, that: View<B>): View<B> {
    return new ConcatView(this.lhs, new ConcatView(this.rhs, that));
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

  public override map<B>(f: (a: A) => B): View<B> {
    return new MapView(this.self, compose(f, this.f));
  }
}

class FlatMapView<E, A> extends _View<A> {
  public constructor(
    public readonly self: View<E>,
    public readonly f: (e: E) => Iterable<A>,
  ) {
    super();
  }

  public get iterator(): Iterator<A> {
    return Iter.flatMap_(this.self.iterator, x => this.f(x)[Symbol.iterator]());
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
