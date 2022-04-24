// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { constant, flow, Kind } from '@fp4ts/core';
import {
  Contravariant,
  Function1,
  Function1F,
  Functor,
  IdentityF,
  Profunctor,
} from '@fp4ts/cats';
import { POptic, POptical } from './optics';
import { Affine, Settable } from '@fp4ts/optics-kernel';

export type PSetter<S, T, A, B> = (
  F: Settable<IdentityF>,
  P: Affine<Function1F>,
) => POptic<IdentityF, Function1F, S, T, A, B>;
export type Setter<S, A> = PSetter<S, S, A, A>;

export function modify<S, T, A, B>(
  l: PSetter<S, T, A, B>,
): (f: (a: A) => B) => (s: S) => T {
  return l(Settable.Identity, Function1.ArrowChoice);
}

export function replace<S, T, A, B>(
  l: PSetter<S, T, A, B>,
): (b: B) => (s: S) => T {
  return flow(constant, modify(l));
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
