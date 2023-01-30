// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind, lazy } from '@fp4ts/core';
import { Literal } from '../literal';
import { Schemable } from '../schemable';
import {
  ArraySchema,
  BooleanSchema,
  DeferSchema,
  LiteralSchema,
  MakeSchema,
  NullSchema,
  NumberSchema,
  ProductSchema,
  RecordSchema,
  Schema,
  StringSchema,
  StructSchema,
  SumSchema,
} from './algebra';

export const literal = <A extends [Literal, ...Literal[]]>(
  ...xs: A
): Schema<A[number]> => new LiteralSchema(xs);

export const boolean: Schema<boolean> = BooleanSchema;

export const number: Schema<number> = NumberSchema;

export const string: Schema<string> = StringSchema;

export const nullSchema: Schema<null> = NullSchema;

export const array = <A>(sa: Schema<A>): Schema<A[]> => new ArraySchema(sa);

export const struct = <A extends {}>(xs: {
  [k in keyof A]: Schema<A[k]>;
}): StructSchema<A> => new StructSchema(xs);

export const record = <A>(sa: Schema<A>): Schema<Record<string, A>> =>
  new RecordSchema(sa);

export const product = <A extends unknown[]>(
  ...xs: { [k in keyof A]: Schema<A[k]> }
): Schema<A> => new ProductSchema<A>(xs);

export const sum =
  <T extends string>(tag: T) =>
  <A extends {}>(xs: {
    [k in keyof A]: Schema<A[k] & Record<T, k>>;
  }): SumSchema<T, A> =>
    new SumSchema(tag, xs);

export const defer = <A>(thunk: () => Schema<A>): Schema<A> =>
  new DeferSchema(lazy(thunk));

export const make = <A>(f: <S>(S: Schemable<S>) => Kind<S, [A]>): Schema<A> =>
  new MakeSchema(f);
