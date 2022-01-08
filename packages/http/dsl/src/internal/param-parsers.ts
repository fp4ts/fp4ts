// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from '@fp4ts/cats';
import { MessageFailure, ParsingFailure } from '@fp4ts/http-core';

export type ParamParser<A> = (s: string) => Either<MessageFailure, A>;

export const ParamParser = Object.freeze({
  string: (s: string) => Either.right(s),
  number: (s: string): Either<MessageFailure, number> => {
    const n = parseFloat(s);
    return Number.isNaN(n) || !Number.isFinite(n)
      ? Left(
          new ParsingFailure(
            'Invalid parameter type',
            `Expected number found '${s}'`,
          ),
        )
      : Right(n);
  },
  boolean: (s: string): Either<MessageFailure, boolean> => {
    switch (s) {
      case 'true':
        return Right(true);
      case 'false':
        return Right(false);
      default:
        return Left(
          new ParsingFailure(
            'Invalid parameter type',
            `Expected boolean found '${s}'`,
          ),
        );
    }
  },
});
