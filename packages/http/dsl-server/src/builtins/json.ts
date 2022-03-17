// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Try } from '@fp4ts/cats';
import { DecodeFailure } from '@fp4ts/schema';
import { Codable } from '../codable';

const fromJSON = <A>(x: string): Either<DecodeFailure, A> =>
  Try(() => JSON.parse(x)).toEither.leftMap(e => new DecodeFailure(e.message));
const toJSON = <A>(x: A): string => JSON.stringify(x);

export const boolean: Codable<boolean> = Object.freeze({
  decode: fromJSON,
  encode: toJSON,
}) as Codable<boolean>;

export const number: Codable<number> = Object.freeze({
  decode: fromJSON,
  encode: toJSON,
}) as Codable<number>;

export const string: Codable<string> = Object.freeze({
  decode: fromJSON,
  encode: toJSON,
}) as Codable<string>;
