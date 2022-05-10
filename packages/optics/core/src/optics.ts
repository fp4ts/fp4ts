// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Applicative, Bifunctor, Contravariant, Function1F } from '@fp4ts/cats';
import { Settable } from '@fp4ts/optics-kernel';
import { Indexable, IndexedF } from './ix';

export type POptical<F, P, Q, S, T, A, B> = {
  (pafb: Kind<P, [A, Kind<F, [B]>]>): Kind<Q, [S, Kind<F, [T]>]>;
  _S?: S;
  _T?: T;
  _A?: A;
  _B?: B;
};
export type Optical<F, P, Q, S, A> = POptical<F, P, Q, S, S, A, A>;

export type POptic<F, P, S, T, A, B> = POptical<F, P, P, S, T, A, B>;
export type Optic<F, P, S, A> = POptic<F, P, S, S, A, A>;

export type POver<F, P, S, T, A, B> = POptical<F, P, Function1F, S, T, A, B>;
export type Over<F, P, S, A> = POver<F, P, S, S, A, A>;

export type PLensLike<F, S, T, A, B> = POptic<F, Function1F, S, T, A, B>;
export type LensLike<F, S, A> = PLensLike<F, S, S, A, A>;

export type AnyOptical<S, T, A, B> = {
  <F>(
    F: Contravariant<F> & Applicative<F> & Settable<F>,
    P: Indexable<Function1F, unknown> & Bifunctor<Function1F>,
    Q: Indexable<Function1F, unknown> & Bifunctor<Function1F>,
  ): PLensLike<F, S, T, A, B>;
};

export type AnyIndexedOptical<I, S, T, A, B> = {
  <F>(
    F: Contravariant<F> & Applicative<F> & Settable<F>,
    P: Indexable<$<IndexedF, [I]>, I>,
    Q: Indexable<Function1F, unknown> & Bifunctor<Function1F>,
  ): POver<F, $<IndexedF, [I]>, S, T, A, B>;
};
