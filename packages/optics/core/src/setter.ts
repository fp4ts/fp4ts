// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, Kind } from '@fp4ts/core';
import { Contravariant, Functor, Profunctor } from '@fp4ts/cats';
import { At } from './function';
import { Optional } from './optional';

export class PSetter<S, T, A, B> {
  public static readonly fromFunctor =
    <A, B>() =>
    <F>(F: Functor<F>): PSetter<Kind<F, [A]>, Kind<F, [B]>, A, B> =>
      new PSetter(F.map);

  public static readonly fromContravariant =
    <A, B>() =>
    <F>(F: Contravariant<F>): PSetter<Kind<F, [B]>, Kind<F, [A]>, B, A> =>
      new PSetter(F.contramap);

  public static readonly fromProfunctor =
    <A, B, C>() =>
    <F>(F: Profunctor<F>): PSetter<Kind<F, [A, C]>, Kind<F, [B, C]>, A, B> =>
      new PSetter(F.lmap);

  public constructor(public readonly modify: (f: (a: A) => B) => (s: S) => T) {}

  public replace(b: B): (s: S) => T {
    return this.modify(() => b);
  }

  // -- Composition

  public andThen<C, D>(that: PSetter<A, B, C, D>): PSetter<S, T, C, D> {
    return new PSetter(compose(this.modify, f => that.modify(f)));
  }

  // -- Additional Syntax

  public filter<B extends A>(
    this: Setter<S, A>,
    f: (a: A) => a is B,
  ): Setter<S, B>;
  public filter(this: Setter<S, A>, f: (a: A) => boolean): Setter<S, A>;
  public filter(this: Setter<S, A>, f: (a: A) => boolean): Setter<S, A> {
    return this.andThen(Optional.filter(f));
  }

  public at<I, A1>(this: Setter<S, A>, i: I, at: At<A, I, A1>): Setter<S, A1> {
    return this.andThen(at.at(i));
  }
}

export class Setter<S, A> extends PSetter<S, S, A, A> {}
