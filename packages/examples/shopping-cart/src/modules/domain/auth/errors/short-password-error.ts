// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema, TypeOf } from '@fp4ts/schema';

const _ShortPasswordError = Schema.struct({
  code: Schema.literal('short-password'),
  message: Schema.string,
});

export type ShortPasswordError = TypeOf<typeof _ShortPasswordError>;

export const ShortPasswordError = (): ShortPasswordError => ({
  code: 'short-password',
  message: 'Password has to be at least 8 characters long',
});

ShortPasswordError.schema = _ShortPasswordError;
