// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor } from '../../functor';
import { Applicative } from '../../applicative';

import { Option, Some, None } from '../option';

import { OptionT } from './algebra';

export const pure =
  <F>(F: Applicative<F>) =>
  <A>(a: A): OptionT<F, A> =>
    new OptionT(F.pure(Some(a)));

export const some =
  <F>(F: Applicative<F>) =>
  <A>(a: A): OptionT<F, A> =>
    new OptionT(F.pure(Some(a)));

export const none = <F>(F: Applicative<F>): OptionT<F, never> =>
  new OptionT(F.pure(None));

export const liftF =
  <F>(F: Functor<F>) =>
  <A>(fa: Kind<F, [A]>): OptionT<F, A> =>
    new OptionT(F.map_(fa, a => Some(a)));

export const fromOption =
  <F>(F: Applicative<F>) =>
  <A>(opt: Option<A>): OptionT<F, A> =>
    new OptionT(F.pure(opt));

export const fromNullable =
  <F>(F: Applicative<F>) =>
  <A>(x: A | null | undefined): OptionT<F, A> =>
    new OptionT(F.pure(Option(x)));
