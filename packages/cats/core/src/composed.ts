import { $, AnyK, α, λ, Kind } from '@cats4ts/core';
import { Apply } from './apply';
import { Functor } from './functor';

export interface ComposedFunctor<F extends AnyK, G extends AnyK>
  extends Functor<λ<[α], $<F, [$<G, [α]>]>>> {
  readonly F: Functor<F>;
  readonly G: Functor<G>;
}
export const ComposedFunctor = Object.freeze({
  of: <F extends AnyK, G extends AnyK>(
    F: Functor<F>,
    G: Functor<G>,
  ): ComposedFunctor<F, G> => ({
    F: F,
    G: G,

    ...Functor.of<λ<[α], $<F, [$<G, [α]>]>>>({
      // @ts-ignore TODO: Fix?
      map_: (fga, f) => F.map_(fga, ga => G.map_(ga, a => f(a))),
    }),
  }),
});

export interface ComposedApply<F extends AnyK, G extends AnyK>
  extends Apply<λ<[α], $<F, [$<G, [α]>]>>>,
    ComposedFunctor<F, G> {
  readonly F: Apply<F>;
  readonly G: Apply<G>;
}
export const ComposedApply = Object.freeze({
  of: <F extends AnyK, G extends AnyK>(
    F: Apply<F>,
    G: Apply<G>,
  ): ComposedApply<F, G> => {
    const functor = ComposedFunctor.of(F, G);
    return {
      F: F,
      G: G,

      ...Apply.of<λ<[α], $<F, [$<G, [α]>]>>>({
        map_: functor.map_,

        // @ts-ignore TODO: Fix?
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
