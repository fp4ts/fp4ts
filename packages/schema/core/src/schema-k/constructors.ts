// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $ } from '@fp4ts/core';
import { ConstK, IdentityK } from '@fp4ts/cats';
import { Literal } from '@fp4ts/schema-kernel';
import { ProductK, SumK, StructK } from '../kinds';
import {
  BooleanSchemaK,
  DeferSchemaK,
  LiteralSchemaK,
  NumberSchemaK,
  ParSchemaK,
  ProductSchemaK,
  SchemaK,
  StringSchemaK,
  StructSchemaK,
  SumSchemaK,
} from './algebra';

export const literal = <A extends [Literal, ...Literal[]]>(
  ...xs: A
): SchemaK<A[number]> => new LiteralSchemaK(xs);

export const booleanSchemaK: SchemaK<$<ConstK, [boolean]>> = BooleanSchemaK;
export const numberSchemaK: SchemaK<$<ConstK, [number]>> = NumberSchemaK;
export const stringSchemaK: SchemaK<$<ConstK, [string]>> = StringSchemaK;
export const par: SchemaK<IdentityK> = ParSchemaK;

export const struct = <F extends {}>(fs: {
  [k in keyof F]: SchemaK<StructK<F[k]>>;
}): SchemaK<F> => new StructSchemaK(fs);

export const product = <F extends unknown[]>(
  ...fs: { [k in keyof F]: SchemaK<F[k]> }
): SchemaK<ProductK<F>> => new ProductSchemaK(fs);

export const sum =
  <T extends string>(tag: T) =>
  <F extends {}>(fs: { [k in keyof F]: SchemaK<F> }): SchemaK<
    SumK<F[keyof F]>
  > =>
    new SumSchemaK(tag, fs);

export const defer = <F>(thunk: () => SchemaK<F>): SchemaK<F> =>
  new DeferSchemaK(thunk);
