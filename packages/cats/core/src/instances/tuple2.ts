// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Eval, Fix, Kind, lazy, TyK, TyVar, α, λ } from '@fp4ts/core';
import { Applicative } from '../applicative';
import { Bifunctor } from '../bifunctor';
import { Comonad } from '../comonad';
import { Traversable } from '../traversable';

export const tuple2Bifunctor = lazy(() =>
  Bifunctor.of<Tuple2F>({
    bimap_: ([a, b], f, g) => [f(a), g(b)],
    map_: ([a, b], g) => [a, g(b)],
    leftMap_: ([a, b], f) => [f(a), b],
  }),
);

export const tuple2LeftComonad = lazy(<R>() =>
  Comonad.of<TupleLeftF<R>>({
    ...tuple2Bifunctor().leftFunctor<R>(),
    extract: ([a]) => a,
    coflatMap_: (ar, f) => [f(ar), ar[1]],
  }),
) as <R>() => Comonad<TupleLeftF<R>>;

export const tuple2LeftTraversable = lazy(<R>() =>
  Traversable.of<TupleLeftF<R>>({
    ...tuple2Bifunctor().leftFunctor<R>(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>([a, r]: [A, R], f: (a: A) => Kind<G, [B]>) =>
        G.map_(f(a), b => [b, r]),

    size: _ => 1,
    isEmpty: _ => false,
    nonEmpty: _ => true,

    foldLeft_: ([a], z, f) => f(z, a),
    foldRight_: ([a], z, f) => Eval.defer(() => f(a, z)),
  }),
) as <L>() => Traversable<TupleLeftF<L>>;

export const tuple2RightComonad = lazy(<L>() =>
  Comonad.of<TupleRightF<L>>({
    ...tuple2Bifunctor().rightFunctor<L>(),
    extract: ([, a]) => a,
    coflatMap_: (la, f) => [la[0], f(la)],
  }),
) as <L>() => Comonad<TupleRightF<L>>;

export const tuple2RightTraversable = lazy(<L>() =>
  Traversable.of<TupleRightF<L>>({
    ...tuple2Bifunctor().rightFunctor<L>(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>([l, a]: [L, A], f: (a: A) => Kind<G, [B]>) =>
        G.map_(f(a), b => [l, b]),
    size: _ => 1,
    isEmpty: _ => false,
    nonEmpty: _ => true,

    foldLeft_: ([, a], z, f) => f(z, a),
    foldRight_: ([, a], z, f) => Eval.defer(() => f(a, z)),
  }),
) as <L>() => Traversable<TupleRightF<L>>;

// -- HKT

export interface Tuple2F extends TyK<[unknown, unknown]> {
  [$type]: [TyVar<this, 0>, TyVar<this, 1>];
}

export type TupleRightF<A> = $<Tuple2F, [A]>;
export type TupleLeftF<B> = λ<Tuple2F, [α, Fix<B>]>;
