// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, instance } from '@fp4ts/core';
import { CommutativeSemigroup } from './commutative-semigroup';
import { Monoid } from './monoid';
import { SemigroupRequirements } from './semigroup';

/**
 * @category Type Class
 */
export interface CommutativeMonoid<M>
  extends CommutativeSemigroup<M>,
    Monoid<M> {
  readonly _commutative: void;
  dual(): CommutativeMonoid<M>;
}

export type CommutativeMonoidRequirements<M> = Pick<
  CommutativeMonoid<M>,
  'empty'
> &
  Omit<SemigroupRequirements<M>, 'dual'> &
  Partial<CommutativeMonoid<M>>;
export const CommutativeMonoid = Object.freeze({
  of: <A>(M: CommutativeMonoidRequirements<A>): CommutativeMonoid<A> => {
    const self: CommutativeMonoid<A> = instance({
      ...Monoid.of(M),
      ...M,

      dual: () => self,
    });
    return self;
  },

  get disjunction(): CommutativeMonoid<boolean> {
    return CommutativeMonoid.of({
      combine_: CommutativeSemigroup.disjunction.combine_,
      combineEval_: CommutativeSemigroup.disjunction.combineEval_,
      empty: false,
    });
  },

  get conjunction(): CommutativeMonoid<boolean> {
    return CommutativeMonoid.of({
      combine_: CommutativeSemigroup.conjunction.combine_,
      combineEval_: CommutativeSemigroup.conjunction.combineEval_,
      empty: true,
    });
  },

  get addition(): CommutativeMonoid<number> {
    return CommutativeMonoid.of({
      combine_: CommutativeSemigroup.addition.combine_,
      empty: 0,
    });
  },

  get product(): CommutativeMonoid<number> {
    return CommutativeMonoid.of({
      combine_: CommutativeSemigroup.product.combine_,
      empty: 1,
    });
  },

  get void(): CommutativeMonoid<void> {
    return CommutativeMonoid.of({
      combine_: () => {},
      combineEval_: () => Eval.void,
      empty: undefined,
    });
  },
});
