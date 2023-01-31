// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, Eval, instance, lazy } from '@fp4ts/core';
import { arraySemigroup } from './instances/array';
import { conjunctionMonoid, disjunctionMonoid } from './instances/boolean';
import { function0Semigroup, function1Semigroup } from './instances/funciton';
import { additionMonoid, productMonoid } from './instances/number';
import { recordSemigroup } from './instances/record';

/**
 * @category Type Class
 */
export interface Semigroup<A> extends Base<A> {
  dual(): Semigroup<A>;

  combine(y: A): (x: A) => A;
  combine_(x: A, y: A): A;

  combineEval(y: Eval<A>): (x: A) => Eval<A>;
  combineEval_(x: A, ey: Eval<A>): Eval<A>;
}

export type SemigroupRequirements<A> = Pick<Semigroup<A>, 'combine_'> &
  Partial<Semigroup<A>>;
export const Semigroup = Object.freeze({
  of: <A>(S: SemigroupRequirements<A>): Semigroup<A> => {
    const self: Semigroup<A> = instance({
      dual: lazy(() =>
        Semigroup.of({
          dual: () => self,
          combine: y => x => self.combine_(y, x),
          combine_: (x, y) => self.combine_(y, x),
        }),
      ),

      combine: y => x => self.combine_(x, y),

      combineEval: ey => x => self.combineEval_(x, ey),
      combineEval_: (x, ey) => ey.map(y => self.combine_(x, y)),
      ...S,
    });
    return self;
  },

  get string(): Semigroup<string> {
    return Semigroup.of({ combine_: (x, y) => x + y });
  },

  get disjunction(): Semigroup<boolean> {
    return disjunctionMonoid();
  },

  get conjunction(): Semigroup<boolean> {
    return conjunctionMonoid();
  },

  get addition(): Semigroup<number> {
    return additionMonoid();
  },

  get product(): Semigroup<number> {
    return productMonoid();
  },

  Array: <A>(): Semigroup<A[]> => arraySemigroup(),

  Record: <A, K extends symbol | number | string = string>(
    S: Semigroup<A>,
  ): Semigroup<Record<K, A>> => recordSemigroup(S),

  Function0: <A>(S: Semigroup<A>): Semigroup<() => A> => function0Semigroup(S),
  Function1: <A, B>(S: Semigroup<B>): Semigroup<(a: A) => B> =>
    function1Semigroup(S),
});
