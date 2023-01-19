// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { ConstF, IdentityF } from '@fp4ts/cats';
import { ProductK, StructK, SumK } from '../kinds';
import {
  BooleanSchemaK,
  NullSchemaK,
  NumberSchemaK,
  ParSchemaK,
  SchemaK as SchemaKBase,
  StringSchemaK,
} from './algebra';
import { Literal } from '../literal';
import { defer, literal, make, product, struct, sum } from './constructors';
import { SchemableK } from '../schemable-k';

export type SchemaK<F> = SchemaKBase<F>;
export const SchemaK: SchemaKObj = function () {};

export type KindOf<S> = S extends SchemaK<infer F> ? F : never;

interface SchemaKObj {
  literal<A extends [Literal, ...Literal[]]>(
    ...xs: A
  ): SchemaK<$<ConstF, [A[number]]>>;
  boolean: SchemaK<$<ConstF, [boolean]>>;
  number: SchemaK<$<ConstF, [number]>>;
  string: SchemaK<$<ConstF, [string]>>;
  null: SchemaK<$<ConstF, [null]>>;
  par: SchemaK<IdentityF>;

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

  make<F>(f: <S>(S: SchemableK<S>) => Kind<S, [F]>): SchemaK<F>;
}

SchemaK.literal = literal;
SchemaK.boolean = BooleanSchemaK;
SchemaK.number = NumberSchemaK;
SchemaK.string = StringSchemaK;
SchemaK.null = NullSchemaK;
SchemaK.par = ParSchemaK;
SchemaK.struct = struct;
SchemaK.product = product as typeof SchemaK.product;
SchemaK.sum = sum;
SchemaK.defer = defer;
SchemaK.make = make;

// -- HKT

export interface SchemaKF extends TyK<[unknown]> {
  [$type]: SchemaK<TyVar<this, 0>>;
}
