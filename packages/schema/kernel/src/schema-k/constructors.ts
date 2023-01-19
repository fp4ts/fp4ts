// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $, Kind, lazyVal } from '@fp4ts/core';
import { ConstF, IdentityF } from '@fp4ts/cats';
import { Literal } from '../literal';
import { ProductK, SumK, StructK } from '../kinds';
import {
  BooleanSchemaK,
  DeferSchemaK,
  LiteralSchemaK,
  MakeSchemaK,
  NullSchemaK,
  NumberSchemaK,
  ParSchemaK,
  ProductSchemaK,
  SchemaK,
  StringSchemaK,
  StructSchemaK,
  SumSchemaK,
} from './algebra';
import { SchemableK } from '../schemable-k';

export const literal = <A extends [Literal, ...Literal[]]>(
  ...xs: A
): SchemaK<$<ConstF, [A[number]]>> => new LiteralSchemaK(xs);

export const booleanSchemaK: SchemaK<$<ConstF, [boolean]>> = BooleanSchemaK;
export const numberSchemaK: SchemaK<$<ConstF, [number]>> = NumberSchemaK;
export const stringSchemaK: SchemaK<$<ConstF, [string]>> = StringSchemaK;
export const nullSchemaK: SchemaK<$<ConstF, [null]>> = NullSchemaK;
export const par: SchemaK<IdentityF> = ParSchemaK;

export const struct = <F extends {}>(fs: {
  [k in keyof F]: SchemaK<F[k]>;
}): SchemaK<StructK<F>> => new StructSchemaK(fs);

export const product = <F extends unknown[]>(
  ...fs: { [k in keyof F]: SchemaK<F[k]> }
): SchemaK<ProductK<F>> => new ProductSchemaK<F>(fs);

export const sum =
  <T extends string>(tag: T) =>
  <F extends {}>(fs: { [k in keyof F]: SchemaK<F[k]> }): SchemaK<SumK<F>> =>
    new SumSchemaK(tag, fs);

export const defer = <F>(thunk: () => SchemaK<F>): SchemaK<F> =>
  new DeferSchemaK(lazyVal(thunk));

export const make = <F>(f: <S>(S: SchemableK<S>) => Kind<S, [F]>): SchemaK<F> =>
  new MakeSchemaK(f);
