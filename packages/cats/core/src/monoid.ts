// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { None, Option } from './data';
import { Semigroup, SemigroupRequirements } from './semigroup';

/**
 * @category Type Class
 */
export interface Monoid<M> extends Semigroup<M> {
  readonly empty: M;
}

export type MonoidRequirements<M> = Pick<Monoid<M>, 'empty'> &
  SemigroupRequirements<M> &
  Partial<Monoid<M>>;
export const Monoid = Object.freeze({
  of: <M>(M: MonoidRequirements<M>): Monoid<M> => ({
    ...Semigroup.of(M),
    ...M,
  }),

  get string(): Monoid<string> {
    return Monoid.of({ ...Semigroup.string, empty: '' });
  },

  firstOption<A>(): Monoid<Option<A>> {
    return Monoid.of<Option<A>>({
      combine_: (x, y) => x['<|>'](y),
      empty: None,
    });
  },

  lastOption<A>(): Monoid<Option<A>> {
    return Monoid.of<Option<A>>({
      combine_: (x, y) => y()['<|>'](() => x),
      empty: None,
    });
  },

  get disjunction(): Monoid<boolean> {
    return { ...Semigroup.disjunction, empty: false };
  },

  get conjunction(): Monoid<boolean> {
    return { ...Semigroup.conjunction, empty: true };
  },

  get addition(): Monoid<number> {
    return { ...Semigroup.addition, empty: 0 };
  },

  get product(): Monoid<number> {
    return { ...Semigroup.product, empty: 1 };
  },
});
