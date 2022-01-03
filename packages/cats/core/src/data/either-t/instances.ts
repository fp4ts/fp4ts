// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { SemigroupK } from '../../semigroup-k';
import { Functor } from '../../functor';
import { Bifunctor } from '../../bifunctor';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { Eq } from '../../eq';

import { Either, Right } from '../either';

import { EitherTK } from './either-t';
import { EitherT } from './algebra';
import { bimap_, flatMap_, leftMap_, map_, orElse_ } from './operators';
import { left, pure, tailRecM_ } from './constructors';

export const eitherTEq: <F, AA, B>(
  E: Eq<Kind<F, [Either<AA, B>]>>,
) => Eq<EitherT<F, AA, B>> = E => Eq.by(E, fab => fab.value);

export const eitherTSemigroupK: <F, AA>(
  F: Monad<F>,
) => SemigroupK<$<EitherTK, [F, AA]>> = F =>
  SemigroupK.of({ combineK_: orElse_(F) });

export const eitherTFunctor: <F, AA>(
  F: Functor<F>,
) => Functor<$<EitherTK, [F, AA]>> = F => Functor.of({ map_: map_(F) });

export const eitherTBifunctor: <F>(
  F: Functor<F>,
) => Bifunctor<$<EitherTK, [F]>> = F =>
  Bifunctor.of({ bimap_: bimap_(F), map_: map_(F), leftMap_: leftMap_(F) });

export const eitherTMonad: <F, AA>(
  F: Monad<F>,
) => Monad<$<EitherTK, [F, AA]>> = F =>
  Monad.of({
    ...eitherTFunctor(F),
    pure: pure(F),
    flatMap_: flatMap_(F),
    tailRecM_: tailRecM_(F),
  });

export const eitherTMonadError: <F, E>(
  F: Monad<F>,
) => MonadError<$<EitherTK, [F, E]>, E> = <F, E>(F: Monad<F>) =>
  MonadError.of<$<EitherTK, [F, E]>, E>({
    ...eitherTMonad(F),

    throwError: left(F),

    handleErrorWith_: (fea, h) =>
      new EitherT(
        F.flatMap_(fea.value, ea =>
          ea.fold(
            e => h(e).value,
            a => F.pure(Right(a)),
          ),
        ),
      ),
  });
