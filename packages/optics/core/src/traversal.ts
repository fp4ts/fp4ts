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

export class PTraversal<S, T, A, B> {
  public static fromTraversable<F>(
    F: Traversable<F>,
  ): <A>() => Traversal<Kind<F, [A]>, A> {
    return <A>() => new Traversal<Kind<F, [A]>, A>(F.traverse);
  }

  public constructor(
    public readonly modifyA: <F>(
      F: Applicative<F>,
    ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>,
  ) {}

  public parModifyF<F, G>(
    F: Parallel<F, G>,
  ): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return f => s =>
      F.sequential(this.modifyA(F.applicative)(a => F.parallel(f(a)))(s));
  }

  public andThen<C, D>(that: PTraversal<A, B, C, D>): PTraversal<S, T, C, D> {
    return new PTraversal(
      <F>(F: Applicative<F>) =>
        (f: (a: C) => Kind<F, [D]>): ((s: S) => Kind<F, [T]>) =>
          this.modifyA(F)(that.modifyA(F)(f)),
    );
  }

  // -- Conversions

  public asFold(): Fold<S, A> {
    return new Fold(
      <M>(M: Monoid<M>) =>
        (f: (a: A) => M) =>
          this.modifyA(Const.Applicative(M))(f),
    );
  }

  public asSetter(): PSetter<S, T, A, B> {
    return new PSetter(this.modifyA(Identity.Applicative));
  }

  // -- Additional Syntax

  public filter<B extends A>(
    this: Traversal<S, A>,
    f: (a: A) => a is B,
  ): Traversal<S, B>;
  public filter(this: Traversal<S, A>, f: (a: A) => boolean): Traversal<S, A>;
  public filter(this: Traversal<S, A>, f: (a: A) => boolean): Traversal<S, A> {
    return this.andThen(Optional.filter(f).asTraversal());
  }

  public at<I, A1>(
    this: Traversal<S, A>,
    i: I,
    at: At<A, I, A1>,
  ): Traversal<S, A1> {
    return this.andThen(at.at(i).asTraversal());
  }
}

export class Traversal<S, A> extends PTraversal<S, S, A, A> {}
