// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '@fp4ts/cats';

export class DecodeFailure extends Error {
  public readonly cause: Option<string>;

  public constructor(cause?: Option<string> | string) {
    super(
      `${typeof cause === 'string' ? cause : cause?.getOrElse(() => '') ?? ''}`,
    );
    this.cause =
      cause instanceof Option
        ? (cause as Option<string>)
        : Option(cause as string | undefined);
  }

  public mapCause(f: (s: string) => string): DecodeFailure {
    return new DecodeFailure(this.cause.map(f));
  }
}
