// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';

export class Kleisli<F, A, B> {
  private readonly __void!: void;

  public constructor(public readonly run: (a: A) => Kind<F, [B]>) {}
}
