// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Encoder } from '@fp4ts/schema-core';
import { Schema } from '@fp4ts/schema-kernel';
import { Json } from './json';

export type JsonEncoder<A> = Encoder<string, A>;

export const JsonEncoder: JsonEncoderObj = function () {};

JsonEncoder.withoutSpaces = () => Encoder(json => JSON.stringify(json));
JsonEncoder.fromEncoder = encoder => encoder.andThen(RawJsonEncoder);
JsonEncoder.fromSchema = <A>(sa: Schema<A>) =>
  JsonEncoder.fromEncoder(sa.interpret(Encoder.Schemable) as Encoder<Json, A>);

interface JsonEncoderObj {
  withoutSpaces<A>(): JsonEncoder<A>;

  fromEncoder<A>(encoder: Encoder<Json, A>): JsonEncoder<A>;
  fromSchema<A>(sa: Schema<A>): JsonEncoder<A>;
}

// -- Raw

export type RawJsonEncoder = JsonEncoder<Json>;

export const RawJsonEncoder: RawJsonEncoder = Encoder(json =>
  JSON.stringify(json, null, 2),
) as any;
