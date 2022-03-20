// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref } from '@fp4ts/core';
import { Schema, TypeOf } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

const _ChangePasswordDto = Schema.struct({
  password: Schema.string,
});

export type ChangePasswordDto = TypeOf<typeof _ChangePasswordDto>;
export const ChangePasswordDto = {
  schema: _ChangePasswordDto,
  jsonCodec: JsonCodec.fromSchema(_ChangePasswordDto),
  Ref: typeref<ChangePasswordDto>()(
    '@fp4ts/shopping-cart/application/auth/change-password-dto',
  ),
};
