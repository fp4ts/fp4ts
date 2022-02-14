// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */

import { Literal } from '@fp4ts/schema-kernel/src/literal';
import { Guard } from './algebra';

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
  new Guard(
    (xs: unknown): xs is A[] => Array.isArray(xs) && xs.every(x => ga.test(x)),
  );

export const struct = <A extends {}>(ga: {
  [k in keyof A]: Guard<unknown, A[k]>;
}): Guard<unknown, A> =>
  new Guard((xs: unknown): xs is A => {
    if (xs === null || typeof xs !== 'object' || Array.isArray(xs))
      return false;

    const ys = xs as Record<string, unknown>;

    for (const k in ga) {
      if (!(k in xs) || !ga[k].test(ys[k])) return false;
    }

    return true;
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
  new Guard((xs: unknown): xs is Record<string, A> => {
    if (xs == null || typeof xs !== 'object' || Array.isArray(xs)) return false;

    return Object.values(xs).every(x => ga.test(x));
  });

export const product = <A extends unknown[]>(
  ...ga: { [k in keyof A]: Guard<unknown, A[k]> }
): Guard<unknown, A> =>
  new Guard(
    (xs: unknown): xs is A =>
      Array.isArray(xs) &&
      xs.length === ga.length &&
      xs.every((x, i) => ga[i].test(x)),
  );

export const sum =
  <T extends string>(tag: T) =>
  <A extends {}>(ga: {
    [k in keyof A]: Guard<unknown, A[k] & Record<T, k>>;
  }): Guard<unknown, A[keyof A]> =>
    new Guard((x: unknown): x is A[keyof A] => {
      if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;

      const y = x as Record<string, unknown>;
      const k = y[tag] as keyof A;
      return ga[k]?.test(y) ?? false;
    });

export const defer = <A>(thunk: () => Guard<unknown, A>): Guard<unknown, A> =>
  new Guard((x: unknown): x is A => thunk().test(x));
