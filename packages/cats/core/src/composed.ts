// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT, HKT1, Kind } from '@fp4ts/core';
import { EqK } from './eq-k';
import { Apply } from './apply';
import { Functor } from './functor';
import { Applicative } from './applicative';
import { Foldable } from './foldable';
import { Traversable } from './traversable';
import { Iter } from './data';

export interface ComposedEqK<F, G> extends EqK<[F, G]> {
  readonly F: EqK<F>;
  readonly G: EqK<G>;
}
export function ComposedEqK<F, G>(F: EqK<F>, G: EqK<G>): ComposedEqK<F, G>;
export function ComposedEqK<F, G>(
  F: EqK<HKT1<F>>,
  G: EqK<HKT1<G>>,
): ComposedEqK<HKT1<F>, HKT1<G>> {
  return {
    F,
    G,
    ...EqK.of<[HKT1<F>, HKT1<G>]>({ liftEq: E => F.liftEq(G.liftEq(E)) }),
  };
}

export interface ComposedFunctor<F, G> extends Functor<[F, G]> {
  readonly F: Functor<F>;
  readonly G: Functor<G>;
}
export function ComposedFunctor<F, G>(
  F: Functor<F>,
  G: Functor<G>,
): ComposedFunctor<F, G>;
export function ComposedFunctor<F, G>(
  F: Functor<HKT1<F>>,
  G: Functor<HKT1<G>>,
): ComposedFunctor<HKT1<F>, HKT1<G>> {
  return {
    F: F,
    G: G,

    ...Functor.of<[HKT1<F>, HKT1<G>]>({
      map_: (fga, f) => F.map_(fga, G.map(f)),
    }),
  };
}

export interface ComposedApply<F, G>
  extends Apply<[F, G]>,
    ComposedFunctor<F, G> {
  readonly F: Apply<F>;
  readonly G: Apply<G>;
}
export function ComposedApply<F, G>(
  F: Apply<F>,
  G: Apply<G>,
): ComposedApply<F, G>;
export function ComposedApply<F, G>(
  F: Apply<HKT1<F>>,
  G: Apply<HKT1<G>>,
): ComposedApply<HKT1<F>, HKT1<G>> {
  const functor = ComposedFunctor(F, G);
  return {
    F: F,
    G: G,

    ...Apply.of<[HKT1<F>, HKT1<G>]>({
      map_: functor.map_,

      ap_: <A, B>(
        fgf: HKT<F, [HKT<G, [(a: A) => B]>]>,
        fga: HKT<F, [HKT<G, [A]>]>,
      ) =>
        F.ap_(
          F.map_(fgf, gf => (ga: HKT<G, [A]>) => G.ap_(gf, ga)),
          fga,
        ),
    }),
  };
}

export interface ComposedApplicative<F, G>
  extends Applicative<[F, G]>,
    ComposedApply<F, G> {
  readonly F: Applicative<F>;
  readonly G: Applicative<G>;
}
export function ComposedApplicative<F, G>(
  F: Applicative<F>,
  G: Applicative<G>,
): ComposedApplicative<F, G>;
export function ComposedApplicative<F, G>(
  F: Applicative<HKT1<F>>,
  G: Applicative<HKT1<G>>,
): ComposedApplicative<HKT1<F>, HKT1<G>> {
  const apply = ComposedApply(F, G);
  const functor = ComposedFunctor(F, G);

  return {
    F: F,
    G: G,

    ...Applicative.of<[HKT1<F>, HKT1<G>]>({
      ...apply,
      ...functor,
      pure: a => F.pure(G.pure(a)),
    }),
  };
}
export interface ComposedFoldable<F, G> extends Foldable<[F, G]> {
  readonly F: Foldable<F>;
  readonly G: Foldable<G>;
}
export function ComposedFoldable<F, G>(
  F: Foldable<F>,
  G: Foldable<G>,
): ComposedFoldable<F, G>;
export function ComposedFoldable<F, G>(
  F: Foldable<HKT1<F>>,
  G: Foldable<HKT1<G>>,
): ComposedFoldable<HKT1<F>, HKT1<G>> {
  return {
    F: F,
    G: G,

    ...Foldable.of<[HKT1<F>, HKT1<G>]>({
      foldRight_: (fga, ez, f) =>
        F.foldRight_(fga, ez, (ga, eb) => G.foldRight_(ga, eb, f)),
      foldLeft_: (fga, z, f) =>
        F.foldLeft_(fga, z, (b, ga) => G.foldLeft_(ga, b, f)),

      toList: fga => F.toList(fga).flatMap(ga => G.toList(ga)),

      iterator: fga => Iter.flatMap_(F.iterator(fga), ga => G.iterator(ga)),
    }),
  };
}

export interface ComposedTraversable<F, G>
  extends Traversable<[F, G]>,
    ComposedFoldable<F, G> {
  readonly F: Traversable<F>;
  readonly G: Traversable<G>;
}
export function ComposedTraversable<F, G>(
  F: Traversable<F>,
  G: Traversable<G>,
): ComposedTraversable<F, G>;
export function ComposedTraversable<F, G>(
  F: Traversable<HKT1<F>>,
  G: Traversable<HKT1<G>>,
): ComposedTraversable<HKT1<F>, HKT1<G>> {
  function traverse_<H>(
    H: Applicative<H>,
  ): <A, B>(
    fga: HKT<F, [HKT<G, [A]>]>,
    f: (a: A) => Kind<H, [B]>,
  ) => Kind<H, [HKT<F, [HKT<G, [B]>]>]>;
  function traverse_<H>(
    H: Applicative<HKT1<H>>,
  ): <A, B>(
    fga: HKT<F, [HKT<G, [A]>]>,
    f: (a: A) => HKT<H, [B]>,
  ) => HKT<H, [HKT<F, [HKT<G, [B]>]>]> {
    return (fga, f) => F.traverse_(H)(fga, ga => G.traverse_(H)(ga, f));
  }

  return {
    F: F,
    G: G,

    ...Traversable.of<[HKT1<F>, HKT1<G>]>({
      ...ComposedFunctor(F, G),
      ...ComposedFoldable(F, G),
      traverse_,
    }),
  };
}
