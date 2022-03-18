// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EitherT, Eval, Try } from '@fp4ts/cats';
import { DecodeFailure, Decoder } from '@fp4ts/schema-core';
import { Schema } from '@fp4ts/schema-kernel';
import { Json } from './json';

export type JsonDecoder = Decoder<string, Json>;

export const JsonDecoder: JsonDecoderObj = Decoder((input: string) =>
  EitherT(
    Eval.delay(() =>
      Try(() => JSON.parse(input)).toEither.leftMap(
        e => new DecodeFailure(e.message),
      ),
    ),
  ),
) as any;

JsonDecoder.fromDecoder = decoder => JsonDecoder.andThen(decoder);
JsonDecoder.fromSchema = sa => sa.interpret(Decoder.Schemable);

interface JsonDecoderObj extends JsonDecoder {
  fromDecoder<A>(decoder: Decoder<Json, A>): Decoder<string, A>;
  fromSchema<A>(sa: Schema<A>): Decoder<string, A>;
}
