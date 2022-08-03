// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, PrimitiveType, TyK, TyVar } from '@fp4ts/core';
import { Eq } from './eq';

export enum Compare {
  LT,
  GT,
  EQ,
}

/**
 * @category Type Class
 */
export interface Ord<A> extends Eq<A> {
  readonly compare: (lhs: A, rhs: A) => Compare;
  readonly lt: (lhs: A, rhs: A) => boolean;
  readonly lte: (lhs: A, rhs: A) => boolean;
  readonly gt: (lhs: A, rhs: A) => boolean;
  readonly gte: (lhs: A, rhs: A) => boolean;
}

type OrdRequirements<A> = Pick<Ord<A>, 'compare'> & Partial<Ord<A>>;

export const Ord = Object.freeze({
  of: <A>(O: OrdRequirements<A>): Ord<A> => {
    const self: Ord<A> = {
      lt: (lhs, rhs) => self.compare(lhs, rhs) === Compare.LT,
      lte: (lhs, rhs) => self.equals(lhs, rhs) || self.lt(lhs, rhs),
      gt: (lhs, rhs) => self.compare(lhs, rhs) === Compare.GT,
      gte: (lhs, rhs) => self.equals(lhs, rhs) || self.gt(lhs, rhs),

      ...Eq.of({
        equals:
          O.equals ?? ((lhs, rhs) => self.compare(lhs, rhs) === Compare.EQ),
        ...O,
      }),
      ...O,
    };
    return self;
  },

  by: <A, B>(O: Ord<A>, f: (b: B) => A): Ord<B> =>
    Ord.of({ compare: (lhs, rhs) => O.compare(f(lhs), f(rhs)) }),

  tuple2: <A, B>(ordA: Ord<A>, ordB: Ord<B>): Ord<[A, B]> =>
    Ord.of({
      compare: (x, y) => {
        switch (ordA.compare(x[0], y[0])) {
          case Compare.LT:
            return Compare.LT;
          case Compare.GT:
            return Compare.GT;
          case Compare.EQ:
            return ordB.compare(x[1], y[1]);
        }
      },
    }),

  primitive: {
    ...Eq.primitive,
    compare: (lhs: PrimitiveType, rhs: PrimitiveType) =>
      lhs < rhs ? Compare.LT : lhs > rhs ? Compare.GT : Compare.EQ,
    lt: (lhs: PrimitiveType, rhs: PrimitiveType) => lhs < rhs,
    lte: (lhs: PrimitiveType, rhs: PrimitiveType) => lhs <= rhs,
    gt: (lhs: PrimitiveType, rhs: PrimitiveType) => lhs > rhs,
    gte: (lhs: PrimitiveType, rhs: PrimitiveType) => lhs >= rhs,
  },
});

// -- HKT

export interface OrdF extends TyK<[unknown]> {
  [$type]: Ord<TyVar<this, 0>>;
}
