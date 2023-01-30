// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazy } from '@fp4ts/core';
import { SchemableK } from '../schemable-k';
import {
  booleanSchemaK,
  defer,
  literal,
  nullSchemaK,
  numberSchemaK,
  par,
  product,
  stringSchemaK,
  struct,
  sum,
} from './constructors';
import { array, compose_, imap_, nullable } from './operators';
import { SchemaKF } from './schema-k';

export const schemaKSchemableK: Lazy<SchemableK<SchemaKF>> = lazy(() =>
  SchemableK.of<SchemaKF>({
    literal: literal as SchemableK<SchemaKF>['literal'],

    boolean: booleanSchemaK,
    number: numberSchemaK,
    string: stringSchemaK,
    null: nullSchemaK,

    par: par,

    array: array,

    struct: struct,
    product: product as SchemableK<SchemaKF>['product'],
    sum: sum as SchemableK<SchemaKF>['sum'],

    nullable: nullable,

    compose_: compose_,

    defer: defer,

    imap_: imap_,
  }),
);
