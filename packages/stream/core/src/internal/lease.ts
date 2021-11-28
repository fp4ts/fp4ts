// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Either } from '@fp4ts/cats';

export class Lease<F> {
  public constructor(public readonly cancel: Kind<F, [Either<Error, void>]>) {}
}
