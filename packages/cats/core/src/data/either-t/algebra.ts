// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Either } from '../either';

export class EitherT<F, A, B> {
  private readonly __void!: void;

  public constructor(public readonly value: Kind<F, [Either<A, B>]>) {}
}
