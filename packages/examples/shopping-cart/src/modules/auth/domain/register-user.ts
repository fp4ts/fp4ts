// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats';
import { Schema, Schemable, TypeOf } from '@fp4ts/schema';

import { Password, Username } from './values';

const _RegisterUser = Schema.struct({
  username: Username.schema,
  password: Password.schema,
});

export type RegisterUser = TypeOf<typeof _RegisterUser>;

export const RegisterUser: RegisterUserObj = function () {};

RegisterUser.schema = _RegisterUser;
RegisterUser.Eq = _RegisterUser.interpret(Schemable.Eq);

interface RegisterUserObj {
  schema: Schema<RegisterUser>;
  Eq: Eq<RegisterUser>;
}
