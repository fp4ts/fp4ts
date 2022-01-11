// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema } from '@fp4ts/schema-kernel';

export const typeDef = <R extends string, A>(
  ref: R,
  schema: Schema<A>,
): Type<R, A> => ({ ref, schema });

export interface Type<R extends string, A> {
  ref: R;
  schema: Schema<A>;
}
