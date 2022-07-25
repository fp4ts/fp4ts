// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema, TypeOf } from '@fp4ts/schema';
import { Email } from '../email';
import { HashedPassword } from './hashed-password';
import { Role } from './role';

const Account_ = Schema.struct({
  email: Email.schema,
  roles: Role.schema.array,
  hashedPassword: HashedPassword.schema,
});

export type Account = TypeOf<typeof Account_>;
export const Account = function () {};

Account.schema = Account_;
