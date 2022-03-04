// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Left, Right } from '@fp4ts/cats';
import { ParsingFailure } from '@fp4ts/http-core';
import { Codable } from '../codable';

export const boolean: Codable<boolean> = Object.freeze({
  decode: x => {
    switch (x) {
      case 'true':
        return Right(true);
      case 'false':
        return Right(false);
      default:
        return Left(new ParsingFailure(`Expected boolean, found '${x}'`));
    }
  },
  encode: x => `${x}`,
});

export const number: Codable<number> = Object.freeze({
  decode: x => {
    const n = parseFloat(x);
    return Number.isNaN(n) || !Number.isFinite(n)
      ? Left(new ParsingFailure(`Expected number, found ${x}`))
      : Right(n);
  },
  encode: x => `${x}`,
});

export const string: Codable<string> = Object.freeze({
  decode: x => Right(x),
  encode: x => x,
});
