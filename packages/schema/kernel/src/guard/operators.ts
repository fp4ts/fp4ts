// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Guard } from './algebra';

export const nullable = <A>(g: Guard<unknown, A>): Guard<unknown, A | null> =>
  new Guard((x: unknown): x is A | null => x === null || g.test(x));

export const refine: <A, B extends A>(
  refinement: (a: A) => a is B,
) => (ga: Guard<unknown, A>) => Guard<unknown, B> = refinement => ga =>
  refine_(ga, refinement);

export const intersection: <B>(
  gb: Guard<unknown, B>,
) => <A>(ga: Guard<unknown, A>) => Guard<unknown, A & B> = gb => ga =>
  intersection_(ga, gb);

export const union: <B>(
  gb: Guard<unknown, B>,
) => <A>(ga: Guard<unknown, A>) => Guard<unknown, A | B> = gb => ga =>
  union_(ga, gb);

export function nonEmpty(g: Guard<unknown, string>): Guard<unknown, string>;
export function nonEmpty<A>(g: Guard<unknown, A[]>): Guard<unknown, A[]>;
export function nonEmpty(g: Guard<unknown, any>): Guard<unknown, any> {
  return new Guard((x): x is any => g.test(x) && x.length > 0);
}

export const min: (
  n: number,
) => (gn: Guard<unknown, number>) => Guard<unknown, number> = n => gn =>
  min_(gn, n);

export const minExclusive: (
  n: number,
) => (gn: Guard<unknown, number>) => Guard<unknown, number> = n => gn =>
  minExclusive_(gn, n);

export const max: (
  n: number,
) => (gn: Guard<unknown, number>) => Guard<unknown, number> = n => gn =>
  max_(gn, n);

export const maxExclusive: (
  n: number,
) => (gn: Guard<unknown, number>) => Guard<unknown, number> = n => gn =>
  maxExclusive_(gn, n);

export const minLength: (
  n: number,
) => ((gs: Guard<unknown, string>) => Guard<unknown, string>) &
  (<A>(gas: Guard<unknown, A[]>) => Guard<unknown, A[]>) =
  n =>
  (g: Guard<unknown, any>): Guard<unknown, any> =>
    minLength_(g, n);

export const maxLength: (
  n: number,
) => ((gs: Guard<unknown, string>) => Guard<unknown, string>) &
  (<A>(gas: Guard<unknown, A[]>) => Guard<unknown, A[]>) =
  n =>
  (g: Guard<unknown, any>): Guard<unknown, any> =>
    maxLength_(g, n);

export const andThen: <I, A extends I, B extends A>(
  gb: Guard<A, B>,
) => (ga: Guard<I, A>) => Guard<I, B> = gb => ga => andThen_(ga, gb);

export const compose: <I, A extends I, B extends A>(
  ga: Guard<I, A>,
) => (gb: Guard<A, B>) => Guard<I, B> = ga => gb => compose_(gb, ga);

// -- Point-ful operators

export const refine_ = <A, B extends A>(
  ga: Guard<unknown, A>,
  refinement: (a: A) => a is B,
): Guard<unknown, B> =>
  new Guard((x: unknown): x is B => ga.test(x) && refinement(x));

export const intersection_ = <A, B>(
  ga: Guard<unknown, A>,
  gb: Guard<unknown, B>,
): Guard<unknown, A & B> =>
  new Guard((x: unknown): x is A & B => ga.test(x) && gb.test(x));

export const union_ = <A, B>(
  ga: Guard<unknown, A>,
  gb: Guard<unknown, B>,
): Guard<unknown, A | B> =>
  new Guard((x: unknown): x is A | B => ga.test(x) || gb.test(x));

export const min_ = (
  gn: Guard<unknown, number>,
  n: number,
): Guard<unknown, number> =>
  new Guard((x): x is number => gn.test(x) && x >= n);

export const minExclusive_ = (
  gn: Guard<unknown, number>,
  n: number,
): Guard<unknown, number> => new Guard((x): x is number => gn.test(x) && x > n);

export const max_ = (
  gn: Guard<unknown, number>,
  n: number,
): Guard<unknown, number> =>
  new Guard((x): x is number => gn.test(x) && x <= n);

export const maxExclusive_ = (
  gn: Guard<unknown, number>,
  n: number,
): Guard<unknown, number> => new Guard((x): x is number => gn.test(x) && x < n);

export function minLength_(
  g: Guard<unknown, string>,
  n: number,
): Guard<unknown, string>;
export function minLength_<A>(
  g: Guard<unknown, A[]>,
  n: number,
): Guard<unknown, A[]>;
export function minLength_(
  g: Guard<unknown, any>,
  n: number,
): Guard<unknown, any> {
  return new Guard((x): x is any => g.test(x) && x.length >= n);
}

export function maxLength_(
  g: Guard<unknown, string>,
  n: number,
): Guard<unknown, string>;
export function maxLength_<A>(
  g: Guard<unknown, A[]>,
  n: number,
): Guard<unknown, A[]>;
export function maxLength_(
  g: Guard<unknown, any>,
  n: number,
): Guard<unknown, any> {
  return new Guard((x): x is any => g.test(x) && x.length <= n);
}

export const andThen_ = <I, A extends I, B extends A>(
  ga: Guard<I, A>,
  gb: Guard<A, B>,
): Guard<I, B> => new Guard((i: I): i is B => ga.test(i) && gb.test(i));

export const compose_ = <I, A extends I, B extends A>(
  gb: Guard<A, B>,
  ga: Guard<I, A>,
): Guard<I, B> => new Guard((i: I): i is B => ga.test(i) && gb.test(i));
