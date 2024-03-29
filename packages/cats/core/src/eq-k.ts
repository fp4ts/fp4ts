// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, instance, Base, Kind, TyK, TyVar, EvalF } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { FunctionK } from './function-k';
import { ComposedEqK } from './composed';
import { ArrayF, arrayEqK } from './instances/array';
import { function0EqK, Function0F } from './instances/function';
import { evalEqK } from './instances/eval';

export interface EqK<F> extends Base<F> {
  liftEq<A>(E: Eq<A>): Eq<Kind<F, [A]>>;

  lift<A>(p: (l: A, r: A) => boolean): Eq<Kind<F, [A]>>;
}

export type EqKRequirements<F> = Pick<EqK<F>, 'liftEq'> & Partial<EqK<F>>;
export const EqK = Object.freeze({
  of: <F>(F: EqKRequirements<F>): EqK<F> => {
    const self: EqK<F> = instance({
      lift: p => self.liftEq(Eq.of({ equals: p })),
      ...F,
    });
    return self;
  },

  compose: <F, G>(F: EqK<F>, G: EqK<G>): ComposedEqK<F, G> =>
    ComposedEqK.of(F, G),

  by: <F, G>(fa: EqK<F>, g: FunctionK<G, F>): EqK<G> =>
    EqK.of({
      liftEq: <A>(E: Eq<A>) =>
        Eq.by<Kind<G, [A]>, Kind<F, [A]>>(fa.liftEq(E), g),
    }),

  get Eval(): EqK<EvalF> {
    return evalEqK();
  },

  get Array(): EqK<ArrayF> {
    return arrayEqK();
  },

  get Function0(): EqK<Function0F> {
    return function0EqK();
  },
});

// -- HKT

export interface EqKF extends TyK<[unknown]> {
  [$type]: EqK<TyVar<this, 0>>;
}
