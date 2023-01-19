// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, instance } from '@fp4ts/core';
import { Semigroup } from './semigroup';

/**
 * @category Type Class
 */
export interface CommutativeSemigroup<A> extends Semigroup<A> {
  readonly _commutative: void;
  dual(): CommutativeSemigroup<A>;
}

export type CommutativeSemigroupRequirements<A> = Pick<
  CommutativeSemigroup<A>,
  'combine_'
> &
  Partial<CommutativeSemigroup<A>>;
export const CommutativeSemigroup = Object.freeze({
  of: <A>(S: CommutativeSemigroupRequirements<A>): CommutativeSemigroup<A> => {
    const self: CommutativeSemigroup<A> = instance({
      ...Semigroup.of(S),
      ...S,

      dual: () => self,
    });
    return self;
  },

  get disjunction(): CommutativeSemigroup<boolean> {
    return CommutativeSemigroup.of({
      combine_: (x, y) => x || y,
      combineEval_: (x, ey) => (x ? Eval.true : ey),
    });
  },

  get conjunction(): CommutativeSemigroup<boolean> {
    return CommutativeSemigroup.of({
      combine_: (x, y) => x && y,
      combineEval_: (x, ey) => (x ? ey : Eval.false),
    });
  },

  get addition(): CommutativeSemigroup<number> {
    return CommutativeSemigroup.of({ combine_: (x, y) => x + y });
  },

  get product(): CommutativeSemigroup<number> {
    return CommutativeSemigroup.of({ combine_: (x, y) => x * y });
  },
});
