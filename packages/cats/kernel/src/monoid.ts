// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, instance, lazy, throwError } from '@fp4ts/core';
import { arrayMonoid } from './instances/array';
import { Semigroup, SemigroupRequirements } from './semigroup';
import { conjunctionMonoid, disjunctionMonoid } from './instances/boolean';
import { additionMonoid, productMonoid } from './instances/number';
import { recordMonoid } from './instances/record';
import {
  endoEvalMonoid,
  endoMonoid,
  function0Monoid,
  function1Monoid,
} from './instances/funciton';

/**
 * @category Type Class
 */
export interface Monoid<A> extends Semigroup<A> {
  readonly empty: A;
  dual(): Monoid<A>;
}

export type MonoidRequirements<A> = Pick<Monoid<A>, 'empty'> &
  Omit<SemigroupRequirements<A>, 'dual'> &
  Partial<Monoid<A>>;
export const Monoid = Object.freeze({
  of: <A>(M: MonoidRequirements<A>): Monoid<A> => {
    const self: Monoid<A> = instance({
      ...Semigroup.of(M),
      ...M,

      dual: lazy(() =>
        Monoid.of({
          dual: () => self,
          empty: self.empty,
          combine: y => x => self.combine_(y, x),
          combine_: (x, y) => self.combine_(y, x),
        }),
      ),
    });
    return self;
  },

  get string(): Monoid<string> {
    return Monoid.of({
      combine_: Semigroup.string.combine_,
      combineN_: (x, n) =>
        n <= 0
          ? throwError(new Error('Semigroup.combineN_: n must be >0'))
          : x.repeat(n),
      empty: '',
    });
  },

  get disjunction(): Monoid<boolean> {
    return disjunctionMonoid();
  },

  get conjunction(): Monoid<boolean> {
    return conjunctionMonoid();
  },

  get addition(): Monoid<number> {
    return additionMonoid();
  },

  get product(): Monoid<number> {
    return productMonoid();
  },

  Array: <A>(): Monoid<A[]> => arrayMonoid(),

  Record: <A>(S: Semigroup<A>): Monoid<Record<string, A>> => recordMonoid(S),

  Function0: <A>(M: Monoid<A>): Monoid<() => A> => function0Monoid(M),

  Function1: <A, B>(M: Monoid<B>): Monoid<(a: A) => B> => function1Monoid(M),

  Endo: <A>(): Monoid<(a: A) => A> => endoMonoid(),

  EndoEval: <A>(): Monoid<(a: Eval<A>) => Eval<A>> => endoEvalMonoid(),
});
