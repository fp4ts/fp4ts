// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Comonad,
  Distributive,
  Function1F,
  Functor,
  Identity,
  IdentityF,
  Monad,
  Traversable,
} from '@fp4ts/cats';
import { ArrowApply, ArrowChoice, ArrowLoop } from '@fp4ts/cats-arrow';
import { Closed, Corepresentable, Representable } from '@fp4ts/cats-profunctor';
import { Kind, lazy } from '@fp4ts/core';

/**
 * @category Type Class
 * @internal
 */
export interface Conjoined<P, F = unknown, C = unknown>
  extends ArrowApply<P>,
    ArrowChoice<P>,
    ArrowLoop<P>,
    Closed<P>,
    Corepresentable<P, C>,
    Representable<P, F> {
  readonly F: Monad<F> & Distributive<F>;
  readonly C: Comonad<C> & Traversable<C>;

  distrib<F>(
    F: Functor<F>,
  ): <A, B>(pab: Kind<P, [A, B]>) => Kind<P, [Kind<F, [A]>, Kind<F, [B]>]>;
}

export const Conjoined = Object.freeze({
  get Function1(): Conjoined<Function1F, IdentityF, IdentityF> {
    return functionConjoined();
  },
});

const functionConjoined = lazy(
  (): Conjoined<Function1F, IdentityF, IdentityF> => ({
    ...ArrowApply.Function1,
    ...ArrowChoice.Function1,
    ...ArrowLoop.Function1,
    ...Closed.Function1,
    ...Corepresentable.Function1,
    ...Representable.Function1,
    F: { ...Identity.Monad, ...Identity.Distributive },
    C: { ...Identity.Comonad, ...Identity.Traversable },

    distrib: F => F.map,
  }),
);
