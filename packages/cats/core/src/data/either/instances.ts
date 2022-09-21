// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Lazy, lazyVal } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel/';
import { SemigroupK } from '../../semigroup-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { ApplicativeError } from '../../applicative-error';
import { Bifunctor } from '../../bifunctor';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';

import { Either, EitherF } from './either';
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
import { Eval } from '../../eval';
import { EqK } from '../../eq-k';

export const eitherEqK: <E>(EE: Eq<E>) => EqK<$<EitherF, [E]>> = <E>(
  EE: Eq<E>,
) => EqK.of<$<EitherF, [E]>>({ liftEq: <A>(E: Eq<A>) => eitherEq(EE, E) });

export const eitherEq: <E, A>(EE: Eq<E>, EA: Eq<A>) => Eq<Either<E, A>> = (
  EE,
  EA,
) => Eq.of({ equals: equals_(EE, EA) });

export const eitherSemigroupK: <E>() => SemigroupK<$<EitherF, [E]>> = lazyVal(<
  E,
>() => SemigroupK.of<$<EitherF, [E]>>({ combineK_: orElse_ })) as <
  E,
>() => SemigroupK<$<EitherF, [E]>>;

export const eitherFunctor: <E>() => Functor<$<EitherF, [E]>> = lazyVal(<E>() =>
  Functor.of<$<EitherF, [E]>>({ map_ }),
) as <E>() => Functor<$<EitherF, [E]>>;

export const eitherBifunctor: Lazy<Bifunctor<EitherF>> = lazyVal(() =>
  Bifunctor.of({ bimap_: bimap_, map_: map_, leftMap_: leftMap_ }),
);

export const eitherApply: <E>() => Apply<$<EitherF, [E]>> = lazyVal(<E>() =>
  Apply.of<$<EitherF, [E]>>({
    ...eitherFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
    map2Eval_:
      <A, B>(fa: Either<E, A>, efb: Eval<Either<E, B>>) =>
      <C>(f: (a: A, b: B) => C): Eval<Either<E, C>> =>
        fa.fold(
          e => Eval.now(left(e)),
          a => efb.map(fb => fb.map(b => f(a, b))),
        ),
  }),
) as <E>() => Apply<$<EitherF, [E]>>;

export const eitherApplicative: <E>() => Applicative<$<EitherF, [E]>> = lazyVal(
  () =>
    Applicative.of({
      ...eitherApply(),
      pure: pure,
      unit: rightUnit,
    }),
);

export const eitherApplicativeError: <E>() => ApplicativeError<
  $<EitherF, [E]>,
  E
> = <E>() =>
  ApplicativeError.of<$<EitherF, [E]>, E>({
    ...eitherApplicative(),
    throwError: left,
    handleErrorWith_: (ea, h) => fold_(ea, h, right),
  });

export const eitherFlatMap: <E>() => FlatMap<$<EitherF, [E]>> = lazyVal(() =>
  FlatMap.of({ ...eitherApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ }),
);

export const eitherMonad: <E>() => Monad<$<EitherF, [E]>> = lazyVal(() =>
  Monad.of({
    ...eitherApplicative(),
    ...eitherFlatMap(),
  }),
);

export const eitherMonadError: <E>() => MonadError<$<EitherF, [E]>, E> = <
  E,
>() =>
  MonadError.of<$<EitherF, [E]>, E>({
    ...eitherApplicativeError(),
    ...eitherMonad(),
  });
