// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, Kind } from '@fp4ts/core';
import { Applicative, Functor, Right } from '@fp4ts/cats';

import { PLens } from './lens';
import { PPrism } from './prism';

export class PIso<S, T, A, B> {
  public constructor(
    public readonly get: (s: S) => A,
    public readonly reverseGet: (b: B) => T,
  ) {}

  public reverse(): PIso<B, A, T, S> {
    return new PIso(this.reverseGet, this.get);
  }

  public mapping<F>(
    F: Functor<F>,
  ): PIso<Kind<F, [S]>, Kind<F, [T]>, Kind<F, [A]>, Kind<F, [B]>> {
    return new PIso(F.map(this.get), F.map(this.reverseGet));
  }

  public modifyF<F>(
    F: Functor<F>,
  ): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return f => s => F.map_(f(this.get(s)), this.reverseGet);
  }

  public modifyA<F>(
    F: Applicative<F>,
  ): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return this.modifyF(F);
  }

  public modify(f: (a: A) => B): (s: S) => T {
    return compose(this.reverseGet, f, this.get);
  }

  public replace(b: B): (s: S) => T {
    return () => this.reverseGet(b);
  }

  // -- Composition

  public andThen<C, D>(that: PIso<A, B, C, D>): PIso<S, T, C, D> {
    return new PIso(
      compose(that.get, this.get),
      compose(this.reverseGet, that.reverseGet),
    );
  }

  // -- Conversions

  public asLens(): PLens<S, T, A, B> {
    return new PLens(this.get, b => () => this.reverseGet(b));
  }

  public asPrism(): PPrism<S, T, A, B> {
    return new PPrism(compose(Right, this.get), this.reverseGet);
  }
}

export type Iso<S, A> = PIso<S, S, A, A>;
