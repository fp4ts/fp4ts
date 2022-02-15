// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $ } from '@fp4ts/core';
import { ConstK, IdentityK } from '@fp4ts/cats';
import { ProductK, StructK, SumK } from '../kinds';
import { SchemaK as SchemaKBase } from './algebra';
import { Literal } from '../literal';
import {
  booleanSchemaK,
  defer,
  literal,
  numberSchemaK,
  par,
  product,
  stringSchemaK,
  struct,
  sum,
} from './constructors';

export type SchemaK<F> = SchemaKBase<F>;
export const SchemaK: SchemaKObj = function () {};

export type KindOf<S> = S extends SchemaK<infer F> ? F : never;

interface SchemaKObj {
  literal<A extends [Literal, ...Literal[]]>(
    ...xs: A
  ): SchemaK<$<ConstK, [A[number]]>>;
  boolean: SchemaK<$<ConstK, [boolean]>>;
  number: SchemaK<$<ConstK, [number]>>;
  string: SchemaK<$<ConstK, [string]>>;
  par: SchemaK<IdentityK>;

  struct<F extends {}>(fs: {
    [k in keyof F]: SchemaK<F[k]>;
  }): SchemaK<StructK<F>>;

  product<F extends unknown[]>(
    ...fs: { [k in keyof F]: SchemaK<F[k]> }
  ): SchemaK<ProductK<F>>;

  sum<T extends string>(
    tag: T,
  ): <F extends {}>(fs: { [k in keyof F]: SchemaK<F[k]> }) => SchemaK<SumK<F>>;

  defer<F>(thunk: () => SchemaK<F>): SchemaK<F>;
}

SchemaK.literal = literal;
SchemaK.boolean = booleanSchemaK;
SchemaK.number = numberSchemaK;
SchemaK.string = stringSchemaK;
SchemaK.par = par;
SchemaK.struct = struct;
SchemaK.product = product;
SchemaK.sum = sum;
SchemaK.defer = defer;
