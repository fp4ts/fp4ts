// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose } from '@fp4ts/core';
import { At } from './function';
import { Optional } from './optional';

export class PSetter<S, T, A, B> {
  public constructor(public readonly modify: (f: (a: A) => B) => (s: S) => T) {}

  public replace(b: B): (s: S) => T {
    return this.modify(() => b);
  }

  // -- Composition

  public andThen<C, D>(that: PSetter<A, B, C, D>): PSetter<S, T, C, D> {
    return new PSetter(compose(this.modify, that.modify));
  }

  // -- Additional Syntax

  public filter<B extends A>(
    this: Setter<S, A>,
    f: (a: A) => a is B,
  ): Setter<S, B>;
  public filter(this: Setter<S, A>, f: (a: A) => boolean): Setter<S, A>;
  public filter(this: Setter<S, A>, f: (a: A) => boolean): Setter<S, A> {
    return this.andThen(Optional.filter(f).asSetter());
  }

  public at<I, A1>(this: Setter<S, A>, i: I, at: At<A, I, A1>): Setter<S, A1> {
    return this.andThen(at.at(i).asSetter());
  }
}

export class Setter<S, A> extends PSetter<S, S, A, A> {}
