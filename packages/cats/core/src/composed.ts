// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { EqK } from './eq-k';
import { Apply } from './apply';
import { Functor } from './functor';
import { Applicative } from './applicative';
import { Foldable } from './foldable';
import { Traversable } from './traversable';
import { Iter } from './data';

export interface ComposedEqK<F, G> extends EqK<[F, G]> {
  // readonly F: EqK<F>;
  // readonly G: EqK<G>;
}
export const ComposedEqK = Object.freeze({
  of: <F, G>(F: EqK<F>, G: EqK<G>): ComposedEqK<F, G> => ({
    // F,
    // G,

    ...EqK.of<[F, G]>({ liftEq: E => F.liftEq(G.liftEq(E)) }),
  }),
});

export interface ComposedFunctor<F, G> extends Functor<[F, G]> {
  // readonly F: Functor<F>;
  // readonly G: Functor<G>;
}
export const ComposedFunctor = Object.freeze({
  of: <F, G>(F: Functor<F>, G: Functor<G>): ComposedFunctor<F, G> => ({
    // F: F,
    // G: G,

    ...Functor.of<[F, G]>({ map_: (fga, f) => F.map_(fga, G.map(f)) }),
  }),
});

export interface ComposedApply<F, G>
  extends Apply<[F, G]>,
    ComposedFunctor<F, G> {
  // readonly F: Apply<F>;
  // readonly G: Apply<G>;
}
export const ComposedApply = Object.freeze({
  of: <F, G>(F: Apply<F>, G: Apply<G>): ComposedApply<F, G> => {
    const functor = ComposedFunctor.of(F, G);
    return {
      // F: F,
      // G: G,

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

        map2_: (fga, fgb, f) =>
          F.map2_(fga, fgb, (ga, gb) => G.map2_(ga, gb, f)),

        map2Eval_: (fga, efgb, f) =>
          F.map2Eval_(fga, efgb, (ga, gb) => G.map2_(ga, gb, f)),
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

    return {
      // F: F,
      // G: G,

      ...Applicative.of<[F, G]>({
        ...apply,
        pure: a => F.pure(G.pure(a)),
      }),
    };
  },
});

export interface ComposedFoldable<F, G> extends Foldable<[F, G]> {
  // readonly F: Foldable<F>;
  // readonly G: Foldable<G>;
}
export const ComposedFoldable = Object.freeze({
  of: <F, G>(F: Foldable<F>, G: Foldable<G>): ComposedFoldable<F, G> => {
    const self: ComposedFoldable<F, G> = {
      // F: F,
      // G: G,

      ...Foldable.of<[F, G]>({
        foldMap_:
          <M>(M: Monoid<M>) =>
          <A>(fga: Kind<F, [Kind<G, [A]>]>, f: (a: A) => M): M =>
            F.foldMap_(M)(fga, G.foldMap(M)(f)),

        foldRight_: (fga, ez, f) =>
          F.foldRight_(fga, ez, (ga, eb) => G.foldRight_(ga, eb, f)),
        foldLeft_: (fga, z, f) =>
          F.foldLeft_(fga, z, (b, ga) => G.foldLeft_(ga, b, f)),

        toArray: fga => Iter.toArray(self.iterator(fga)),

        iterator: fga => Iter.flatMap_(F.iterator(fga), ga => G.iterator(ga)),
      }),
    };
    return self;
  },
});

export interface ComposedTraversable<F, G>
  extends Traversable<[F, G]>,
    ComposedFoldable<F, G> {}
export const ComposedTraversable = Object.freeze({
  of: <F, G>(
    F: Traversable<F>,
    G: Traversable<G>,
  ): ComposedTraversable<F, G> => ({
    // F: F,
    // G: G,

    ...Traversable.of<[F, G]>({
      ...ComposedFunctor.of(F, G),
      ...ComposedFoldable.of(F, G),

      traverse_:
        <H>(H: Applicative<H>) =>
        <A, B>(
          fga: Kind<[F, G], [A]>,
          f: (a: A) => Kind<H, [B]>,
        ): Kind<H, [Kind<[F, G], [B]>]> =>
          F.traverse_(H)(fga, ga => G.traverse_(H)(ga, f)),
    }),
  }),
});
