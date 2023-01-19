// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

export const boolean: JsonCodec<boolean> = JsonCodec.fromSchema(Schema.boolean);
export const number: JsonCodec<number> = JsonCodec.fromSchema(Schema.number);
export const string: JsonCodec<string> = JsonCodec.fromSchema(Schema.string);
