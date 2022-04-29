// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Applicative, Function1, Function1F, Traversable } from '@fp4ts/cats';
import { State } from '@fp4ts/cats-mtl';
import { Affine } from '@fp4ts/optics-kernel';
import { POptic } from './optics';
import { backwards } from './fold';

export type PTraversal<S, T, A, B> = <F>(
  F: Applicative<F>,
  P: Affine<Function1F>,
) => POptic<F, Function1F, S, T, A, B>;
export type Traversal<S, A> = PTraversal<S, S, A, A>;

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
  return l => l(F, Function1.ArrowChoice);
}

export function sequence<F>(
  F: Applicative<F>,
): <S, T, B>(l: PTraversal<S, T, Kind<F, [B]>, B>) => (s: S) => Kind<F, [T]> {
  return l => l(F, Function1.ArrowChoice)(id);
}

export function mapAccumL<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): <Acc>(z: Acc, f: (acc: Acc, a: A) => [Acc, B]) => (s: S) => [Acc, T] {
  return <Acc>(z: Acc, f: (acc: Acc, a: A) => [Acc, B]) =>
    s =>
      l(
        State.Monad<Acc>(),
        Function1.ArrowChoice,
      )(a => State.state(s => f(s, a)))(s).runState(z);
}

export function mapAccumR<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): <Acc>(z: Acc, f: (acc: Acc, a: A) => [Acc, B]) => (s: S) => [Acc, T] {
  return mapAccumL(backwards(l));
}
