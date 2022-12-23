// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval } from '@fp4ts/core';
import { EitherT, Try } from '@fp4ts/cats';
import { DecodeFailure, Decoder } from '@fp4ts/schema-core';
import { Schema } from '@fp4ts/schema-kernel';
import { Json } from './json';

export type JsonDecoder<A> = Decoder<string, A>;

export const JsonDecoder: JsonDecoderObj = function () {};

JsonDecoder.fromDecoder = decoder => RawJsonDecoder.andThen(decoder);
JsonDecoder.fromSchema = sa => sa.interpret(Decoder.Schemable);

interface JsonDecoderObj {
  fromDecoder<A>(decoder: Decoder<unknown, A>): JsonDecoder<A>;
  fromSchema<A>(sa: Schema<A>): JsonDecoder<A>;
}

// -- Raw

export type RawJsonDecoder = JsonDecoder<Json>;

export const RawJsonDecoder: RawJsonDecoder = Decoder((input: string) =>
  EitherT(
    Eval.delay(() =>
      Try(() => JSON.parse(input)).toEither.leftMap(
        e => new DecodeFailure(e.message),
      ),
    ),
  ),
);
