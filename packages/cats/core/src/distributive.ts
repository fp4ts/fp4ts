// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, id, instance, Kind, TyK, TyVar } from '@fp4ts/core';
import { Functor, FunctorRequirements } from './functor';
import {
  function0Distributive,
  Function1F,
  Function0F,
  function1Distributive,
} from './instances/function';

/**
 * @category Type Class
 */
export interface Distributive<F> extends Functor<F> {
  distribute<G>(
    G: Functor<G>,
  ): <A, B>(
    f: (a: A) => Kind<F, [B]>,
  ) => (ga: Kind<G, [A]>) => Kind<F, [Kind<G, [B]>]>;
  distribute_<G>(
    G: Functor<G>,
  ): <A, B>(
    ga: Kind<G, [A]>,
    f: (a: A) => Kind<F, [B]>,
  ) => Kind<F, [Kind<G, [B]>]>;

  consequence<G>(
    G: Functor<G>,
  ): <A>(gfa: Kind<G, [Kind<F, [A]>]>) => Kind<F, [Kind<G, [A]>]>;
}

export type DistributiveRequirements<F> = Pick<Distributive<F>, 'distribute_'> &
  FunctorRequirements<F> &
  Partial<Distributive<F>>;
export const Distributive = Object.freeze({
  of: <F>(F: DistributiveRequirements<F>) => {
    const self: Distributive<F> = instance<Distributive<F>>({
      distribute: G => f => ga => self.distribute_(G)(ga, f),
      consequence: G => gfa => self.distribute_(G)(gfa, id),
      ...Functor.of(F),
      ...F,
    });
    return self;
  },

  get Function0(): Distributive<Function0F> {
    return function0Distributive();
  },

  Function1: <R>(): Distributive<$<Function1F, [R]>> => function1Distributive(),
});

// -- HKT

export interface DistributiveF extends TyK<[unknown]> {
  [$type]: Distributive<TyVar<this, 0>>;
}
