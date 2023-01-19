// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Pull } from '../pull';

export class Stream<out F, out A> {
  private readonly __void!: void;

  private readonly _F!: <X>() => Kind<F, [X]>;
  private readonly _A!: () => A;

  public constructor(public readonly pull: Pull<F, A, void>) {}
}
