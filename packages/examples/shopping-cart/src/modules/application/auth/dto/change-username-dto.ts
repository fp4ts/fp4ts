// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref } from '@fp4ts/core';
import { Schema, TypeOf } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

const _ChangeUsernameDto = Schema.struct({
  username: Schema.string,
});

export type ChangeUsernameDto = TypeOf<typeof _ChangeUsernameDto>;
export const ChangeUsernameDto = {
  schema: _ChangeUsernameDto,
  jsonCodec: JsonCodec.fromSchema(_ChangeUsernameDto),
  Ref: typeref<ChangeUsernameDto>()(
    '@fp4ts/shopping-cart/application/auth/change-username-dto',
  ),
};
