// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $type, TyK, TyVar } from '@fp4ts/core';
import { Literal } from '@fp4ts/schema-kernel/src/literal';
import { Guard as GuardBase } from './algebra';
import {
  array,
  boolean,
  defer,
  empty,
  identity,
  literal,
  nullGuard,
  number,
  partial,
  product,
  record,
  string,
  struct,
  sum,
} from './constructors';

export type Guard<I, A extends I> = GuardBase<I, A>;

export const Guard: GuardObj = function () {};

interface GuardObj {
  identity<A>(): Guard<A, A>;
  empty: Guard<unknown, never>;
  literal<A extends [Literal, ...Literal[]]>(
    ...xs: A
  ): Guard<unknown, A[number]>;
  boolean: Guard<unknown, boolean>;
  number: Guard<unknown, number>;
  string: Guard<unknown, string>;
  null: Guard<unknown, null>;
  array<A>(ga: Guard<unknown, A>): Guard<unknown, A[]>;
  struct<A extends {}>(ga: {
    [k in keyof A]: Guard<unknown, A[k]>;
  }): Guard<unknown, A>;
  partial<A>(ga: { [k in keyof A]: Guard<unknown, A[k]> }): Guard<
    unknown,
    Partial<A>
  >;
  record<A>(ga: Guard<unknown, A>): Guard<unknown, Record<string, A>>;
  product<A extends unknown[]>(
    ...ga: { [k in keyof A]: Guard<unknown, A[k]> }
  ): Guard<unknown, A>;
  sum<T extends string>(
    tag: T,
  ): <A extends {}>(ga: {
    [k in keyof A]: Guard<unknown, A[k] & Record<T, k>>;
  }) => Guard<unknown, A[keyof A]>;
  defer<A>(thunk: () => Guard<unknown, A>): Guard<unknown, A>;
}

Guard.identity = identity;
Guard.empty = empty;
Guard.literal = literal;
Guard.boolean = boolean;
Guard.number = number;
Guard.string = string;
Guard.null = nullGuard;
Guard.array = array;
Guard.struct = struct;
Guard.partial = partial;
Guard.record = record;
Guard.product = product as GuardObj['product'];
Guard.sum = sum;
Guard.defer = defer;

// -- HKT

export interface GuardF extends TyK<[unknown, unknown]> {
  [$type]: Guard<TyVar<this, 0>, TyVar<this, 1>>;
}
