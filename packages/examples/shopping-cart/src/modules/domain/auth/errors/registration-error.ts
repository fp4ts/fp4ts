// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema, TypeOf } from '@fp4ts/schema';
import { derivePrisms } from '@fp4ts/optics';

import { UsernameExistsError } from './username-exists-error';
import { InvalidUsernameError } from './invalid-username-error';
import { ShortPasswordError } from './short-password-error';

const _RegistrationError = Schema.sum('code')({
  'invalid-username': InvalidUsernameError.schema,
  'username-exists': UsernameExistsError.schema,
  'short-password': ShortPasswordError.schema,
});

export type RegistrationError = TypeOf<typeof _RegistrationError>;

const prs = derivePrisms(_RegistrationError);

export const RegistrationError = {
  _InvalidUsernameError: prs['invalid-username'],
  _UsernameExistsError: prs['username-exists'],
  _ShortPasswordError: prs['short-password'],
};
