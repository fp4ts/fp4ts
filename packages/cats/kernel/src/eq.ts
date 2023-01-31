// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Base, Eval, instance, TyK, TyVar } from '@fp4ts/core';
import { arrayEq } from './instances/array';
import { function0Eq } from './instances/funciton';
import { recordEq } from './instances/record';
import { tupleEq } from './instances/tuple';

/**
 * @category Type Class
 */
export interface Eq<A> extends Base<A> {
  readonly equals: (lhs: A, rhs: A) => boolean;
  readonly notEquals: (lhs: A, rhs: A) => boolean;
}

export type EqRequirements<A> = Pick<Eq<A>, 'equals'> & Partial<Eq<A>>;
export const Eq = Object.freeze({
  of: <A>(E: EqRequirements<A>): Eq<A> =>
    instance({
      notEquals: (a, b) => !E.equals(a, b),
      ...E,
    }),

  by: <A, B>(E: Eq<B>, f: (a: A) => B): Eq<A> =>
    Eq.of<A>({
      equals: (a, b) => E.equals(f(a), f(b)),
    }),

  fromUniversalEquals: <A>(): Eq<A> =>
    Eq.of({
      equals: (lhs, rhs) => lhs === rhs,
      notEquals: (lhs, rhs) => lhs !== rhs,
    }),

  get void(): Eq<void> {
    return Eq.of({ equals: () => true });
  },

  get never(): Eq<never> {
    return Eq.of({ equals: () => false });
  },

  Error: {
    get allEqual(): Eq<Error> {
      return Eq.of({ equals: () => true });
    },
    get strict(): Eq<Error> {
      return Eq.of({
        equals: (lhs, rhs) => {
          if (lhs === rhs) return true;
          if (lhs.constructor.prototype !== rhs.constructor.prototype)
            return false;
          if (lhs.message !== rhs.message) return false;
          return true;
        },
      });
    },
  },

  tuple: <A extends unknown[]>(...es: { [k in keyof A]: Eq<A[k]> }): Eq<A> =>
    tupleEq<A>(es),

  // eslint-disable-next-line @typescript-eslint/ban-types
  struct<A extends {}>(es: { [k in keyof A]: Eq<A[k]> }): Eq<A> {
    return Eq.of({
      equals: (xs, ys) => {
        for (const k in es) {
          if (!es[k].equals(xs[k], ys[k])) return false;
        }
        return true;
      },
    });
  },

  Eval: <A>(A: Eq<A>): Eq<Eval<A>> => Eq.by(A, e => e.value),

  Array: <A>(A: Eq<A>): Eq<A[]> => arrayEq(A),

  Record: <A, K extends symbol | number | string = string>(
    E: Eq<A>,
  ): Eq<Record<K, A>> => recordEq(E),

  Function0: <A>(E: Eq<A>): Eq<() => A> => function0Eq(E),
});

// -- HKT

export interface EqF extends TyK<[unknown]> {
  [$type]: Eq<TyVar<this, 0>>;
}
