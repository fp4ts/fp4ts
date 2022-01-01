/* eslint-disable @typescript-eslint/ban-types */
import { Literal } from '../literal';
import {
  ArraySchema,
  BooleanSchema,
  DeferSchema,
  LiteralSchema,
  NullSchema,
  NumberSchema,
  PartialSchema,
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
  [k in keyof A]: Schema<A>;
}): Schema<A> => new StructSchema(xs);

export const partial = <A extends {}>(xs: {
  [k in keyof A]: Schema<A>;
}): Schema<A> => new PartialSchema(xs);

export const record = <A>(sa: Schema<A>): Schema<Record<string, A>> =>
  new RecordSchema(sa);

export const product = <A extends unknown[]>(
  ...xs: { [k in keyof A]: Schema<A> }
): Schema<A> => new ProductSchema(xs);

export const sum =
  <T extends string>(tag: T) =>
  <A extends {}>(xs: { [k in keyof A]: Schema<A[k] & Record<T, k>> }): Schema<
    A[keyof A]
  > =>
    new SumSchema(tag, xs);

export const defer = <A>(thunk: () => Schema<A>): Schema<A> =>
  new DeferSchema(thunk);
