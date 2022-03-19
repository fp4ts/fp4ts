// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, newtype, TypeOf } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Schema, Schemable } from '@fp4ts/schema';

import { BcryptHash } from '../../../../common';
import { Password } from './password';

const _HashedPassword = newtype<string>()(
  '@fp4ts/shopping-cart/auth/domain/hashed-password',
);

export type HashedPassword = TypeOf<typeof _HashedPassword>;

export const HashedPassword: HashedPasswordObj = function () {};

HashedPassword.fromPassword =
  <F>(F: BcryptHash<F>) =>
  (pwd: Password) =>
    F.hash(Password.toPlainText(pwd));
HashedPassword.unsafeFromString = _HashedPassword;
HashedPassword.schema = Schema.string.imap(
  _HashedPassword,
  _HashedPassword.unapply,
);
HashedPassword.Eq = HashedPassword.schema.interpret(Schemable.Eq);

interface HashedPasswordObj {
  fromPassword<F>(
    F: BcryptHash<F>,
  ): (pwd: Password) => Kind<F, [HashedPassword]>;
  unsafeFromString(s: string): HashedPassword;
  schema: Schema<HashedPassword>;
  Eq: Eq<HashedPassword>;
}
