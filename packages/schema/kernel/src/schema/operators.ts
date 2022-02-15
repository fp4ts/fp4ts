// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ImapSchema, NullableSchema, Schema } from './algebra';

export const nullable = <A>(sa: Schema<A>): Schema<A | null> =>
  new NullableSchema(sa);

// export const intersection: <B>(
//   sb: Schema<B>,
// ) => <A>(sa: Schema<A>) => Schema<A & B> = sb => sa => intersection_(sa, sb);

// -- Point-ful operators

// export const intersection_ = <A, B>(
//   sa: Schema<A>,
//   sb: Schema<B>,
// ): Schema<A & B> => new IntersectionSchema(sa, sb);

export const imap_ = <A, B>(
  sa: Schema<A>,
  f: (a: A) => B,
  g: (b: B) => A,
): Schema<B> => new ImapSchema(sa, f, g);
