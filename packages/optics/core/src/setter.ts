// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose } from '@fp4ts/core';

export class PSetter<S, T, A, B> {
  public constructor(public readonly modify: (f: (a: A) => B) => (s: S) => T) {}

  public replace(b: B): (s: S) => T {
    return this.modify(() => b);
  }

  public andThen<C, D>(that: PSetter<A, B, C, D>): PSetter<S, T, C, D> {
    return new PSetter(compose(this.modify, that.modify));
  }
}

export type Setter<S, A> = PSetter<S, S, A, A>;
