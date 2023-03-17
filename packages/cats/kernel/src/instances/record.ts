// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { throwError } from '@fp4ts/core';
import { CommutativeMonoid } from '../commutative-monoid';
import { CommutativeSemigroup } from '../commutative-semigroup';
import { Eq } from '../eq';
import { Monoid } from '../monoid';
import { Semigroup } from '../semigroup';

export const recordEq = <K extends symbol | string | number, A>(
  E: Eq<A>,
): Eq<Record<K, A>> => Eq.of({ equals: (xs, ys) => equals(xs, ys, E) });

function equals<K extends symbol | string | number, A>(
  xs: Record<K, A>,
  ys: Record<K, A>,
  E: Eq<A>,
): boolean {
  for (const k in xs) {
    if (!(k in ys)) return false;
  }
  for (const k in ys) {
    if (!(k in xs)) return false;
    if (!E.equals(xs[k], ys[k])) return false;
  }
  return true;
}

export const recordSemigroup = <K extends symbol | number | string, A>(
  S: Semigroup<A>,
): Semigroup<Record<K, A>> =>
  Semigroup.of({ combine_: (xs, ys) => combine(xs, ys, S) });

export const recordCommutativeSemigroup = <
  K extends symbol | number | string,
  A,
>(
  S: CommutativeSemigroup<A>,
): CommutativeSemigroup<Record<K, A>> =>
  CommutativeSemigroup.of({ combine_: (xs, ys) => combine(xs, ys, S) });

function combine<K extends symbol | number | string, A>(
  xs: Record<K, A>,
  ys: Record<K, A>,
  A: Semigroup<A>,
): Record<K, A> {
  const zs: Record<K, A> = { ...xs, ...ys };
  for (const k in ys) {
    if (xs.hasOwnProperty(k) && ys.hasOwnProperty(k)) {
      zs[k] = A.combine_(xs[k], ys[k]);
    }
  }
  return zs;
}

export const recordMonoid = <A>(S: Semigroup<A>): Monoid<Record<string, A>> =>
  Monoid.of({
    combine_: (xs, ys) => combine(xs, ys, S),
    empty: {},
  });

export const recordCommutativeMonoid = <A>(
  S: CommutativeSemigroup<A>,
): CommutativeMonoid<Record<string, A>> =>
  CommutativeMonoid.of({ combine_: (xs, ys) => combine(xs, ys, S), empty: {} });
