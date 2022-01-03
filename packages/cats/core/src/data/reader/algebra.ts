// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IdentityK } from '../identity';
import { Kleisli } from '../kleisli';

export class Reader<R, A> {
  private readonly __void!: void;

  private readonly _R!: (_: R) => void;

  public constructor(public readonly _kleisli: Kleisli<IdentityK, R, A>) {}
}
