// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Lazy, lazyVal } from '@fp4ts/core';
import { Eq } from '../../eq';
import { SemigroupK } from '../../semigroup-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { ApplicativeError } from '../../applicative-error';
import { Bifunctor } from '../../bifunctor';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';

import { Either, EitherK } from './either';
import {
  flatMap_,
  map_,
  orElse_,
  tailRecM_,
  equals_,
  fold_,
  bimap_,
  leftMap_,
} from './operators';
import { left, pure, right, rightUnit } from './constructors';

export const eitherEq: <E, A>(EE: Eq<E>, EA: Eq<A>) => Eq<Either<E, A>> = (
  EE,
  EA,
) => Eq.of({ equals: equals_(EE, EA) });

export const eitherSemigroupK: <E>() => SemigroupK<$<EitherK, [E]>> = lazyVal(
  () => SemigroupK.of({ combineK_: orElse_ }),
);

export const eitherFunctor: <E>() => Functor<$<EitherK, [E]>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const eitherBifunctor: Lazy<Bifunctor<EitherK>> = lazyVal(() =>
  Bifunctor.of({ bimap_: bimap_, map_: map_, leftMap_: leftMap_ }),
);

export const eitherApply: <E>() => Apply<$<EitherK, [E]>> = lazyVal(() =>
  Apply.of({
    ...eitherFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const eitherApplicative: <E>() => Applicative<$<EitherK, [E]>> = lazyVal(
  () =>
    Applicative.of({
      ...eitherApply(),
      pure: pure,
      unit: rightUnit,
    }),
);

export const eitherApplicativeError: <E>() => ApplicativeError<
  $<EitherK, [E]>,
  E
> = <E>() =>
  ApplicativeError.of<$<EitherK, [E]>, E>({
    ...eitherApplicative(),
    throwError: left,
    handleErrorWith_: (ea, h) => fold_(ea, h, right),
  });

export const eitherFlatMap: <E>() => FlatMap<$<EitherK, [E]>> = lazyVal(() =>
  FlatMap.of({ ...eitherApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ }),
);

export const eitherMonad: <E>() => Monad<$<EitherK, [E]>> = lazyVal(() =>
  Monad.of({
    ...eitherApplicative(),
    ...eitherFlatMap(),
  }),
);

export const eitherMonadError: <E>() => MonadError<$<EitherK, [E]>, E> = <
  E,
>() =>
  MonadError.of<$<EitherK, [E]>, E>({
    ...eitherApplicativeError(),
    ...eitherMonad(),
  });
