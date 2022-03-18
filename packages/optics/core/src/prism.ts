// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, Kind } from '@fp4ts/core';
import { Applicative, Either, Left, Option, Right } from '@fp4ts/cats';

import { Fold } from './fold';
import { Getter } from './getter';
import { POptional } from './optional';
import { PSetter } from './setter';
import { PTraversal } from './traversal';
import { isPrism } from './internal/lens-hierarchy';

export class PPrism<S, T, A, B> {
  public static filter<A, B extends A>(f: (a: A) => a is B): Prism<A, B>;
  public static filter<A>(f: (a: A) => boolean): Prism<A, A>;
  public static filter<A>(f: (a: A) => boolean): Prism<A, A> {
    return new PPrism(
      value => (f(value) ? Right(value) : Left(value)),
      value => value,
    );
  }

  public constructor(
    public readonly getOrModify: (s: S) => Either<T, A>,
    public readonly reverseGet: (b: B) => T,
  ) {}

  public getOption(s: S): Option<A> {
    return this.getOrModify(s).toOption;
  }

  public modifyA<F>(
    F: Applicative<F>,
  ): (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
    return f => s =>
      this.getOrModify(s).fold(
        t => F.pure(t),
        a => F.map_(f(a), this.reverseGet),
      );
  }

  public modify(f: (a: A) => B): (s: S) => T {
    return s =>
      this.getOrModify(s).fold(
        x => x,
        a => this.reverseGet(f(a)),
      );
  }

  public replace(b: B): (s: S) => T {
    return this.modify(() => b);
  }

  public re(): Getter<B, T> {
    return new Getter(this.reverseGet);
  }

  // -- Composition

  public andThen<C, D>(that: PPrism<A, B, C, D>): PPrism<S, T, C, D>;
  public andThen<C, D>(that: POptional<A, B, C, D>): POptional<S, T, C, D>;
  public andThen<C, D>(that: PTraversal<A, B, C, D>): PTraversal<S, T, C, D>;
  public andThen<C, D>(that: PSetter<A, B, C, D>): PSetter<S, T, C, D>;
  public andThen<C, D>(that: Fold<A, C>): Fold<S, C>;
  public andThen<C, D>(
    that: Fold<A, C> | PSetter<A, B, C, D>,
  ): Fold<S, C> | PSetter<S, T, C, D> {
    return isPrism(that)
      ? new PPrism(
          s =>
            this.getOrModify(s).flatMap(a =>
              that.getOrModify(a).leftMap(x => this.replace(x)(s)),
            ),
          compose(this.reverseGet, that.reverseGet),
        )
      : this.asOptional().andThen(that as any);
  }

  // -- Conversions

  public asFold(): Fold<S, A> {
    return this.asTraversal().asFold();
  }

  public asSetter(): PSetter<S, T, A, B> {
    return new PSetter(this.modify.bind(this));
  }

  public asTraversal(): PTraversal<S, T, A, B> {
    return new PTraversal(this.modifyA.bind(this));
  }

  public asOptional(): POptional<S, T, A, B> {
    return new POptional(this.getOrModify, this.replace.bind(this));
  }

  // -- Additional Syntax

  public filter<B extends A>(
    this: Prism<S, A>,
    f: (a: A) => a is B,
  ): Prism<S, B>;
  public filter(this: Prism<S, A>, f: (a: A) => boolean): Prism<S, A>;
  public filter(this: Prism<S, A>, f: (a: A) => boolean): Prism<S, A> {
    return this.andThen(Prism.filter(f));
  }
}

export interface PPrism<S, T, A, B> extends POptional<S, T, A, B> {}
export class Prism<S, A> extends PPrism<S, S, A, A> {}
