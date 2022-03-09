// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative, Either, Option } from '@fp4ts/cats';
import { compose, Kind } from '@fp4ts/core';
import { Fold } from './fold';

import { Getter } from './getter';
import { POptional } from './optional';
import { PSetter } from './setter';
import { PTraversal } from './traversal';

export class PPrism<S, T, A, B> {
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

  public andThen<C, D>(that: PPrism<A, B, C, D>): PPrism<S, T, C, D> {
    return new PPrism(
      s =>
        this.getOrModify(s).flatMap(a =>
          that.getOrModify(a).leftMap(x => this.replace(x)(s)),
        ),
      compose(this.reverseGet, that.reverseGet),
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

  public asOptional(): POptional<S, T, A, B> {
    return new POptional(this.getOrModify, b => () => this.reverseGet(b));
  }
}

export type Prism<S, A> = PPrism<S, S, A, A>;
