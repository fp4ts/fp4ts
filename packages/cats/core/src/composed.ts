// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Apply } from './apply';
import { Functor } from './functor';
import { Applicative } from './applicative';

export interface ComposedFunctor<F, G> extends Functor<[F, G]> {
  readonly F: Functor<F>;
  readonly G: Functor<G>;
}
export const ComposedFunctor = Object.freeze({
  of: <F, G>(F: Functor<F>, G: Functor<G>): ComposedFunctor<F, G> => ({
    F: F,
    G: G,

    ...Functor.of<[F, G]>({ map_: (fga, f) => F.map_(fga, G.map(f)) }),
  }),
});

export interface ComposedApply<F, G>
  extends Apply<[F, G]>,
    ComposedFunctor<F, G> {
  readonly F: Apply<F>;
  readonly G: Apply<G>;
}
export const ComposedApply = Object.freeze({
  of: <F, G>(F: Apply<F>, G: Apply<G>): ComposedApply<F, G> => {
    const functor = ComposedFunctor.of(F, G);
    return {
      F: F,
      G: G,

      ...Apply.of<[F, G]>({
        map_: functor.map_,

        ap_: <A, B>(
          fgf: Kind<F, [Kind<G, [(a: A) => B]>]>,
          fga: Kind<F, [Kind<G, [A]>]>,
        ) =>
          F.ap_(
            F.map_(fgf, gf => (ga: Kind<G, [A]>) => G.ap_(gf, ga)),
            fga,
          ),
      }),
    };
  },
});

export interface ComposedApplicative<F, G>
  extends Applicative<[F, G]>,
    ComposedApply<F, G> {}
export const ComposedApplicative = Object.freeze({
  of: <F, G>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): ComposedApplicative<F, G> => {
    const apply = ComposedApply.of(F, G);
    const functor = ComposedFunctor.of(F, G);

    return {
      F: F,
      G: G,

      ...Applicative.of<[F, G]>({
        ...apply,
        ...functor,
        pure: a => F.pure(G.pure(a)),
      }),
    };
  },
});
