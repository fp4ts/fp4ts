// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtype, TypeOf } from '@fp4ts/core';
import { Eq, None, Option, Some } from '@fp4ts/cats';
import { Schema, Schemable } from '@fp4ts/schema';

const _Username = newtype<string>()(
  '@fp4ts/shopping-cart/auth/domain/username',
);

export type Username = TypeOf<typeof _Username>;

export const Username: UsernameObj = function (
  username: string,
): Option<Username> {
  return UsernameRegex.test(username) ? Some(_Username(username)) : None;
};

const UsernameRegex = /^[\w_-]+$/;
Username.unsafeFromString = _Username;
Username.toString = _Username.unapply;
Username.schema = Schema.string.imap(_Username, _Username.unapply);
Username.Eq = Username.schema.interpret(Schemable.Eq);

interface UsernameObj {
  (username: string): Option<Username>;
  unsafeFromString(s: string): Username;
  toString(username: Username): string;
  schema: Schema<Username>;
  Eq: Eq<Username>;
}
