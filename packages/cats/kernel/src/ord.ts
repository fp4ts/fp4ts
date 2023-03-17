// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, lazy } from '@fp4ts/core';
import { Eq } from './eq';
import { arrayOrd } from './instances/array';
import { function0Ord } from './instances/funciton';
import { tupleOrd } from './instances/tuple';

const LT = 0;
type LT = typeof LT;
const EQ = 1;
type EQ = typeof EQ;
const GT = 2;
type GT = typeof GT;

export const Compare = Object.freeze({
  LT,
  EQ,
  GT,
});
export type Compare = (typeof Compare)[keyof typeof Compare];

/**
 * @category Type Class
 */
export interface Ord<A> extends Eq<A> {
  readonly compare: (lhs: A, rhs: A) => Compare;
  readonly lt: (lhs: A, rhs: A) => boolean;
  readonly lte: (lhs: A, rhs: A) => boolean;
  readonly gt: (lhs: A, rhs: A) => boolean;
  readonly gte: (lhs: A, rhs: A) => boolean;

  readonly max: (lhs: A, rhs: A) => A;
  readonly min: (lhs: A, rhs: A) => A;
}

type OrdRequirements<A> = Pick<Ord<A>, 'compare'> & Partial<Ord<A>>;

export const Ord = Object.freeze({
  of: <A>(O: OrdRequirements<A>): Ord<A> => {
    const self: Ord<A> = instance({
      lt: (lhs, rhs) => self.compare(lhs, rhs) === Compare.LT,
      lte: (lhs, rhs) => self.compare(lhs, rhs) !== Compare.GT,
      gt: (lhs, rhs) => self.compare(lhs, rhs) === Compare.GT,
      gte: (lhs, rhs) => self.compare(lhs, rhs) !== Compare.LT,
      equals: (lhs, rhs) => self.compare(lhs, rhs) === Compare.EQ,
      notEquals: (lhs, rhs) => self.compare(lhs, rhs) !== Compare.EQ,

      max: (lhs: A, rhs: A) => (self.lte(lhs, rhs) ? rhs : lhs),
      min: (lhs: A, rhs: A) => (self.lte(lhs, rhs) ? lhs : rhs),

      ...O,
    });
    return self;
  },

  by: <A, B>(O: Ord<A>, f: (b: B) => A): Ord<B> =>
    Ord.of({ compare: (lhs, rhs) => O.compare(f(lhs), f(rhs)) }),

  tuple: <A extends unknown[]>(...os: { [k in keyof A]: Ord<A[k]> }): Ord<A> =>
    tupleOrd<A>(os),

  fromUniversalCompare: lazy(
    <A>(): Ord<A> =>
      instance({
        ...Eq.fromUniversalEquals(),
        compare: (lhs: A, rhs: A) =>
          lhs < rhs ? Compare.LT : lhs > rhs ? Compare.GT : Compare.EQ,
        lt: (lhs: A, rhs: A) => lhs < rhs,
        lte: (lhs: A, rhs: A) => lhs <= rhs,
        gt: (lhs: A, rhs: A) => lhs > rhs,
        gte: (lhs: A, rhs: A) => lhs >= rhs,

        max: (lhs: A, rhs: A) => (lhs <= rhs ? rhs : lhs),
        min: (lhs: A, rhs: A) => (lhs <= rhs ? lhs : rhs),
      }),
  ) as <A>() => Ord<A>,

  Array: <A>(O: Ord<A>): Ord<A[]> => arrayOrd(O),

  Function0: <A>(O: Ord<A>): Ord<() => A> => function0Ord(O),
});
