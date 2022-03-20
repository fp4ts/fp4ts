// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref } from '@fp4ts/core';
import { Schema, TypeOf } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

const _Version = Schema.struct({ version: Schema.string });

export type Version = TypeOf<typeof _Version>;

export const Version = {
  jsonCodec: JsonCodec.fromSchema(_Version),
  Ref: typeref<Version>()('@fp4ts/shopping-cart/version-dto'),
};
