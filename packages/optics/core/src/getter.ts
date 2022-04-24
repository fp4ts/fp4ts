// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, pipe } from '@fp4ts/core';
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

export function view<S, A>(g: Getting<A, S, A>): (s: S) => A {
  return g(Const);
}

export function get<S, A>(g: Getter<S, A>): (s: S) => A {
  return pipe(g, asGetting(), view);
}

export function to<S, A>(f: (s: S) => A): Getter<S, A> {
  return <F, P>(F: Contravariant<F>, P: Profunctor<P>): Optic<F, P, S, A> =>
    P.dimap(f, F.contramap(f));
}
