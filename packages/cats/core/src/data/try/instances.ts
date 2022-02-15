// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { SemigroupK } from '../../semigroup-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { ApplicativeError } from '../../applicative-error';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';

import { Try, TryF } from './try';
import {
  collect_,
  flatMap_,
  get,
  getError,
  isFailure,
  isSuccess,
  map_,
  orElse_,
  recoverWith_,
  tailRecM_,
} from './operators';
import { failure, success } from './constructors';

export const tryEq: <A>(EE: Eq<Error>, EA: Eq<A>) => Eq<Try<A>> = (EE, EA) =>
  Eq.of({
    equals: (lhs, rhs) => {
      if (isSuccess(lhs) && isSuccess(rhs))
        return EA.equals(get(lhs), get(rhs));
      if (isFailure(lhs) && isFailure(rhs))
        return EE.equals(getError(lhs), getError(rhs));

      return false;
    },
  });

export const trySemigroupK: Lazy<SemigroupK<TryF>> = lazyVal(() =>
  SemigroupK.of({ combineK_: orElse_ }),
);

export const tryFunctor: Lazy<Functor<TryF>> = lazyVal(() =>
  Functor.of({ map_: map_ }),
);

export const tryFunctorFilter: Lazy<FunctorFilter<TryF>> = lazyVal(() =>
  FunctorFilter.of({ ...tryFunctor(), mapFilter_: collect_ }),
);

export const tryApply: Lazy<Apply<TryF>> = lazyVal(() =>
  Apply.of({
    ...tryFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const tryApplicative: Lazy<Applicative<TryF>> = lazyVal(() =>
  Applicative.of({ ...tryApply(), pure: success }),
);

export const tryApplicativeError: Lazy<ApplicativeError<TryF, Error>> = lazyVal(
  () =>
    ApplicativeError.of({
      ...tryApplicative(),
      throwError: failure,
      handleErrorWith_: recoverWith_,
    }),
);

export const tryFlatMap: Lazy<FlatMap<TryF>> = lazyVal(() =>
  FlatMap.of({ ...tryApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ }),
);

export const tryMonad: Lazy<Monad<TryF>> = lazyVal(() =>
  Monad.of({ ...tryFlatMap(), ...tryApplicative() }),
);

export const tryMonadError: Lazy<MonadError<TryF, Error>> = lazyVal(() =>
  MonadError.of({ ...tryApplicativeError(), ...tryMonad() }),
);
