// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  Fix,
  fst,
  Kind,
  lazyVal,
  snd,
  TyK,
  TyVar,
  α,
  λ,
} from '@fp4ts/core';
import { Applicative } from '../applicative';
import { Bifunctor } from '../bifunctor';
import { Comonad } from '../comonad';
import { Traversable } from '../traversable';

export type Tuple2<A, B> = [A, B];

export const Tuple2: Tuple2Obj = function <A, B>(a: A, b: B): [A, B] {
  return [a, b];
} as any;

interface Tuple2Obj {
  <A, B>(a: A, b: B): Tuple2<A, B>;

  // -- Instances

  Bifunctor: Bifunctor<Tuple2F>;
  left: {
    Comonad<A>(): Comonad<Tuple2LF<A>>;
    Traversable<A>(): Traversable<Tuple2LF<A>>;
  };
  right: {
    Comonad<A>(): Comonad<$<Tuple2F, [A]>>;
    Traversable<A>(): Traversable<$<Tuple2F, [A]>>;
  };
}

const tuple2RightComonad: <A>() => Comonad<$<Tuple2F, [A]>> = lazyVal(<A>() =>
  Comonad.of({
    ...Tuple2.Bifunctor.rightFunctor<A>(),
    extract: snd,
    coflatMap_: (fa, f) => [fa[0], f(fa)],
  }),
) as <A>() => Comonad<$<Tuple2F, [A]>>;

const tuple2RightTraversable: <A>() => Traversable<$<Tuple2F, [A]>> = lazyVal(<
  A,
>() =>
  Traversable.of({
    ...Tuple2.Bifunctor.rightFunctor<A>(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <AA, B>(
        [a, aa]: [A, AA],
        f: (aa: AA) => Kind<G, [B]>,
      ): Kind<G, [[A, B]]> =>
        G.map_(f(aa), b => [a, b]),
  }),
) as <A>() => Traversable<$<Tuple2F, [A]>>;

const tuple2LeftComonad: <A>() => Comonad<Tuple2LF<A>> = lazyVal(<A>() =>
  Comonad.of({
    ...Tuple2.Bifunctor.leftFunctor<A>(),
    extract: fst,
    coflatMap_: (fa, f) => [f(fa), fa[1]],
  }),
) as <A>() => Comonad<Tuple2LF<A>>;

const tuple2LeftTraversable: <A>() => Traversable<Tuple2LF<A>> = lazyVal(<
  A,
>() =>
  Traversable.of({
    ...Tuple2.Bifunctor.leftFunctor<A>(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <AA, B>(
        [aa, a]: [AA, A],
        f: (aa: AA) => Kind<G, [B]>,
      ): Kind<G, [[B, A]]> =>
        G.map_(f(aa), b => [b, a]),
  }),
) as <A>() => Traversable<Tuple2LF<A>>;

const tuple2Bifunctor = lazyVal(() =>
  Bifunctor.of<Tuple2F>({
    bimap_: <A, B, C, D>(
      [a, b]: [A, B],
      f: (a: A) => C,
      g: (b: B) => D,
    ): [C, D] => [f(a), g(b)],
  }),
);

Object.defineProperty(Tuple2, 'Bifunctor', {
  get() {
    return tuple2Bifunctor();
  },
});
Tuple2.right = {
  Comonad: tuple2RightComonad,
  Traversable: tuple2RightTraversable,
};
Tuple2.left = {
  Comonad: tuple2LeftComonad,
  Traversable: tuple2LeftTraversable,
};

// -- HKT

export interface Tuple2F extends TyK<[unknown, unknown]> {
  [$type]: Tuple2<TyVar<this, 0>, TyVar<this, 1>>;
}

export type Tuple2RF<A> = λ<Tuple2F, [Fix<A>, α]>;
export type Tuple2LF<B> = λ<Tuple2F, [α, Fix<B>]>;
