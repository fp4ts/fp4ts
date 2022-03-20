// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref } from '@fp4ts/core';
import { Schema, TypeOf } from '@fp4ts/schema';
import { JsonCodec } from '@fp4ts/schema-json';
import { User, UserId, Username } from '../../../domain/auth';

const _UserDto = Schema.struct({
  id: UserId.schema,
  username: Username.schema,
});

export type UserDto = TypeOf<typeof _UserDto>;
export const UserDto = {
  schema: _UserDto,
  jsonCodec: JsonCodec.fromSchema(_UserDto),
  Ref: typeref<UserDto>()('@fp4ts/shopping-cart/application/auth/user-dto'),

  fromUser: (user: User): UserDto => ({ id: user.id, username: user.username }),
};
