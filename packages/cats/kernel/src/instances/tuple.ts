// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '../eq';
import { Compare, Ord } from '../ord';

export const tupleEq = <A extends unknown[]>(es: {
  [k in keyof A]: Eq<A[k]>;
}): Eq<A> => Eq.of({ equals: (xs, ys) => equals(xs, ys, es) });

function equals<A extends unknown[]>(
  xs: A,
  ys: A,
  es: { [k in keyof A]: Eq<A[k]> },
): boolean {
  for (let i = 0, len = es.length; i < len; i++) {
    if (!es[i].equals(xs[i], ys[i])) return false;
  }
  return true;
}

export const tupleOrd = <A extends unknown[]>(os: {
  [k in keyof A]: Ord<A[k]>;
}): Ord<A> =>
  Ord.of({
    compare: (xs, ys) => compare(xs, ys, os),
    equals: (xs, ys) => equals(xs, ys, os),
  });

function compare<A extends unknown[]>(
  xs: A,
  ys: A,
  os: { [k in keyof A]: Ord<A[k]> },
): Compare {
  for (let i = 0, len = os.length; i < len; i++) {
    const c = os[i].compare(xs[i], ys[i]);
    if (c !== Compare.EQ) return c;
  }
  return Compare.EQ;
}
