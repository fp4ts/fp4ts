// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Bifunctor } from '@fp4ts/cats';
import { Choice } from '@fp4ts/cats-profunctor';
import { absurd, F1, Kind } from '@fp4ts/core';
import { MonadReader, MonadState } from '@fp4ts/mtl';
import { Getter, to } from './getter';

import {
  IndexPreservingOptic,
  Optic,
  Settable,
  taggedInstance,
} from './internal';

export interface Review<out T, in B> extends Optic<never, T, unknown, B> {
  readonly runOptic: <F, P>(
    F: Settable<F>,
    P: Bifunctor<P> & Choice<P>,
  ) => (
    pafb: Kind<P, [never, Kind<F, [B]>]>,
  ) => Kind<P, [unknown, Kind<F, [T]>]>;
}

// -- Constructors

export function unto<B, T>(f: (b: B) => T): Review<T, B> {
  return mkReview(<F, P>(F: Settable<F>, P: Choice<P> & Bifunctor<P>) =>
    P.dimap(absurd<B>, F.map(f)),
  );
}

// -- Combinators

export function re<T, B>(l: Review<T, B>): Getter<B, T> {
  return to(reverseGet(l));
}

// -- Consuming Reviews

export function reverseGet<T, B>(l: Review<T, B>): (b: B) => T {
  return l.runOptic(Settable.Identity, taggedInstance);
}

// -- mlt

export function review<F, R>(
  F: MonadReader<F, R>,
): <T>(l: Review<T, R>) => Kind<F, [T]> {
  return l => F.asks(l.runOptic(Settable.Identity, taggedInstance));
}

export function reviews<F, R>(
  F: MonadReader<F, R>,
): <T>(l: Review<T, R>) => <B>(f: (t: T) => B) => Kind<F, [B]> {
  return l => {
    const rt = l.runOptic(Settable.Identity, taggedInstance);
    return tb => F.asks(F1.andThen(rt, tb));
  };
}

export function reuse<F, S>(
  F: MonadState<F, S>,
): <T>(l: Review<T, S>) => Kind<F, [T]> {
  return l => F.inspect(l.runOptic(Settable.Identity, taggedInstance));
}
export function reuses<F, S>(
  F: MonadState<F, S>,
): <T>(l: Review<T, S>) => <B>(f: (t: T) => B) => Kind<F, [B]> {
  return l => {
    const rt = l.runOptic(Settable.Identity, taggedInstance);
    return tb => F.map_(F.get, F1.andThen(rt, tb));
  };
}

// -- Private helpers

const mkReview = <T, B>(
  apply: <F, P>(
    F: Settable<F>,
    P: Choice<P> & Bifunctor<P>,
  ) => (
    pafb: Kind<P, [never, Kind<F, [B]>]>,
  ) => Kind<P, [unknown, Kind<F, [T]>]>,
): Review<T, B> => new IndexPreservingOptic(apply as any) as any;
