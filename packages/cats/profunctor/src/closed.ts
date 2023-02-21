// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Distributive, Function1F, Functor } from '@fp4ts/cats-core';
import { Profunctor, ProfunctorRequirements } from './profunctor';
import { function1Closed } from './instances/function';
import { cokleisliClosed } from './instances/cokleisli';
import { kleisliClosed } from './instances/kleisli';

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Closed<P> extends Profunctor<P> {
  closed<X>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [(x: X) => A, (x: X) => B]>;
}

export type ClosedRequirements<P> = Pick<Closed<P>, 'closed'> &
  ProfunctorRequirements<P> &
  Partial<Closed<P>>;
export const Closed = Object.freeze({
  of: <P>(P: ClosedRequirements<P>): Closed<P> => ({
    ...Profunctor.of(P),
    ...P,
  }),

  get Function1(): Closed<Function1F> {
    return function1Closed();
  },

  Kleisli: <F>(F: Distributive<F>) => kleisliClosed(F),
  Cokleisli: <F>(F: Functor<F>) => cokleisliClosed(F),
});
