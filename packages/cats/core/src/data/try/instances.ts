// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Lazy, lazy } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { SemigroupK } from '../../semigroup-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { ApplicativeError } from '../../applicative-error';
import { FlatMap } from '../../flat-map';
import { CoflatMap } from '../../coflat-map';
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
  orElseEval_,
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

export const trySemigroupK: Lazy<SemigroupK<TryF>> = lazy(() =>
  SemigroupK.of({
    combineK_: (x, y) => orElse_(x, () => y),
    combineKEval_: orElseEval_,
  }),
);

export const tryFunctor: Lazy<Functor<TryF>> = lazy(() =>
  Functor.of({ map_: map_ }),
);

export const tryFunctorFilter: Lazy<FunctorFilter<TryF>> = lazy(() =>
  FunctorFilter.of({ ...tryFunctor(), mapFilter_: collect_ }),
);

export const tryApply: Lazy<Apply<TryF>> = lazy(() =>
  Apply.of({
    ...tryFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
    map2Eval_:
      <A, B>(fa: Try<A>, efb: Eval<Try<B>>) =>
      <C>(f: (a: A, b: B) => C): Eval<Try<C>> =>
        fa.fold(
          e => Eval.now(failure(e)),
          a => efb.map(fb => fb.map(b => f(a, b))),
        ),
  }),
);

export const tryApplicative: Lazy<Applicative<TryF>> = lazy(() =>
  Applicative.of({ ...tryApply(), pure: success }),
);

export const tryApplicativeError: Lazy<ApplicativeError<TryF, Error>> = lazy(
  () =>
    ApplicativeError.of({
      ...tryApplicative(),
      throwError: failure,
      handleErrorWith_: recoverWith_,
    }),
);

export const tryFlatMap: Lazy<FlatMap<TryF>> = lazy(() =>
  FlatMap.of({ ...tryApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ }),
);

export const tryCoflatMap: Lazy<CoflatMap<TryF>> = lazy(() =>
  CoflatMap.fromApplicative(tryApplicative()),
);

export const tryMonad: Lazy<Monad<TryF>> = lazy(() =>
  Monad.of({ ...tryFlatMap(), ...tryApplicative() }),
);

export const tryMonadError: Lazy<MonadError<TryF, Error>> = lazy(() =>
  MonadError.of({ ...tryApplicativeError(), ...tryMonad() }),
);
