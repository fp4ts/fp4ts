// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import {
  Applicative,
  Const,
  Identity,
  Monoid,
  Parallel,
  Traversable,
} from '@fp4ts/cats';

import { Fold } from './fold';
import { PSetter } from './setter';
import { Optional } from './optional';
import { At } from './function';
import { isSetter, isTraversal } from './internal/lens-hierarchy';

export class PTraversal<S, T, A, B> {
  public static fromTraversable<F>(
    F: Traversable<F>,
  ): <A>() => Traversal<Kind<F, [A]>, A> {
    return <A>() =>
      new PTraversal<Kind<F, [A]>, Kind<F, [A]>, A, A>(F.traverse);
  }

  public constructor(
    public readonly modifyA: <F>(
      F: Applicative<F>,
    ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>,
  ) {}

  public modify(f: (a: A) => B): (s: S) => T {
    return this.modifyA(Identity.Applicative)(f);
  }

  public foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => (s: S) => M {
    return (f: (a: A) => M) => this.modifyA(Const.Applicative(M))(f);
  }

  public parModifyF<F, G>(
    F: Parallel<F, G>,
  ): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return f => s =>
      F.sequential(this.modifyA(F.applicative)(a => F.parallel(f(a)))(s));
  }

  // -- Composition

  public andThen<C, D>(that: PTraversal<A, B, C, D>): PTraversal<S, T, C, D>;
  public andThen<C, D>(that: PSetter<A, B, C, D>): PSetter<S, T, C, D>;
  public andThen<C>(that: Fold<A, C>): Fold<S, C>;
  public andThen<C, D>(
    that: PSetter<A, B, C, D> | Fold<A, C>,
  ): PSetter<S, T, C, D> | Fold<S, C> {
    return isTraversal(that)
      ? new PTraversal(
          <F>(F: Applicative<F>) =>
            (f: (a: C) => Kind<F, [D]>): ((s: S) => Kind<F, [T]>) =>
              this.modifyA(F)(that.modifyA(F)(f)),
        )
      : isSetter(that)
      ? this.asSetter().andThen(that)
      : this.asFold().andThen(that);
  }

  // -- Conversions

  public asFold(): Fold<S, A> {
    return new Fold(this.foldMap.bind(this));
  }

  public asSetter(): PSetter<S, T, A, B> {
    return new PSetter(this.modify.bind(this));
  }

  // -- Additional Syntax

  public filter<B extends A>(
    this: Traversal<S, A>,
    f: (a: A) => a is B,
  ): Traversal<S, B>;
  public filter(this: Traversal<S, A>, f: (a: A) => boolean): Traversal<S, A>;
  public filter(this: Traversal<S, A>, f: (a: A) => boolean): Traversal<S, A> {
    return this.andThen(Optional.filter(f));
  }

  public at<I, A1>(
    this: Traversal<S, A>,
    i: I,
    at: At<A, I, A1>,
  ): Traversal<S, A1> {
    return this.andThen(at.at(i));
  }
}

export interface PTraversal<S, T, A, B>
  extends PSetter<S, T, A, B>,
    Fold<S, A> {}

export class Traversal<S, A> extends PTraversal<S, S, A, A> {}
