// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Encoder } from '@fp4ts/schema-core';
import { Json } from './json';

export type JsonEncoder = Encoder<string, Json>;

export const JsonEncoder: JsonEncoderObj = Encoder(json =>
  JSON.stringify(json, null, 2),
) as any;

JsonEncoder.withoutSpaces = Encoder(json => JSON.stringify(json));
JsonEncoder.fromEncoder = encoder => encoder.andThen(JsonEncoder);

interface JsonEncoderObj extends JsonEncoder {
  withoutSpaces: JsonEncoder;

  fromEncoder<A>(encoder: Encoder<Json, A>): Encoder<string, A>;
}
