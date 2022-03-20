// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats';
import { Schema, Schemable, TypeOf } from '@fp4ts/schema';

import { Password, Username } from './values';

const _LoginUser = Schema.struct({
  username: Username.schema,
  password: Password.schema,
});

export type LoginUser = TypeOf<typeof _LoginUser>;

export const LoginUser: RegisterUserObj = function () {};

LoginUser.schema = _LoginUser;
LoginUser.Eq = _LoginUser.interpret(Schemable.Eq);

interface RegisterUserObj {
  schema: Schema<LoginUser>;
  Eq: Eq<LoginUser>;
}
