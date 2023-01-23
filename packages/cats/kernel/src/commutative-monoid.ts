// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, instance } from '@fp4ts/core';
import { CommutativeSemigroup } from './commutative-semigroup';
import { Monoid } from './monoid';
import { SemigroupRequirements } from './semigroup';
import { conjunctionMonoid, disjunctionMonoid } from './instances/boolean';
import { additionMonoid, productMonoid } from './instances/number';
import { recordCommutativeMonoid } from './instances/record';

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
    return disjunctionMonoid();
  },

  get conjunction(): CommutativeMonoid<boolean> {
    return conjunctionMonoid();
  },

  get addition(): CommutativeMonoid<number> {
    return additionMonoid();
  },

  get product(): CommutativeMonoid<number> {
    return productMonoid();
  },

  get void(): CommutativeMonoid<void> {
    return CommutativeMonoid.of({
      combine_: () => {},
      combineEval_: () => Eval.void,
      empty: undefined,
    });
  },

  Record: <A>(
    S: CommutativeSemigroup<A>,
  ): CommutativeMonoid<Record<string, A>> => recordCommutativeMonoid(S),
});
