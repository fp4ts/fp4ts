// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema } from '@fp4ts/schema';

export const DateSchema = Schema.string.imap(
  s => new Date(s),
  d => d.toISOString(),
);
