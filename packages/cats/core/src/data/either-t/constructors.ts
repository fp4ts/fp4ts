// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor } from '../../functor';
import { Applicative } from '../../applicative';
import { Monad } from '../../monad';

import { Either, Right, Left } from '../either';
import { Option } from '../option';
import { OptionT } from '../option-t';

import { EitherT } from './algebra';

export const right =
  <F>(F: Applicative<F>) =>
  <B, A = never>(x: B): EitherT<F, A, B> =>
    new EitherT(F.pure(Right(x)));

export const pure = <F>(F: Applicative<F>) => right(F);

export const rightUnit = <F, A = never>(
  F: Applicative<F>,
): EitherT<F, A, void> => new EitherT(F.pure(Either.rightUnit));

export const left =
  <F>(F: Applicative<F>) =>
  <A, B = never>(x: A): EitherT<F, A, B> =>
    new EitherT(F.pure(Left(x)));

export const rightT =
  <F>(F: Functor<F>) =>
  <B, A = never>(fb: Kind<F, [B]>): EitherT<F, A, B> =>
    new EitherT(F.map_(fb, Right));

export const leftT =
  <F>(F: Functor<F>) =>
  <A, B = never>(fa: Kind<F, [A]>): EitherT<F, A, B> =>
    new EitherT(F.map_(fa, Left));

export const liftF = <F>(F: Functor<F>) => rightT(F);

export const fromEither =
  <F>(F: Applicative<F>) =>
  <A, B>(ab: Either<A, B>): EitherT<F, A, B> =>
    new EitherT(F.pure(ab));

export const fromOption =
  <F>(F: Applicative<F>) =>
  <A, B>(fb: Option<B>, ifNone: () => A): EitherT<F, A, B> =>
    new EitherT(F.pure(fb.fold(() => Left(ifNone()), Right)));

export const fromOptionT =
  <F>(F: Functor<F>) =>
  <A, B>(fa: OptionT<F, B>, ifNone: () => A): EitherT<F, A, B> =>
    new EitherT(
      fa.fold(F)<Either<A, B>>(
        () => Left(ifNone()),
        b => Right(b),
      ),
    );

export const tailRecM: <F>(
  F: Monad<F>,
) => <S>(
  s0: S,
) => <A, B>(f: (s: S) => EitherT<F, A, Either<S, B>>) => EitherT<F, A, B> =
  F => s0 => f =>
    tailRecM_(F)(s0, f);

export const tailRecM_ =
  <F>(F: Monad<F>) =>
  <S, A, B>(
    s0: S,
    f: (s: S) => EitherT<F, A, Either<S, B>>,
  ): EitherT<F, A, B> =>
    new EitherT(
      F.tailRecM_(s0, s0 =>
        F.map_(f(s0).value, ab =>
          ab.fold(
            l => Right(Left(l)),
            rsb =>
              rsb.fold<Either<S, Either<A, B>>>(
                s1 => Left(s1),
                b => Right(Right(b)),
              ),
          ),
        ),
      ),
    );
