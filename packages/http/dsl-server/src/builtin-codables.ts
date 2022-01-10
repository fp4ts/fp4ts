import { Left, Right } from '@fp4ts/cats';
import { ParsingFailure } from '@fp4ts/http-core';
import { booleanType, numberType, stringType } from '@fp4ts/http-dsl-shared';
import { Codable } from './codable';

export const builtins = {
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
    encode: x => global.JSON.stringify(x),
  } as Codable<boolean>,
  [numberType.ref]: {
    decode: x => {
      const n = parseFloat(x);
      return Number.isNaN(n) || Number.isFinite(n)
        ? Left(new ParsingFailure(`Expected number, found ${x}`))
        : Right(n);
    },
    encode: x => global.JSON.stringify(x),
  } as Codable<number>,
  [stringType.ref]: {
    decode: x => Right(x),
    encode: x => x,
  } as Codable<string>,
};
export type builtins = typeof builtins;
