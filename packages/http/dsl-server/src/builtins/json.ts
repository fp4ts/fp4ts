// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Codec, Schema } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

export const boolean: Codec<string, string, boolean> = JsonCodec.fromSchema(
  Schema.boolean,
);
export const number: Codec<string, string, number> = JsonCodec.fromSchema(
  Schema.number,
);
export const string: Codec<string, string, string> = JsonCodec.fromSchema(
  Schema.string,
);
