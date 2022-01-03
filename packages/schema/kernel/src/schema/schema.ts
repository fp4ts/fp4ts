// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $type, TyK, TyVar } from '@fp4ts/core';
import { Literal } from '../literal';
import { Schema as SchemaBase } from './algebra';
import {
  array,
  boolean,
  defer,
  literal,
  nullSchema,
  number,
  partial,
  product,
  record,
  string,
  struct,
  sum,
} from './constructors';

export type Schema<A> = SchemaBase<A>;

export type TypeOf<A> = A extends Schema<infer B> ? B : never;

export const Schema: SchemaObj = function () {};

interface SchemaObj {
  literal<A extends [Literal, ...Literal[]]>(...xs: A): Schema<A[number]>;

  boolean: Schema<boolean>;
  number: Schema<number>;
  string: Schema<string>;
  nullSchema: Schema<null>;

  array<A>(sa: Schema<A>): Schema<A[]>;

  struct<A extends {}>(xs: {
    [k in keyof A]: Schema<A[k]>;
  }): Schema<A>;

  partial<A extends {}>(xs: {
    [k in keyof A]: Schema<A[k]>;
  }): Schema<A>;

  record<A>(sa: Schema<A>): Schema<Record<string, A>>;

  product<A extends unknown[]>(
    ...xs: { [k in keyof A]: Schema<A[k]> }
  ): Schema<A>;

  sum<T extends string>(
    tag: T,
  ): <A extends {}>(xs: {
    [k in keyof A]: Schema<A[k] & Record<T, k>>;
  }) => Schema<A[keyof A]>;

  defer<A>(thunk: () => Schema<A>): Schema<A>;
}

Schema.literal = literal;
Schema.boolean = boolean;
Schema.number = number;
Schema.string = string;
Schema.nullSchema = nullSchema;
Schema.array = array;
Schema.struct = struct;
Schema.partial = partial;
Schema.record = record;
Schema.product = product;
Schema.sum = sum;
Schema.defer = defer;

// -- HKT

export interface SchemaK extends TyK<[unknown]> {
  [$type]: Schema<TyVar<this, 0>>;
}
