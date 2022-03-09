// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative, Const, Identity, Monoid, Parallel } from '@fp4ts/cats';

import { Fold } from './fold';
import { PSetter } from './setter';

export class PTraversal<S, T, A, B> {
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
}

export type Traversal<S, A> = PTraversal<S, S, A, A>;
