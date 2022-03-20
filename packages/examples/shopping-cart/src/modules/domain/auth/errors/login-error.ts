// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { derivePrisms } from '@fp4ts/optics';
import { deriveConstructors, Schema, TypeOf } from '@fp4ts/schema';

const _LoginError = Schema.sum('code')({
  'invalid-username-or-password': Schema.struct({
    code: Schema.literal('invalid-username-or-password'),
    message: Schema.string,
  }),
});

export type LoginError = TypeOf<typeof _LoginError>;

const cts = deriveConstructors(_LoginError);

export const InvalidUsernameOrPassword = () =>
  cts['Invalid-username-or-password']({
    message: 'Invalid username or password',
  });

const prs = derivePrisms(_LoginError);

export const LoginError = {
  _InvalidUsernameOrPassword: prs['invalid-username-or-password'],
};
