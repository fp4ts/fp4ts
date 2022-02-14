// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Base, Kind, $ } from '@fp4ts/core';
import { ConstK, IdentityK } from '@fp4ts/cats';
import { Literal } from '@fp4ts/schema-kernel';
import { ProductK, StructK, SumK } from '../kinds';
import { FunctorK, functorSchemableK } from './functor';

export interface SchemableK<F> extends Base<F> {
  literal<A extends [Literal, ...Literal[]]>(
    ...xs: A
  ): Kind<F, [$<ConstK, [A[number]]>]>;
  readonly boolean: Kind<F, [$<ConstK, [boolean]>]>;
  readonly number: Kind<F, [$<ConstK, [number]>]>;
  readonly string: Kind<F, [$<ConstK, [string]>]>;
  readonly null: Kind<F, [$<ConstK, [null]>]>;

  readonly par: Kind<F, [IdentityK]>;

  struct<A extends {}>(xs: { [k in keyof A]: Kind<F, [A[k]]> }): Kind<
    F,
    [StructK<A>]
  >;

  product<A extends unknown[]>(
    ...xs: { [k in keyof A]: Kind<F, [A[k]]> }
  ): Kind<F, [ProductK<A>]>;

  sum<T extends string>(
    tag: T,
  ): <A extends {}>(xs: {
    [k in keyof A]: Kind<F, [A[k]]>;
  }) => Kind<F, [SumK<A[keyof A]>]>;

  defer<G>(thunk: () => Kind<F, [G]>): Kind<F, [G]>;
}

export const SchemableK = Object.freeze({
  get Functor(): SchemableK<FunctorK> {
    return functorSchemableK();
  },
});
