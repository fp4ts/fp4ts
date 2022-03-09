// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '@fp4ts/cats';
import { compose } from '@fp4ts/core';
import { Fold } from './fold';

export class Getter<S, A> {
  public constructor(public readonly get: (s: S) => A) {}

  public choice<S1>(that: Getter<S1, A>): Getter<Either<S, S1>, A> {
    return new Getter(ea => ea.fold(this.get, that.get));
  }

  public split<S1, A1>(that: Getter<S1, A1>): Getter<[S, S1], [A, A1]> {
    return new Getter(([s, s1]) => [this.get(s), that.get(s1)]);
  }

  public zip<A1>(that: Getter<S, A1>): Getter<S, [A, A1]> {
    return new Getter(s => [this.get(s), that.get(s)]);
  }

  public andThen<B>(that: Getter<A, B>): Getter<S, B> {
    return new Getter(s => that.get(this.get(s)));
  }

  // -- Conversion functions

  public asFold(): Fold<S, A> {
    return new Fold(_M => f => compose(f, this.get));
  }
}
