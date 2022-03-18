// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Left, Right } from '@fp4ts/cats';
import { Codec, DecodeFailure } from '@fp4ts/schema';

export const boolean: Codec<string, string, boolean> = Codec(
  x => `${x}`,
  x => {
    switch (x) {
      case 'true':
        return Right(true);
      case 'false':
        return Right(false);
      default:
        return Left(new DecodeFailure(`Expected boolean, found '${x}'`));
    }
  },
);

export const number: Codec<string, string, number> = Codec(
  x => `${x}`,
  x => {
    const n = parseFloat(x);
    return Number.isNaN(n) || !Number.isFinite(n)
      ? Left(new DecodeFailure(`Expected number, found ${x}`))
      : Right(n);
  },
);

export const string: Codec<string, string, string> = Codec(
  x => x,
  x => Right(x),
);
