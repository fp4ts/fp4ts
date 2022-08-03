// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtype, TypeOf } from '@fp4ts/core';
import { Schema } from '@fp4ts/schema';

const HashedPassword_ = newtype<string>()(
  '@shopping-cart/common/auth/hashed-password',
);

export type HashedPassword = TypeOf<typeof HashedPassword_>;
export const HashedPassword = function (text: string): HashedPassword {
  return HashedPassword_(text);
};

HashedPassword.toString = HashedPassword_.unapply;
HashedPassword.schema = Schema.string.imap(
  HashedPassword_,
  HashedPassword_.unapply,
);
