// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema, TypeOf } from '@fp4ts/schema';

import { Username } from '../values';

const _UsernameExistsError = Schema.struct({
  code: Schema.literal('username-exists'),
  message: Schema.string,
  username: Username.schema,
});

export type UsernameExistsError = TypeOf<typeof _UsernameExistsError>;

export const UsernameExistsError = (username: Username) => ({
  code: 'username-exists',
  message: `Username '${username}' is already taken`,
  username: username,
});

UsernameExistsError.schema = _UsernameExistsError;
