// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, Kind } from '@fp4ts/core';
import { Applicative, Either, Functor, Right } from '@fp4ts/cats';

import { Lens, PLens } from './lens';
import { PPrism, Prism } from './prism';
import { POptional } from './optional';
import { PTraversal } from './traversal';
import { PSetter } from './setter';
import { Getter } from './getter';
import { Fold } from './fold';
import { At } from './function';
import { isGetter, isIso, isLens } from './internal/lens-hierarchy';

export class PIso<S, T, A, B> {
  public static id<A>(): Iso<A, A> {
    return new PIso(
      x => x,
      x => x,
    );
  }

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

  public getOrModify(s: S): Either<T, A> {
    return Right(this.get(s));
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

  public to<C>(this: Iso<S, A>, f: (a: A) => C): Getter<S, C> {
    return this.andThen(new Getter(f));
  }

  // -- Composition

  public andThen<C, D>(that: PIso<A, B, C, D>): PIso<S, T, C, D>;
  public andThen<C, D>(that: PLens<A, B, C, D>): PLens<S, T, C, D>;
  public andThen<C, D>(that: PPrism<A, B, C, D>): PPrism<S, T, C, D>;
  public andThen<C, D>(that: POptional<A, B, C, D>): POptional<S, T, C, D>;
  public andThen<C, D>(that: PTraversal<A, B, C, D>): PTraversal<S, T, C, D>;
  public andThen<C, D>(that: PSetter<A, B, C, D>): PSetter<S, T, C, D>;
  public andThen<C>(that: Getter<A, C>): Getter<S, C>;
  public andThen<C>(that: Fold<A, C>): Fold<S, C>;
  public andThen<C, D>(
    that: Fold<A, C> | PSetter<A, B, C, D>,
  ): Fold<S, C> | PSetter<S, T, C, D> {
    return isIso(that)
      ? new PIso(
          compose(that.get, this.get),
          compose(this.reverseGet, that.reverseGet),
        )
      : isLens(that)
      ? this.asLens().andThen(that)
      : isGetter(that)
      ? this.asGetter().andThen(that)
      : this.asPrism().andThen(that as any);
  }

  // -- Conversions

  public asFold(): Fold<S, A> {
    return new Fold(this.foldMap.bind(this));
  }

  public asGetter(): Getter<S, A> {
    return new Getter(this.get);
  }

  public asTraversal(): PTraversal<S, T, A, B> {
    return new PTraversal(this.modifyA.bind(this));
  }

  public asOptional(): POptional<S, T, A, B> {
    return new POptional(this.getOrModify.bind(this), this.replace.bind(this));
  }

  public asLens(): PLens<S, T, A, B> {
    return new PLens(this.get, this.replace.bind(this));
  }

  public asPrism(): PPrism<S, T, A, B> {
    return new PPrism(this.getOrModify.bind(this), this.reverseGet);
  }
}

export interface PIso<S, T, A, B>
  extends PLens<S, T, A, B>,
    PPrism<S, T, A, B> {
  filter<B extends A>(this: Iso<S, A>, f: (a: A) => a is B): Prism<S, B>;
  filter(this: Iso<S, A>, f: (a: A) => boolean): Prism<S, A>;
  at<I, A1>(this: Iso<S, A>, i: I, at: At<A, I, A1>): Lens<S, A1>;
}

export class Iso<S, A> extends PIso<S, S, A, A> {}
