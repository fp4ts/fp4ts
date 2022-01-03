// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { None, Option } from '@fp4ts/cats';

export class DecodeFailure extends Error {
  public constructor(public readonly cause: Option<string> = None) {
    super(`${cause}`);
  }

  public mapCause(f: (s: string) => string): DecodeFailure {
    return new DecodeFailure(this.cause.map(f));
  }
}
