// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { Literal } from '@fp4ts/schema-kernel/lib/literal';
import { Encoder } from './algebra';
import { OutputOf, TypeOf } from './types';

export const lift = <O, A>(f: (a: A) => O): Encoder<O, A> => new Encoder(f);

export const literal = <A extends [Literal, ...Literal[]]>(
  ...xs: A
): Encoder<A[number], A[number]> => lift(id);

export const array = <O, A>(fa: Encoder<O, A>): Encoder<O[], A[]> =>
  new Encoder(xs => xs.map(fa.encode));

export const struct = <P extends Record<string, Encoder<unknown, unknown>>>(
  xs: P,
): Encoder<
  { [k in keyof P]: OutputOf<P[k]> },
  { [k in keyof P]: TypeOf<P[k]> }
> =>
  new Encoder(a => {
    const keys = Object.keys(xs) as (keyof P)[];
    return keys.reduce(
      (acc, k) => ({ ...acc, [k]: xs[k].encode(a[k]) }),
      {} as { [k in keyof P]: OutputOf<P[k]> },
    );
  });

export const partial = <P extends Record<string, Encoder<unknown, unknown>>>(
  xs: P,
): Encoder<
  Partial<{ [k in keyof P]: OutputOf<P[k]> }>,
  Partial<{ [k in keyof P]: TypeOf<P[k]> }>
> =>
  new Encoder(a => {
    const keys = Object.keys(xs) as (keyof P)[];
    return keys.reduce(
      (acc, k) =>
        k in a
          ? { ...acc, [k]: a[k] === undefined ? undefined : xs[k].encode(a[k]) }
          : acc,
      {} as { [k in keyof P]: OutputOf<P[k]> },
    );
  });

export const record = <O, A>(
  fa: Encoder<O, A>,
): Encoder<Record<string, O>, Record<string, A>> =>
  new Encoder(a => {
    const keys = Object.keys(a);
    return keys.reduce(
      (acc, k) => ({
        ...acc,
        [k]: fa.encode(a[k]),
      }),
      {} as Record<string, O>,
    );
  });

export const product = <P extends Encoder<unknown, unknown>[]>(
  ...xs: P
): Encoder<
  { [k in keyof P]: OutputOf<P[k]> },
  { [k in keyof P]: TypeOf<P[k]> }
> =>
  new Encoder(
    as =>
      xs.map((e, idx) => e.encode(as[idx])) as {
        [k in keyof P]: OutputOf<P[k]>;
      },
  );

export const sum =
  <T extends string>(tag: T) =>
  <P extends Record<string, Encoder<any, any>>>(
    xs: P,
  ): Encoder<OutputOf<P[keyof P]>, TypeOf<P[keyof P]>> =>
    new Encoder(a => xs[a[tag]].encode(a));

export const defer = <O, A>(thunk: () => Encoder<O, A>): Encoder<O, A> =>
  new Encoder(a => thunk().encode(a));
