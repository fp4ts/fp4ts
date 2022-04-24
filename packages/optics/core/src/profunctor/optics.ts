// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative, Contravariant, Function1F } from '@fp4ts/cats';
import { Affine } from './affine';
import { Settable } from './settable';

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

export type Over<F, P, S, T, A, B> = POptical<F, P, Function1F, S, T, A, B>;

// prettier-ignore
export type PLensLike<F, S, T, A, B> =
  POptical<F, Function1F, Function1F, S, T, A, B>;
export type LensLike<F, S, A> = PLensLike<F, S, S, A, A>;

export type AnyOptical<S, T, A, B> = {
  <F, P>(
    F: Contravariant<F> & Applicative<F> & Settable<F>,
    P: Affine<P>,
  ): POptic<F, P, S, T, A, B>;
  <F, P, Q>(
    F: Contravariant<F> & Applicative<F> & Settable<F>,
    P: Affine<P>,
    Q: Affine<Q>,
  ): POptical<F, P, Q, S, T, A, B>;
};
