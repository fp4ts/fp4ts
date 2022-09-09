// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance } from '@fp4ts/core';
import { Semigroup, SemigroupRequirements } from './semigroup';

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

      dual: () =>
        Monoid.of({
          dual: () => self,
          empty: self.empty,
          combine: y => x => self.combine_(y(), () => x),
          combine_: (x, y) => self.combine_(y(), () => x),
        }),
    });
    return self;
  },

  get string(): Monoid<string> {
    return Monoid.of({ combine_: Semigroup.string.combine_, empty: '' });
  },

  get disjunction(): Monoid<boolean> {
    return Monoid.of({
      combine_: Semigroup.disjunction.combine_,
      empty: false,
    });
  },

  get conjunction(): Monoid<boolean> {
    return Monoid.of({ combine_: Semigroup.conjunction.combine_, empty: true });
  },

  get addition(): Monoid<number> {
    return Monoid.of({ combine_: Semigroup.addition.combine_, empty: 0 });
  },

  get product(): Monoid<number> {
    return Monoid.of({ combine_: Semigroup.product.combine_, empty: 1 });
  },
});
