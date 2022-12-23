// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind } from '@fp4ts/core';

export class Cofree<S, A> {
  private readonly __void!: void;

  public constructor(
    public readonly head: A,
    public readonly tail: Eval<Kind<S, [Cofree<S, A>]>>,
  ) {}
}
