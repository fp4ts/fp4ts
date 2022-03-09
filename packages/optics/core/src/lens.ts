// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, Kind } from '@fp4ts/core';
import { Applicative, Either, Functor, Option, Right, Some } from '@fp4ts/cats';

import { PSetter } from './setter';
import { PTraversal } from './traversal';
import { POptional } from './optional';
import { Getter } from './getter';
import { Fold } from './fold';

export class PLens<S, T, A, B> {
  public constructor(
    public readonly get: (s: S) => A,
    public readonly set: (b: B) => (s: S) => T,
  ) {}

  public modifyF<F>(
    F: Functor<F>,
  ): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return f => s => F.map_(f(this.get(s)), b => this.set(b)(s));
  }
  public modifyA<F>(
    F: Applicative<F>,
  ): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return this.modifyF(F);
  }

  public modify(f: (a: A) => B): (s: S) => T {
    return s => this.set(f(this.get(s)))(s);
  }

  public getOrModify: (s: S) => Either<T, A> = compose(Right, this.get);

  public getOption: (s: S) => Option<A> = compose(Some, this.get);

  // -- Composition

  public andThen<C, D>(that: PLens<A, B, C, D>): PLens<S, T, C, D> {
    return new PLens(compose(that.get, this.get), d =>
      this.modify(that.set(d)),
    );
  }

  // -- Conversions

  public asFold(): Fold<S, A> {
    return this.asGetter().asFold();
  }

  public asGetter(): Getter<S, A> {
    return new Getter(this.get);
  }

  public asSetter(): PSetter<S, T, A, B> {
    return new PSetter(this.modify.bind(this));
  }

  public asTraversal(): PTraversal<S, T, A, B> {
    return new PTraversal(this.modifyA.bind(this));
  }

  public asOptional(): POptional<S, T, A, B> {
    return new POptional(this.getOrModify, this.set);
  }
}

export type Lens<S, A> = PLens<S, S, A, A>;
