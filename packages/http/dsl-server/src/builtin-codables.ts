// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right, Try } from '@fp4ts/cats';
import { MessageFailure, ParsingFailure } from '@fp4ts/http-core';
import {
  booleanType,
  numberType,
  stringType,
  PlainText,
  JSON,
} from '@fp4ts/http-dsl-shared';
import { Codable } from './codable';

const fromJSON = <A>(x: string): Either<MessageFailure, A> =>
  Try(() => global.JSON.parse(x)).toEither.leftMap(
    e => new ParsingFailure(e.message),
  );
const toJSON = <A>(x: A): string => global.JSON.stringify(x);

export const builtins = Object.freeze({
  [PlainText.mime]: {
    [booleanType.ref]: {
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
    } as Codable<boolean>,
    [numberType.ref]: {
      decode: x => {
        const n = parseFloat(x);
        return Number.isNaN(n) || !Number.isFinite(n)
          ? Left(new ParsingFailure(`Expected number, found ${x}`))
          : Right(n);
      },
      encode: x => `${x}`,
    } as Codable<number>,
    [stringType.ref]: {
      decode: x => Right(x),
      encode: x => x,
    } as Codable<string>,
  },
  [JSON.mime]: {
    [booleanType.ref]: {
      decode: fromJSON,
      encode: toJSON,
    } as Codable<boolean>,
    [numberType.ref]: {
      decode: fromJSON,
      encode: toJSON,
    } as Codable<number>,
    [stringType.ref]: {
      decode: fromJSON,
      encode: toJSON,
    } as Codable<string>,
  },
});
export type builtins = typeof builtins;
