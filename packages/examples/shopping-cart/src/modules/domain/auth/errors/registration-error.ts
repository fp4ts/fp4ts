// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema, deriveConstructors, TypeOf } from '@fp4ts/schema';
import { derivePrisms } from '@fp4ts/optics';

import { Username } from '../values';

const _RegistrationError = Schema.sum('code')({
  'invalid-username': Schema.struct({
    code: Schema.literal('invalid-username'),
    message: Schema.string,
  }),
  'username-exists': Schema.struct({
    code: Schema.literal('username-exists'),
    message: Schema.string,
    username: Username.schema,
  }),
  'short-password': Schema.struct({
    code: Schema.literal('short-password'),
    message: Schema.string,
  }),
});

export type RegistrationError = TypeOf<typeof _RegistrationError>;

const cts = deriveConstructors(_RegistrationError);

export const InvalidUsernameError = () =>
  cts['Invalid-username']({ message: 'Username is invalid' });
export const UsernameExistsError = (username: Username) =>
  cts['Username-exists']({
    message: `Username '${username}' is already taken`,
    username: username,
  });
export const ShortPasswordError = () =>
  cts['Short-password']({
    message: 'Password has to be at least 8 characters long',
  });

const prs = derivePrisms(_RegistrationError);

export const RegistrationError = {
  _InvalidUsernameError: prs['invalid-username'],
  _UsernameExistsError: prs['username-exists'],
  _ShortPasswordError: prs['short-password'],
};
