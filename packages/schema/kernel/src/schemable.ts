// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Base, instance, Kind } from '@fp4ts/core';
import { Literal } from './literal';

export interface Schemable<S> extends Base<S> {
  literal<A extends [Literal, ...Literal[]]>(...xs: A): Kind<S, [A[number]]>;
  readonly boolean: Kind<S, [boolean]>;
  readonly number: Kind<S, [number]>;
  readonly string: Kind<S, [string]>;
  readonly null: Kind<S, [null]>;

  array<A>(sa: Kind<S, [A]>): Kind<S, [A[]]>;

  struct<A extends {}>(xs: { [k in keyof A]: Kind<S, [A[k]]> }): Kind<S, [A]>;

  record<A>(sa: Kind<S, [A]>): Kind<S, [Record<string, A>]>;

  nullable<A>(sa: Kind<S, [A]>): Kind<S, [A | null]>;

  product<A extends unknown[]>(
    ...xs: { [k in keyof A]: Kind<S, [A[k]]> }
  ): Kind<S, [A]>;

  sum<T extends string>(
    tag: T,
  ): <A extends {}>(xs: {
    [k in keyof A]: Kind<S, [A[k] & Record<T, k>]>;
  }) => Kind<S, [A[keyof A]]>;

  defer<A>(thunk: () => Kind<S, [A]>): Kind<S, [A]>;

  imap<A, B>(sa: Kind<S, [A]>, f: (a: A) => B, g: (b: B) => A): Kind<S, [B]>;
}

export type SchemableRequirements<S> = Omit<
  Schemable<S>,
  '_F' | 'intersection'
> &
  Partial<Schemable<S>>;
export const Schemable = Object.freeze({
  of: <S>(S: SchemableRequirements<S>): Schemable<S> =>
    instance<Schemable<S>>({
      ...S,
    }),
});
