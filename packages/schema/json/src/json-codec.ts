// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Codec } from '@fp4ts/schema-core';
import { Schema } from '@fp4ts/schema-kernel';
import { Json } from './json';
import { JsonDecoder } from './json-decoder';
import { JsonEncoder } from './json-encoder';

export type JsonCodec = Codec<string, string, Json>;

export const JsonCodec: JsonCodecObj = Codec.make(
  JsonEncoder,
  JsonDecoder,
) as any;

JsonCodec.fromCodec = codec => JsonCodec.andThen(codec);
JsonCodec.fromSchema = <A>(sa: Schema<A>) =>
  JsonCodec.fromCodec(sa.interpret(Codec.Schemable) as Codec<Json, Json, A>);

interface JsonCodecObj extends JsonCodec {
  fromCodec<A>(encoder: Codec<Json, Json, A>): Codec<string, string, A>;
  fromSchema<A>(sa: Schema<A>): Codec<string, string, A>;
}
