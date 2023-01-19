// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Codec } from '@fp4ts/schema-core';
import { Schema } from '@fp4ts/schema-kernel';
import { Json } from './json';
import { RawJsonDecoder } from './json-decoder';
import { RawJsonEncoder } from './json-encoder';

export type JsonCodec<A> = Codec<string, string, A>;

export const JsonCodec: JsonCodecObj = function () {};

JsonCodec.fromCodec = <A>(codec: Codec<unknown, unknown, A>) =>
  RawJsonCodec.andThen(codec as Codec<Json, Json, A>);
JsonCodec.fromSchema = <A>(sa: Schema<A>) =>
  JsonCodec.fromCodec(sa.interpret(Codec.Schemable));

interface JsonCodecObj {
  fromCodec<A>(encoder: Codec<unknown, unknown, A>): JsonCodec<A>;
  fromSchema<A>(sa: Schema<A>): JsonCodec<A>;
}

// -- Raw

export type RawJsonCodec = JsonCodec<Json>;

export const RawJsonCodec: RawJsonCodec = Codec.make(
  RawJsonEncoder,
  RawJsonDecoder,
) as any;
