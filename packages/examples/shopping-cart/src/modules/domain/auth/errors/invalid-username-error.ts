// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema, TypeOf } from '@fp4ts/schema';

const _InvalidUsernameError = Schema.struct({
  code: Schema.literal('invalid-username'),
  message: Schema.string,
});

export type InvalidUsernameError = TypeOf<typeof _InvalidUsernameError>;

export const InvalidUsernameError = (): InvalidUsernameError => ({
  code: 'invalid-username',
  message: `Username is invalid`,
});

InvalidUsernameError.schema = _InvalidUsernameError;
