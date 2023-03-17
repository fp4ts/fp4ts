// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance } from '@fp4ts/core';
import { Semigroup } from './semigroup';
import { conjunctionMonoid, disjunctionMonoid } from './instances/boolean';
import { additionMonoid, productMonoid } from './instances/number';
import { recordCommutativeSemigroup } from './instances/record';
import {
  function0CommutativeSemigroup,
  function1CommutativeSemigroup,
} from './instances/function';

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
    return disjunctionMonoid();
  },

  get conjunction(): CommutativeSemigroup<boolean> {
    return conjunctionMonoid();
  },

  get addition(): CommutativeSemigroup<number> {
    return additionMonoid();
  },

  get product(): CommutativeSemigroup<number> {
    return productMonoid();
  },

  Record: <A, K extends symbol | number | string = string>(
    S: CommutativeSemigroup<A>,
  ): CommutativeSemigroup<Record<K, A>> => recordCommutativeSemigroup(S),

  Function0: <A>(S: CommutativeSemigroup<A>): CommutativeSemigroup<() => A> =>
    function0CommutativeSemigroup(S),

  Function1: <A, B>(
    S: CommutativeSemigroup<B>,
  ): CommutativeSemigroup<(a: A) => B> => function1CommutativeSemigroup(S),
});
