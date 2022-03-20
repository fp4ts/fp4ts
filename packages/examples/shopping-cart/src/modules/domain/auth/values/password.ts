// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtype, TypeOf } from '@fp4ts/core';
import { Eq, None, Option, Some } from '@fp4ts/cats';
import { Schema, Schemable } from '@fp4ts/schema';

const _Password = newtype<string>()(
  '@fp4ts/shopping-cart/auth/domain/password',
);

export type Password = TypeOf<typeof _Password>;

export const Password: PasswordObj = function (
  password: string,
): Option<Password> {
  return PasswordRegex.test(password) ? Some(_Password(password)) : None;
};

const PasswordRegex = /^.{8,}$/;
Password.unsafeFromString = _Password;
Password.toPlainText = _Password.unapply;
Password.schema = Schema.string.imap(_Password, _Password.unapply);
Password.Eq = Password.schema.interpret(Schemable.Eq);

interface PasswordObj {
  (username: string): Option<Password>;
  unsafeFromString(s: string): Password;
  toPlainText(p: Password): string;
  schema: Schema<Password>;
  Eq: Eq<Password>;
}
