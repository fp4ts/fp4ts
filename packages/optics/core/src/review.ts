// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow, absurd, pipe, Kind } from '@fp4ts/core';
import { Bifunctor } from '@fp4ts/cats';
import { Choice, Tagged } from '@fp4ts/cats-profunctor';
import { MonadReader, MonadState } from '@fp4ts/mtl';
import { Settable } from '@fp4ts/optics-kernel';

import { Optic } from './optics';
import { asGetting, get, Getter, to, use, view } from './getter';

export type Review<T, B> = <F, P>(
  F: Settable<F>,
  P: Choice<P> & Bifunctor<P>,
) => Optic<F, P, T, B>;

export function unto<B, T>(f: (b: B) => T): Review<T, B> {
  return <F, P>(
    F: Settable<F>,
    P: Choice<P> & Bifunctor<P>,
  ): Optic<F, P, T, B> => flow(P.rmap(F.map(f)), P.lmap<B, never>(absurd));
}

export function un<S, A>(g: Getter<S, A>): Review<A, S> {
  return pipe(g, get, unto);
}

export function re<T, B>(r: Review<T, B>): Getter<B, T> {
  return to(reverseGet(r));
}

export function reverseGet<T, B>(r: Review<T, B>): (b: B) => T {
  return r(Settable.Identity, { ...Tagged.Bifunctor, ...Tagged.Choice });
}

export function review<R, B>(
  R: MonadReader<R, B>,
): <T>(r: Review<T, B>) => Kind<R, [T]> {
  return flow(re, asGetting(), view(R));
}

export function reuse<R, B>(
  R: MonadState<R, B>,
): <T>(r: Review<T, B>) => Kind<R, [T]> {
  return flow(re, asGetting(), use(R));
}
