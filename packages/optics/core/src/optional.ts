// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative, Either, Left, Option, Right } from '@fp4ts/cats';
import { PSetter } from './setter';
import { PTraversal } from './traversal';
import { Fold } from './fold';
import { At } from './function';

export class POptional<S, T, A, B> {
  public static filter<A, B extends A>(f: (a: A) => a is B): Optional<A, B>;
  public static filter<A>(f: (a: A) => boolean): Optional<A, A>;
  public static filter<A>(f: (a: A) => boolean): Optional<A, A> {
    return new POptional(
      value => (f(value) ? Left(value) : Right(value)),
      b => current => f(b) ? b : current,
    );
  }

  public constructor(
    public readonly getOrModify: (s: S) => Either<T, A>,
    public readonly replace: (b: B) => (s: S) => T,
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
        a => F.map_(f(a), b => this.replace(b)(s)),
      );
  }

  public modify(f: (a: A) => B): (s: S) => T {
    return s =>
      this.getOrModify(s).fold(
        t => t,
        a => this.replace(f(a))(s),
      );
  }

  public modifyOption(f: (a: A) => B): (s: S) => Option<T> {
    return s => this.getOption(s).map(a => this.replace(f(a))(s));
  }

  public replaceOption(b: B): (s: S) => Option<T> {
    return this.modifyOption(() => b);
  }

  public orElse(that: POptional<S, T, A, B>): POptional<S, T, A, B> {
    return new POptional(
      s => this.getOrModify(s).orElse(() => that.getOrModify(s)),
      b => s => this.replaceOption(b)(s).getOrElse(() => that.replace(b)(s)),
    );
  }

  public andThen<C, D>(that: POptional<A, B, C, D>): POptional<S, T, C, D> {
    return new POptional(
      s =>
        this.getOrModify(s).flatMap(a =>
          that.getOrModify(a).leftMap(x => this.replace(x)(s)),
        ),
      d => this.modify(that.replace(d)),
    );
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

  // -- Additional Syntax

  public filter<B extends A>(
    this: Optional<S, A>,
    f: (a: A) => a is B,
  ): Optional<S, B>;
  public filter(this: Optional<S, A>, f: (a: A) => boolean): Optional<S, A>;
  public filter(this: Optional<S, A>, f: (a: A) => boolean): Optional<S, A> {
    return this.andThen(Optional.filter(f));
  }

  public at<I, A1>(
    this: Optional<S, A>,
    i: I,
    at: At<A, I, A1>,
  ): Optional<S, A1> {
    return this.andThen(at.at(i).asOptional());
  }
}

export class Optional<S, A> extends POptional<S, S, A, A> {}
