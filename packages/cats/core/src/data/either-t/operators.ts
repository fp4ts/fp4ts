// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, flow, id, Kind } from '@fp4ts/core';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { Either, Left, Right } from '../either';
import { Option, None, Some } from '../option';
import { OptionT } from '../option-t';
import { EitherT } from './algebra';

export const isLeft =
  <F>(F: Functor<F>) =>
  <A, B>(fab: EitherT<F, A, B>): Kind<F, [boolean]> =>
    F.map_(fab.value, ea => ea.isLeft);

export const isRight =
  <F>(F: Functor<F>) =>
  <A, B>(fab: EitherT<F, A, B>): Kind<F, [boolean]> =>
    F.map_(fab.value, ea => ea.isLeft);

export const swapped =
  <F>(F: Functor<F>) =>
  <A, B>(fab: EitherT<F, A, B>): EitherT<F, B, A> =>
    new EitherT(F.map_(fab.value, ea => ea.swapped));

export const flatten =
  <F>(F: Monad<F>) =>
  <A, B>(fafab: EitherT<F, A, EitherT<F, A, B>>): EitherT<F, A, B> =>
    flatMap_(F)(fafab, id);

export const toOptionF =
  <F>(F: Functor<F>) =>
  <A, B>(fab: EitherT<F, A, B>): Kind<F, [Option<B>]> =>
    fold_(F)(fab, () => None, Some);

export const toOptionT =
  <F>(F: Functor<F>) =>
  <A, B>(fab: EitherT<F, A, B>): OptionT<F, B> =>
    OptionT(toOptionF(F)(fab));

// -- Point-ful operators

export const fold_ =
  <F>(F: Functor<F>) =>
  <A, B, C, D = C>(
    fab: EitherT<F, A, B>,
    f: (e: A) => C,
    g: (a: B) => D,
  ): Kind<F, [C | D]> =>
    F.map_(fab.value, ea => ea.fold(f, g));

export const foldF_ =
  <F>(F: FlatMap<F>) =>
  <A, B, C, D = C>(
    fab: EitherT<F, A, B>,
    f: (e: A) => Kind<F, [C]>,
    g: (a: B) => Kind<F, [D]>,
  ): Kind<F, [C | D]> =>
    F.flatMap_(fab.value, ea => ea.fold<Kind<F, [C | D]>>(f, g));

export const getOrElse_ =
  <F>(F: Functor<F>) =>
  <A, B>(fab: EitherT<F, A, B>, defaultValue: () => B): Kind<F, [B]> =>
    F.map_(fab.value, ea => ea.getOrElse(defaultValue));

export const getOrElseF_ =
  <F>(F: Monad<F>) =>
  <A, B>(
    fab: EitherT<F, A, B>,
    defaultValue: () => Kind<F, [B]>,
  ): Kind<F, [B]> =>
    F.flatMap_(fab.value, ea => ea.fold(defaultValue, F.pure));

export const orElse_ =
  <F>(F: Monad<F>) =>
  <A, B>(
    fab: EitherT<F, A, B>,
    alt: () => EitherT<F, A, B>,
  ): EitherT<F, A, B> =>
    new EitherT(
      F.flatMap_(fab.value, ea =>
        ea.fold<Kind<F, [Either<A, B>]>>(
          () => alt().value,
          x => F.pure(Right(x)),
        ),
      ),
    );

export const orElseF_ =
  <F>(F: Monad<F>) =>
  <A, B>(
    fab: EitherT<F, A, B>,
    alt: () => Kind<F, [Either<A, B>]>,
  ): EitherT<F, A, B> =>
    orElse_(F)(fab, () => new EitherT(alt()));

export const bimap_ =
  <F>(F: Functor<F>) =>
  <A, B, C, D>(
    fab: EitherT<F, A, B>,
    f: (a: A) => C,
    g: (b: B) => D,
  ): EitherT<F, C, D> =>
    new EitherT(
      F.map_(fab.value, ab => ab.fold(compose(Left, f), compose(Right, g))),
    );

export const leftMap_ =
  <F>(F: Functor<F>) =>
  <A, B, C>(fab: EitherT<F, A, B>, f: (a: A) => C): EitherT<F, C, B> =>
    bimap_(F)(fab, f, id);

export const map_ =
  <F>(F: Functor<F>) =>
  <A, B, D>(fab: EitherT<F, A, B>, g: (a: B) => D): EitherT<F, A, D> =>
    bimap_(F)(fab, id, g);

export const flatMap_ =
  <F>(F: Monad<F>) =>
  <A, B, D>(
    fab: EitherT<F, A, B>,
    f: (b: B) => EitherT<F, A, D>,
  ): EitherT<F, A, D> =>
    new EitherT(
      F.flatMap_(fab.value, ab => ab.fold(flow(Left, F.pure), b => f(b).value)),
    );

export const flatMapF_ =
  <F>(F: Monad<F>) =>
  <A, B, D>(
    fab: EitherT<F, A, B>,
    f: (b: B) => Kind<F, [Either<A, D>]>,
  ): EitherT<F, A, D> =>
    flatMap_(F)(fab, b => new EitherT(f(b)));
