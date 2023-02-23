// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, flow, fst, Kind, pipe, tuple } from '@fp4ts/core';
import {
  Arrow,
  Const,
  ConstF,
  Contravariant,
  Function1F,
  Functor,
  Monoid,
} from '@fp4ts/cats';
import { Profunctor } from '@fp4ts/cats-profunctor';
import { MonadReader, MonadState } from '@fp4ts/cats-mtl';
import { Indexable, IndexedF } from './ix';
import { LensLike, Optic, Over } from './optics';
import { Fold, IndexedFold } from './fold';

export type Getter<S, A> = <F>(
  F: Contravariant<F> & Functor<F>,
  P: Indexable<Function1F, unknown>,
  Q: Indexable<Function1F, unknown>,
) => LensLike<F, S, A>;
export type IndexedGetter<I, S, A> = <F, P>(
  F: Contravariant<F> & Functor<F>,
  P: Indexable<P, I>,
  Q: Indexable<Function1F, unknown>,
) => Over<F, P, S, A>;

export type Getting<R, S, A> = Optic<$<ConstF, [R]>, Function1F, S, A>;
export type IndexedGetting<I, R, S, A> = Over<
  $<ConstF, [R]>,
  $<IndexedF, [I]>,
  S,
  A
>;

/* eslint-disable prettier/prettier */
export function asGetting<R>(R: Monoid<R>): <S, A>(l: Fold<S, A>) => Getting<R, S, A>;
export function asGetting(): <S, A>(l: Getter<S, A>) => Getting<A, S, A>;
export function asGetting(R?: Monoid<any>): <S, A>(l: any) => Getting<any, S, A> {
  const P = Indexable.Function1();
  return R != null
    ? l => l({ ...Const.Applicative(R), ...Const.Contravariant<any>() }, P)
    : l => l({ ...Const.Functor<any>(), ...Const.Contravariant<any>() }, P);
}

export function asIndexedGetting<R>(R: Monoid<R>): <I, S, A>(l: IndexedFold<I, S, A>) => IndexedGetting<I, R, S, A>;
export function asIndexedGetting<R>(): <I, S, A>(l: IndexedGetter<I, S, A>) => IndexedGetting<I, [A, I], S, A>;
export function asIndexedGetting(R?: Monoid<any>): <I, S, A>(l: any) => IndexedGetting<I, any, S, A> {
  const P = Indexable.Indexed<any>();
  return R
    ? l => l({  ...Const.Applicative(R), ...Const.Contravariant() }, P)
    : l => l({ ...Const.Functor<any>(), ...Const.Contravariant<any>(), }, P);
}
/* eslint-enable prettier/prettier */

export function view<R, S>(
  R: MonadReader<R, S>,
): <A>(g: Getting<A, S, A>) => Kind<R, [A]> {
  return g => R.asks(g(Const));
}

export function use<R, S>(
  R: MonadState<R, S>,
): <A>(g: Getting<A, S, A>) => Kind<R, [A]> {
  return g => R.inspect(g(Const));
}

export function get<S, A>(g: Getter<S, A>): (s: S) => A {
  return pipe(g, asGetting(), view(MonadReader.Function1<S>()));
}

export function to<S, A>(f: (s: S) => A): Getter<S, A> {
  return <F, P>(F: Contravariant<F>, P: Profunctor<P>): Optic<F, P, S, A> =>
    P.dimap(f, F.contramap(f));
}

// -- Indexed Methods

export function iview<R, S>(
  R: MonadReader<R, S>,
): <I, A>(g: IndexedGetting<I, [A, I], S, A>) => Kind<R, [[A, I]]> {
  return g => R.asks(g((a, i) => Const([a, i])));
}

export function iuse<R, S>(
  R: MonadState<R, S>,
): <I, A>(g: IndexedGetting<I, [A, I], S, A>) => Kind<R, [[A, I]]> {
  return g => R.inspect(g((a, i) => Const([a, i])));
}

export function iget<I, S, A>(g: IndexedGetter<I, S, A>): (s: S) => [A, I] {
  return pipe(g, asIndexedGetting(), iview(MonadReader.Function1<S>()));
}

export function ito<I, S, A>(f: (s: S) => [A, I]): IndexedGetter<I, S, A> {
  return <F, P>(F: Contravariant<F>, P: Indexable<P, I>): Over<F, P, S, A> =>
    flow(
      P.indexed,
      f => tuple(f),
      Arrow.Function1.dimap(f, F.contramap(flow(f, fst))),
    );
}
