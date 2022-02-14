// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Base, Kind, $ } from '@fp4ts/core';
import { ArrayK, ConstK, IdentityK, OptionK } from '@fp4ts/cats';
import { Literal } from './literal';
import { ProductK, StructK, SumK } from './kinds';
import { FunctorK, functorSchemableK } from './functor';

export interface SchemableK<S> extends Base<S> {
  literal<A extends [Literal, ...Literal[]]>(
    ...xs: A
  ): Kind<S, [$<ConstK, [A[number]]>]>;
  readonly boolean: Kind<S, [$<ConstK, [boolean]>]>;
  readonly number: Kind<S, [$<ConstK, [number]>]>;
  readonly string: Kind<S, [$<ConstK, [string]>]>;
  readonly null: Kind<S, [$<ConstK, [null]>]>;

  readonly par: Kind<S, [IdentityK]>;

  array<F>(f: Kind<S, [F]>): Kind<S, [[ArrayK, F]]>;
  optional<F>(f: Kind<S, [F]>): Kind<S, [[OptionK, F]]>;

  struct<F extends {}>(xs: { [k in keyof F]: Kind<S, [F[k]]> }): Kind<
    S,
    [StructK<F>]
  >;

  product<F extends unknown[]>(
    ...xs: { [k in keyof F]: Kind<S, [F[k]]> }
  ): Kind<S, [ProductK<F>]>;

  sum<T extends string>(
    tag: T,
  ): <F extends {}>(xs: {
    [k in keyof F]: Kind<S, [F[k]]>;
  }) => Kind<S, [SumK<F[keyof F]>]>;

  defer<F>(thunk: () => Kind<S, [F]>): Kind<S, [F]>;

  imap_<F, G>(
    sf: Kind<S, [F]>,
    f: <A>(fa: Kind<F, [A]>) => Kind<G, [A]>,
    g: <A>(ga: Kind<G, [A]>) => Kind<F, [A]>,
  ): Kind<S, [G]>;

  compose_<F, G>(sf: Kind<S, [F]>, sg: Kind<S, [G]>): Kind<S, [[F, G]]>;
}

export const SchemableK = Object.freeze({
  get Functor(): SchemableK<FunctorK> {
    return functorSchemableK();
  },
});
