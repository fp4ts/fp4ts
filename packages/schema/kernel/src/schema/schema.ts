// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind } from '@fp4ts/core';
import { Literal } from '../literal';
import { Schemable } from '../schemable';
import { Schema as SchemaBase, StructSchema, SumSchema } from './algebra';
import {
  array,
  boolean,
  defer,
  literal,
  make,
  nullSchema,
  number,
  product,
  record,
  string,
  struct,
  sum,
} from './constructors';

export type { StructSchema, SumSchema } from './algebra';
export type Schema<A> = SchemaBase<A>;

export type TypeOf<A> = A extends Schema<infer B> ? B : never;

export const Schema: SchemaObj = function () {};

interface SchemaObj {
  literal<A extends [Literal, ...Literal[]]>(...xs: A): Schema<A[number]>;

  boolean: Schema<boolean>;
  number: Schema<number>;
  string: Schema<string>;
  null: Schema<null>;

  array<A>(sa: Schema<A>): Schema<A[]>;

  struct<A extends {}>(xs: {
    [k in keyof A]: Schema<A[k]>;
  }): StructSchema<A>;

  record<A>(sa: Schema<A>): Schema<Record<string, A>>;

  product<A extends unknown[]>(
    ...xs: { [k in keyof A]: Schema<A[k]> }
  ): Schema<A>;

  sum<T extends string>(
    tag: T,
  ): <A extends {}>(xs: {
    [k in keyof A]: Schema<A[k] & Record<T, k>>;
  }) => SumSchema<T, A>;

  defer<A>(thunk: () => Schema<A>): Schema<A>;

  make<A>(f: <S>(S: Schemable<S>) => Kind<S, [A]>): Schema<A>;
}

Schema.literal = literal;
Schema.boolean = boolean;
Schema.number = number;
Schema.string = string;
Schema.null = nullSchema;
Schema.array = array;
Schema.struct = struct;
Schema.record = record;
Schema.product = product as SchemaObj['product'];
Schema.sum = sum;
Schema.defer = defer;
Schema.make = make;
