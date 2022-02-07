// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, tupled } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';

import { WriterT } from './algebra';

export const liftF =
  <F, L>(F: Functor<F>, L: Monoid<L>) =>
  <V>(fv: Kind<F, [V]>): WriterT<F, L, V> =>
    new WriterT(F.map_(fv, v => tupled(L.empty, v)));

export const pure =
  <F, L>(F: Applicative<F>, L: Monoid<L>) =>
  <V>(v: V): WriterT<F, L, V> =>
    new WriterT(F.pure(tupled(L.empty, v)));

export const unit = <F, L>(
  F: Applicative<F>,
  L: Monoid<L>,
): WriterT<F, L, void> => pure(F, L)(undefined as void);

export const tell =
  <F>(F: Applicative<F>) =>
  <L>(l: L): WriterT<F, L, void> =>
    new WriterT(F.pure(tupled(l, undefined as void)));
