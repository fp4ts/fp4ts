// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, pipe } from '@fp4ts/core';
import {
  Const,
  ConstF,
  Contravariant,
  Function1,
  Function1F,
  Functor,
  Monoid,
  Profunctor,
} from '@fp4ts/cats';
import { MonadReader, MonadState } from '@fp4ts/cats/mtl';
import { Affine } from '@fp4ts/optics-kernel';
import { Optic } from './optics';
import { Fold } from './fold';

export type Getter<S, A> = <F, P>(
  F: Contravariant<F> & Functor<F>,
  P: Affine<P>,
) => Optic<F, P, S, A>;

export type Getting<R, S, A> = Optic<$<ConstF, [R]>, Function1F, S, A>;

/* eslint-disable prettier/prettier */
export function asGetting<R>(R: Monoid<R>): <S, A>(l: Fold<S, A>) => Getting<R, S, A>;
export function asGetting(): <S, A>(l: Getter<S, A>) => Getting<A, S, A>;
export function asGetting(R?: Monoid<any>): <S, A>(l: any) => Getting<any, S, A> {
  const P = Function1.ArrowChoice;
  return R != null
    ? l => l({ ...Const.Applicative(R), ...Const.Contravariant<any>() }, P)
    : l => l({ ...Const.Functor<any>(), ...Const.Contravariant<any>() }, P);
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
