// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow, id, Kind } from '@fp4ts/core';
import {
  Applicative,
  Function1F,
  Traversable,
  TraversableWithIndex,
} from '@fp4ts/cats';
import { State } from '@fp4ts/cats-mtl';
import { Indexable } from './ix';
import { backwards } from './fold';
import { PLensLike, POver } from './optics';

export type PTraversal<S, T, A, B> = <F>(
  F: Applicative<F>,
  P: Indexable<Function1F, unknown>,
) => PLensLike<F, S, T, A, B>;
export type Traversal<S, A> = PTraversal<S, S, A, A>;

export type IndexedPTraversal<I, S, T, A, B> = <F, P>(
  F: Applicative<F>,
  P: Indexable<P, I>,
) => POver<F, P, S, T, A, B>;
export type IndexedTraversal<I, S, A> = IndexedPTraversal<I, S, S, A, A>;

export function fromTraversable<G>(
  G: Traversable<G>,
): <A, B = A>() => PTraversal<Kind<G, [A]>, Kind<G, [B]>, A, B> {
  return () => G.traverse;
}

export function traverse<F>(
  F: Applicative<F>,
): <S, T, A, B>(
  l: PTraversal<S, T, A, B>,
) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]> {
  return l => l(F, Indexable.Function1());
}

export function sequence<F>(
  F: Applicative<F>,
): <S, T, B>(l: PTraversal<S, T, Kind<F, [B]>, B>) => (s: S) => Kind<F, [T]> {
  return l => l(F, Indexable.Function1())(id);
}

export function mapAccumL<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): <Acc>(z: Acc, f: (acc: Acc, a: A) => [Acc, B]) => (s: S) => [Acc, T] {
  return <Acc>(z: Acc, f: (acc: Acc, a: A) => [Acc, B]) =>
    s => {
      const [b, acc] = l(
        State.Monad<Acc>(),
        Indexable.Function1(),
      )(a =>
        State.state(s => {
          const [acc, b] = f(s, a);
          return [b, acc];
        }),
      )(s).runAS(undefined, z);
      return [acc, b];
    };
}

export function mapAccumR<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): <Acc>(z: Acc, f: (acc: Acc, a: A) => [Acc, B]) => (s: S) => [Acc, T] {
  return mapAccumL(backwards(l));
}

// -- Indexed

export function fromTraversableWithIndex<G, I>(
  G: TraversableWithIndex<G, I>,
): <A, B = A>() => IndexedPTraversal<I, Kind<G, [A]>, Kind<G, [B]>, A, B> {
  return () => (F, P) => flow(P.indexed, G.traverseWithIndex(F));
}
