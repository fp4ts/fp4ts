// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref } from '@fp4ts/core';
import { Schema, TypeOf } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';

const _RegisterUserDto = Schema.struct({
  username: Schema.string,
  password: Schema.string,
});

export type RegisterUserDto = TypeOf<typeof _RegisterUserDto>;
export const RegisterUserDto = {
  schema: _RegisterUserDto,
  jsonCodec: JsonCodec.fromSchema(_RegisterUserDto),
  Ref: typeref<RegisterUserDto>()(
    '@fp4ts/shopping-cart/application/auth/register-user-dto',
  ),
};
