// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TypeRef, typeref } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Schema, Schemable, TypeOf } from '@fp4ts/schema';

import { HashedPassword, UserId, Username } from './values';

const _User = Schema.struct({
  id: UserId.schema,
  username: Username.schema,
  password: HashedPassword.schema,
});

export type User = TypeOf<typeof _User>;

export const User: UserObj = function () {};

User.schema = _User;
User.Eq = _User.interpret(Schemable.Eq);

const UserTypeTag = '@fp4ts/domain/auth/user';
type UserTypeTag = typeof UserTypeTag;
User.Ref = typeref<User>()(UserTypeTag);

interface UserObj {
  schema: Schema<User>;
  Eq: Eq<User>;
  Ref: TypeRef<UserTypeTag, User>;
}
