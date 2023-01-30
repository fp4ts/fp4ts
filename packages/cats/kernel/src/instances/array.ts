// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { cached, lazy } from '@fp4ts/core';
import { Eq } from '../eq';
import { Monoid } from '../monoid';
import { Compare, Ord } from '../ord';
import { Semigroup } from '../semigroup';

export const arrayEq = cached(
  <A>(E: Eq<A>): Eq<A[]> => Eq.of({ equals: (xs, ys) => equals(xs, ys, E) }),
);

function equals<A>(xs: A[], ys: A[], E: Eq<A>): boolean {
  if (xs === ys) return true;
  if (xs.length !== ys.length) return false;
  for (let i = 0, len = xs.length; i < len; i++) {
    if (!E.equals(xs[i], ys[i])) return false;
  }
  return true;
}

export const arrayOrd = cached(
  <A>(O: Ord<A>): Ord<A[]> =>
    Ord.of({
      compare: (xs, ys) => compare(xs, ys, O),
      equals: (xs, ys) => equals(xs, ys, O),
    }),
);

function compare<A>(xs: A[], ys: A[], O: Ord<A>): Compare {
  if (xs === ys) return Compare.EQ;
  const sz = Math.min(xs.length, ys.length);
  for (let i = 0; i < sz; i++) {
    const c = O.compare(xs[i], ys[i]);
    if (c !== Compare.EQ) return c;
  }
  return Ord.fromUniversalCompare<number>().compare(xs.length, ys.length);
}

export const arraySemigroup = lazy(<A>() =>
  Semigroup.of<A[]>({
    combine_: (xs, ys) => xs.concat(ys),
    combineEval_: (xs, eys) =>
      xs.length === 0 ? eys : eys.map(ys => xs.concat(ys)),
  }),
) as <A>() => Semigroup<A[]>;

export const arrayMonoid = lazy(<A>() => {
  const S = arraySemigroup<A>();
  return Monoid.of<A[]>({
    combine_: S.combine_,
    combineEval_: S.combineEval_,
    empty: [],
  });
}) as <A>() => Monoid<A[]>;
