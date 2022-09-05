// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { typeref } from '@fp4ts/core';
import { ImapSchema, NullableSchema, Schema } from './algebra';
import { SchemaRef } from './schema-ref';

export const nullable = <A>(sa: Schema<A>): Schema<A | null> =>
  new NullableSchema(sa);

// -- Point-ful operators

export const imap_ = <A, B>(
  sa: Schema<A>,
  f: (a: A) => B,
  g: (b: B) => A,
): Schema<B> => new ImapSchema(sa, f, g);

export const as_ = <Ref extends string, A>(
  sa: Schema<A>,
  Ref: Ref,
): SchemaRef<Ref, A> => ({ ...typeref<A>()(Ref), schema: sa });
