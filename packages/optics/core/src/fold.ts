// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Monoid, None, Option, Some } from '@fp4ts/cats';

import { Getter } from './getter';
import * as Monoids from './internal/monoids';

export class Fold<S, A> {
  public constructor(
    public readonly foldMap: <M>(
      M: Monoid<M>,
    ) => (f: (a: A) => M) => (s: S) => M,
  ) {}

  public fold(M: Monoid<A>): (s: S) => A {
    return this.foldMap(M)(x => x);
  }

  public getAll: (s: S) => List<A> = this.foldMap(List.MonoidK.algebra<A>())(
    List,
  );

  public find(p: (a: A) => boolean): (s: S) => Option<A> {
    return this.foldMap(Monoids.firstOption<A>())(x => (p(x) ? Some(x) : None));
  }

  public headOption: (s: S) => Option<A> = this.foldMap(
    Monoids.firstOption<A>(),
  )(Some);

  public lastOption: (s: S) => Option<A> = this.foldMap(
    Monoids.lastOption<A>(),
  )(Some);

  public any(p: (a: A) => boolean): (s: S) => boolean {
    return this.foldMap(Monoid.disjunction)(p);
  }
  public all(p: (a: A) => boolean): (s: S) => boolean {
    return this.foldMap(Monoid.conjunction)(p);
  }
  public count(p: (a: A) => boolean): (s: S) => number {
    return this.foldMap(Monoid.addition)(x => (p(x) ? 1 : 0));
  }

  public size: (s: S) => number = this.foldMap(Monoid.addition)(() => 1);

  public isEmpty: (s: S) => boolean = this.foldMap(Monoid.conjunction)(
    () => false,
  );

  public nonEmpty: (s: S) => boolean = this.foldMap(Monoid.conjunction)(
    () => false,
  );

  public to<C>(f: (a: A) => C): Fold<S, C> {
    return this.andThen(new Getter(f).asFold());
  }

  public andThen<B>(that: Fold<A, B>): Fold<S, B> {
    return new Fold(
      <M>(M: Monoid<M>) =>
        (f: (b: B) => M) =>
          this.foldMap(M)(that.foldMap(M)(f)),
    );
  }
}
