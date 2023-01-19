// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { constant, flow, Kind } from '@fp4ts/core';
import {
  Contravariant,
  Function1F,
  Functor,
  Profunctor,
  Semigroup,
} from '@fp4ts/cats';
import { MonadReader, MonadState } from '@fp4ts/cats-mtl';
import { Settable } from '@fp4ts/optics-kernel';
import { Indexable } from './ix';
import { PLensLike, POptical, POver } from './optics';

export type PSetter<S, T, A, B> = <F>(
  F: Settable<F>,
  P: Indexable<Function1F, unknown>,
  Q: Indexable<Function1F, unknown>,
) => PLensLike<F, S, T, A, B>;
export type Setter<S, A> = PSetter<S, S, A, A>;

export type IndexedPSetter<I, S, T, A, B> = <F, P>(
  F: Settable<F>,
  P: Indexable<P, I>,
  Q: Indexable<Function1F, unknown>,
) => POver<F, P, S, T, A, B>;
export type IndexedSetter<I, S, A> = IndexedPSetter<I, S, S, A, A>;

export function modify<S, T, A, B>(
  l: PSetter<S, T, A, B>,
): (f: (a: A) => B) => (s: S) => T {
  return l(Settable.Identity, Indexable.Function1(), Indexable.Function1());
}

export function replace<S, T, A, B>(
  l: PSetter<S, T, A, B>,
): (b: B) => (s: S) => T {
  return flow(constant, modify(l));
}

export function add<S, T>(
  l: PSetter<S, T, number, number>,
): (n: number) => (s: S) => T {
  return n => modify(l)(x => x + n);
}

export function sub<S, T>(
  l: PSetter<S, T, number, number>,
): (n: number) => (s: S) => T {
  return n => modify(l)(x => x - n);
}

export function mul<S, T>(
  l: PSetter<S, T, number, number>,
): (n: number) => (s: S) => T {
  return n => modify(l)(x => x * n);
}

export function div<S, T>(
  l: PSetter<S, T, number, number>,
): (n: number) => (s: S) => T {
  return n => modify(l)(x => x / n);
}

export function and<S, T>(
  l: PSetter<S, T, boolean, boolean>,
): (n: boolean) => (s: S) => T {
  return n => modify(l)(x => x && n);
}

export function or<S, T>(
  l: PSetter<S, T, boolean, boolean>,
): (n: boolean) => (s: S) => T {
  return n => modify(l)(x => x || n);
}

export function concat<A>(
  S: Semigroup<A>,
): <S, T>(l: PSetter<S, T, A, A>) => (a: A) => (s: S) => T {
  return l => a => modify(l)(S.combine(a));
}

export function fromFunctor<F>(
  F: Functor<F>,
): <A, B>() => PSetter<Kind<F, [A]>, Kind<F, [B]>, A, B> {
  return () => (S, P) => sets(S, P, P)(F.map);
}

export function fromContravariant<F>(
  F: Contravariant<F>,
): <A, B>() => PSetter<Kind<F, [B]>, Kind<F, [A]>, A, B> {
  return () => (S, P) => sets(S, P, P)(F.contramap);
}

export function fromProfunctor<P>(
  P_: Profunctor<P>,
): <A, B, R>() => PSetter<Kind<P, [B, R]>, Kind<P, [A, R]>, A, B> {
  return <A, B, R>() =>
    ((S, P) => sets(S, P, P)(P_.lmap)) as PSetter<
      Kind<P, [B, R]>,
      Kind<P, [A, R]>,
      A,
      B
    >;
}

export function sets<F, P, Q>(
  F: Settable<F>,
  P: Profunctor<P>,
  Q: Profunctor<Q>,
): <S, T, A, B>(
  pabqst: (pab: Kind<P, [A, B]>) => Kind<Q, [S, T]>,
) => POptical<F, P, Q, S, T, A, B> {
  return pabqst => pafb => F.taintedDot(Q)(pabqst(F.untaintedDot(P)(pafb)));
}

export function assign<G, S>(
  G: MonadState<G, S>,
): <A, B>(l: PSetter<S, S, A, B>) => (b: B) => Kind<G, [void]> {
  return l => flow(replace(l), G.modify);
}

export function assignF<G, S>(
  G: MonadState<G, S>,
): <A, B>(l: PSetter<S, S, A, B>) => (gb: Kind<G, [B]>) => Kind<G, [void]> {
  return l => G.flatMap(assign(G)(l));
}

export function modifying<G, S>(
  G: MonadState<G, S>,
): <A, B>(l: PSetter<S, S, A, B>) => (f: (a: A) => B) => Kind<G, [void]> {
  return l => flow(modify(l), G.modify);
}

export function adding<G, S>(
  G: MonadState<G, S>,
): (l: Setter<S, number>) => (n: number) => Kind<G, [void]> {
  return l => flow(add(l), G.modify);
}
export function subtracting<G, S>(
  G: MonadState<G, S>,
): (l: Setter<S, number>) => (n: number) => Kind<G, [void]> {
  return l => flow(sub(l), G.modify);
}
export function multiplying<G, S>(
  G: MonadState<G, S>,
): (l: Setter<S, number>) => (n: number) => Kind<G, [void]> {
  return l => flow(mul(l), G.modify);
}
export function dividing<G, S>(
  G: MonadState<G, S>,
): (l: Setter<S, number>) => (n: number) => Kind<G, [void]> {
  return l => flow(div(l), G.modify);
}
export function anding<G, S>(
  G: MonadState<G, S>,
): (l: Setter<S, boolean>) => (n: boolean) => Kind<G, [void]> {
  return l => flow(and(l), G.modify);
}
export function oring<G, S>(
  G: MonadState<G, S>,
): (l: Setter<S, boolean>) => (n: boolean) => Kind<G, [void]> {
  return l => flow(or(l), G.modify);
}
export function concatenating<G, S, A>(
  G: MonadState<G, S>,
  A: Semigroup<A>,
): (l: Setter<S, A>) => (a: A) => Kind<G, [void]> {
  return l => flow(concat(A)(l), G.modify);
}

export function locally<R, S>(
  R: MonadReader<R, S>,
): <A, B>(
  l: PSetter<S, S, A, B>,
) => (f: (a: A) => B) => <X>(gr: Kind<R, [X]>) => Kind<R, [X]> {
  return l => flow(modify(l), R.local);
}

// -- Indexed Methods

export function imodify<I, S, T, A, B>(
  l: IndexedPSetter<I, S, T, A, B>,
): (f: (a: A, i: I) => B) => (s: S) => T {
  return l(Settable.Identity, Indexable.Indexed(), Indexable.Function1());
}
