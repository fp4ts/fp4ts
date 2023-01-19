// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ArrayF, FunctionK } from '@fp4ts/cats';
import { NullableK } from '../kinds';
import {
  ArraySchemaK,
  ComposeSchemaK,
  ImapSchemaK,
  NullableSchemaK,
  SchemaK,
} from './algebra';

export const array = <F>(sf: SchemaK<F>): SchemaK<[ArrayF, F]> =>
  new ArraySchemaK(sf);

export const nullable = <F>(sf: SchemaK<F>): SchemaK<[NullableK, F]> =>
  new NullableSchemaK(sf);

export const compose_ = <F, G>(
  sf: SchemaK<F>,
  sg: SchemaK<G>,
): SchemaK<[F, G]> => new ComposeSchemaK(sf, sg);

export const imap_ = <F, G>(
  sf: SchemaK<F>,
  f: FunctionK<F, G>,
  g: FunctionK<G, F>,
): SchemaK<G> => new ImapSchemaK(sf, f, g);
