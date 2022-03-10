// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Monoid } from '@fp4ts/cats';

import { Fold } from './fold';
import { Optional } from './optional';
import { At } from './function';
import { isGetter } from './internal/lens-hierarchy';

export class Getter<S, A> {
  public constructor(public readonly get: (s: S) => A) {}

  public foldMap<M>(_M: Monoid<M>): (f: (a: A) => M) => (s: S) => M {
    return f => s => f(this.get(s));
  }

  public choice<S1>(that: Getter<S1, A>): Getter<Either<S, S1>, A> {
    return new Getter(ea => ea.fold(this.get, that.get));
  }

  public split<S1, A1>(that: Getter<S1, A1>): Getter<[S, S1], [A, A1]> {
    return new Getter(([s, s1]) => [this.get(s), that.get(s1)]);
  }

  public zip<A1>(that: Getter<S, A1>): Getter<S, [A, A1]> {
    return new Getter(s => [this.get(s), that.get(s)]);
  }

  public to<C>(this: Getter<S, A>, f: (a: A) => C): Getter<S, C> {
    return this.andThen(new Getter(f));
  }

  // -- Composition

  public andThen<B>(that: Getter<A, B>): Getter<S, B>;
  public andThen<B>(that: Fold<A, B>): Fold<S, B>;
  public andThen<B>(that: Fold<A, B>): Fold<S, B> {
    return isGetter(that)
      ? new Getter(s => that.get(this.get(s)))
      : this.asFold().andThen(that);
  }

  // -- Conversion functions

  public asFold(): Fold<S, A> {
    return new Fold(this.foldMap.bind(this));
  }

  // -- Additional Syntax

  public filter<B extends A>(f: (a: A) => a is B): Fold<S, B>;
  public filter(f: (a: A) => boolean): Fold<S, A>;
  public filter(f: (a: A) => boolean): Fold<S, A> {
    return this.andThen(Optional.filter(f));
  }

  public at<I, A1>(this: Getter<S, A>, i: I, at: At<A, I, A1>): Getter<S, A1> {
    return this.andThen(at.at(i));
  }
}

export interface Getter<S, A> extends Fold<S, A> {}
