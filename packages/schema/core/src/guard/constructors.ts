// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */

import { Eval } from '@fp4ts/core';
import { Literal } from '@fp4ts/schema-kernel/src/literal';
import { Guard, SafeGuard, safeTest } from './algebra';

export const identity = <A>(): Guard<A, A> => new Guard((_): _ is A => true);

export const empty: Guard<unknown, never> = new Guard((_): _ is never => false);

export const literal = <A extends [Literal, ...Literal[]]>(
  ...xs: A
): Guard<unknown, A[number]> =>
  new Guard((u: unknown): u is A[number] => xs.some(x => x == u));

export const boolean: Guard<unknown, boolean> = new Guard(
  (u: unknown): u is boolean => typeof u === 'boolean',
);

export const number: Guard<unknown, number> = new Guard(
  (u: unknown): u is number => typeof u === 'number',
);

export const string: Guard<unknown, string> = new Guard(
  (u: unknown): u is string => typeof u === 'string',
);

export const nullGuard: Guard<unknown, null> = new Guard(
  (u: unknown): u is null => typeof u === null,
);

export const array = <A>(ga: Guard<unknown, A>): Guard<unknown, A[]> =>
  new SafeGuard((xs: unknown): Eval<boolean> => {
    if (!Array.isArray(xs)) return Eval.false;

    const loop = (idx: number): Eval<boolean> =>
      idx >= xs.length
        ? Eval.true
        : Eval.defer(() =>
            safeTest(ga, xs[idx]).flatMap(r =>
              r ? loop(idx + 1) : Eval.false,
            ),
          );

    return loop(0);
  });

export const struct = <A extends {}>(ga: {
  [k in keyof A]: Guard<unknown, A[k]>;
}): Guard<unknown, A> =>
  new SafeGuard((xs: unknown): Eval<boolean> => {
    if (xs === null || typeof xs !== 'object' || Array.isArray(xs))
      return Eval.false;

    const keys = Object.keys(ga) as (keyof A)[];
    const loop = (idx: number): Eval<boolean> => {
      if (idx >= keys.length) return Eval.true;
      const k = keys[idx];
      if (!(k in xs)) return Eval.false;

      return Eval.defer(() =>
        safeTest(ga[k], (xs as any)[k]).flatMap(r =>
          r ? loop(idx + 1) : Eval.false,
        ),
      );
    };

    return loop(0);
  });

export const partial = <A>(ga: { [k in keyof A]: Guard<unknown, A[k]> }): Guard<
  unknown,
  Partial<A>
> =>
  new Guard((xs: unknown): xs is Partial<A> => {
    if (xs == null || typeof xs !== 'object' || Array.isArray(xs)) return false;

    const ys = xs as Record<string, unknown>;

    for (const k in ga) {
      if (ys[k] !== undefined && !ga[k].test(ys[k])) return false;
    }

    return true;
  });

export const record = <A>(
  ga: Guard<unknown, A>,
): Guard<unknown, Record<string, A>> =>
  new SafeGuard((xs: unknown): Eval<boolean> => {
    if (xs == null || typeof xs !== 'object' || Array.isArray(xs))
      return Eval.false;

    const keys = Object.keys(xs);
    const loop = (idx: number): Eval<boolean> =>
      idx >= keys.length
        ? Eval.true
        : Eval.defer(() =>
            safeTest(ga, (xs as any)[keys[idx]]).flatMap(r =>
              r ? loop(idx + 1) : Eval.false,
            ),
          );

    return loop(0);
  });

export const product = <A extends unknown[]>(
  ...ga: { [k in keyof A]: Guard<unknown, A[k]> }
): Guard<unknown, A> =>
  new SafeGuard((xs: unknown): Eval<boolean> => {
    if (!Array.isArray(xs) || xs.length !== ga.length) return Eval.false;
    const loop = (idx: number): Eval<boolean> =>
      idx >= ga.length
        ? Eval.true
        : Eval.defer(() =>
            safeTest(ga[idx], xs[idx]).flatMap(r =>
              r ? loop(idx + 1) : Eval.false,
            ),
          );

    return loop(0);
  });

export const sum =
  <T extends string>(tag: T) =>
  <A extends {}>(ga: {
    [k in keyof A]: Guard<unknown, A[k] & Record<T, k>>;
  }): Guard<unknown, A[keyof A]> =>
    new SafeGuard((x: unknown): Eval<boolean> => {
      if (x === null || typeof x !== 'object' || Array.isArray(x))
        return Eval.false;

      const y = x as Record<string, unknown>;
      const k = y[tag] as keyof A;
      if (!ga[k]) return Eval.false;
      return safeTest(ga[k], y);
    });

export const defer = <A>(thunk: () => Guard<unknown, A>): Guard<unknown, A> =>
  new SafeGuard((x: unknown): Eval<boolean> => safeTest(thunk(), x));
