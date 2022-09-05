// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TypeRef } from '@fp4ts/core';
import { Schema } from './algebra';

export interface SchemaRef<Ref extends string, A> extends TypeRef<Ref, A> {
  readonly schema: Schema<A>;
}
