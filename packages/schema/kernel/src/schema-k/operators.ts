// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ArrayK, FunctionK, OptionK } from '@fp4ts/cats';
import {
  ArraySchemaK,
  ComposeSchemaK,
  ImapSchemaK,
  OptionalSchemaK,
  SchemaK,
} from './algebra';

export const array = <F>(sf: SchemaK<F>): SchemaK<[ArrayK, F]> =>
  new ArraySchemaK(sf);

export const optional = <F>(sf: SchemaK<F>): SchemaK<[OptionK, F]> =>
  new OptionalSchemaK(sf);

export const compose_ = <F, G>(
  sf: SchemaK<F>,
  sg: SchemaK<G>,
): SchemaK<[F, G]> => new ComposeSchemaK(sf, sg);

export const imap_ = <F, G>(
  sf: SchemaK<F>,
  f: FunctionK<F, G>,
  g: FunctionK<G, F>,
): SchemaK<G> => new ImapSchemaK(sf, f, g);
