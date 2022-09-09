// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, instance, Lazy } from '@fp4ts/core';

/**
 * @category Type Class
 */
export interface Semigroup<A> extends Base<A> {
  dual(): Semigroup<A>;

  combine(y: Lazy<A>): (x: A) => A;
  combine_(x: A, y: Lazy<A>): A;
}

export type SemigroupRequirements<A> = Pick<Semigroup<A>, 'combine_'> &
  Partial<Semigroup<A>>;
export const Semigroup = Object.freeze({
  of: <A>(S: SemigroupRequirements<A>): Semigroup<A> => {
    const self: Semigroup<A> = instance({
      dual: () =>
        Semigroup.of({
          dual: () => self,
          combine: y => x => S.combine_(y(), () => x),
          combine_: (x, y) => S.combine_(y(), () => x),
        }),

      combine: y => x => S.combine_(x, y),
      ...S,
    });
    return self;
  },

  get string(): Semigroup<string> {
    return Semigroup.of({ combine_: (x, y) => x + y() });
  },

  get disjunction(): Semigroup<boolean> {
    return Semigroup.of({ combine_: (x, y) => x || y() });
  },

  get conjunction(): Semigroup<boolean> {
    return Semigroup.of({ combine_: (x, y) => x && y() });
  },

  get addition(): Semigroup<number> {
    return Semigroup.of({ combine_: (x, y) => x + y() });
  },

  get product(): Semigroup<number> {
    return Semigroup.of({ combine_: (x, y) => x * y() });
  },

  first<A>(): Semigroup<A> {
    return Semigroup.of({ combine_: (x, y) => x });
  },
});
