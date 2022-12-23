// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, id } from '@fp4ts/core';
import { Literal } from '@fp4ts/schema-kernel';
import { Encoder, safeEncode, SafeEncoder } from './algebra';
import { OutputOf, TypeOf } from './types';

export const lift = <O, A>(f: (a: A) => O): Encoder<O, A> => new Encoder(f);

export const literal = <A extends [Literal, ...Literal[]]>(
  ...xs: A
): Encoder<A[number], A[number]> => lift(id);

export const array = <O, A>(fa: Encoder<O, A>): Encoder<O[], A[]> =>
  new SafeEncoder(xs => {
    const loop = (acc: O[], idx: number): Eval<O[]> =>
      idx >= xs.length
        ? Eval.now(acc)
        : Eval.defer(() => safeEncode(fa, xs[idx])).flatMap(x =>
            loop([...acc, x], idx + 1),
          );

    return loop([], 0);
  });

export const struct = <P extends Record<string, Encoder<unknown, unknown>>>(
  xs: P,
): Encoder<
  { [k in keyof P]: OutputOf<P[k]> },
  { [k in keyof P]: TypeOf<P[k]> }
> =>
  new SafeEncoder(a => {
    const keys = Object.keys(xs) as (keyof P)[];
    const loop = (
      acc: Partial<{ [k in keyof P]: OutputOf<P[k]> }>,
      idx: number,
    ): Eval<{ [k in keyof P]: OutputOf<P[k]> }> =>
      idx >= keys.length
        ? Eval.now(acc as { [k in keyof P]: OutputOf<P[k]> })
        : Eval.defer(() => safeEncode(xs[keys[idx]], a[keys[idx]])).flatMap(x =>
            loop({ ...acc, [keys[idx]]: x }, idx + 1),
          );

    return loop({}, 0);
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
  new SafeEncoder(a => {
    const keys = Object.keys(a);
    const loop = (
      acc: Record<string, O>,
      idx: number,
    ): Eval<Record<string, O>> =>
      idx >= keys.length
        ? Eval.now(acc)
        : Eval.defer(() => safeEncode(fa, a[keys[idx]])).flatMap(x =>
            loop({ ...acc, [(a as any)[keys[idx]]]: x }, idx + 1),
          );
    return loop({}, 0);
  });

export const product = <P extends Encoder<unknown, unknown>[]>(
  ...xs: P
): Encoder<
  { [k in keyof P]: OutputOf<P[k]> },
  { [k in keyof P]: TypeOf<P[k]> }
> =>
  new SafeEncoder(as => {
    const loop = (
      acc: any[],
      idx: number,
    ): Eval<{ [k in keyof P]: OutputOf<P[k]> }> =>
      idx >= xs.length
        ? Eval.now(acc as { [k in keyof P]: OutputOf<P[k]> })
        : Eval.defer(() => safeEncode(xs[idx], as[idx])).flatMap(x =>
            loop([...acc, x], idx + 1),
          );
    return loop([], 0);
  });

export const sum =
  <T extends string>(tag: T) =>
  <P extends Record<string, Encoder<any, any>>>(
    xs: P,
  ): Encoder<OutputOf<P[keyof P]>, TypeOf<P[keyof P]>> =>
    new SafeEncoder(a => safeEncode(xs[a[tag]], a));

export const defer = <O, A>(thunk: () => Encoder<O, A>): Encoder<O, A> =>
  new SafeEncoder(a => safeEncode(thunk(), a));
