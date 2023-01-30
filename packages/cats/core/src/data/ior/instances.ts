// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, constant, Eval, Lazy, lazy } from '@fp4ts/core';
import { Eq, Semigroup } from '@fp4ts/cats-kernel';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { Bifunctor } from '../../bifunctor';

import {
  bimap_,
  equals_,
  flatMap_,
  map_,
  tailRecM_,
  leftMap_,
  fold_,
} from './operators';
import { Ior } from './algebra';
import { IorF } from './ior';
import { left, right } from './constructors';

export const iorEq: <A, B>(EqA: Eq<A>, EqB: Eq<B>) => Eq<Ior<A, B>> = (
  EqA,
  EqB,
) => Eq.of({ equals: equals_(EqA, EqB) });

export const iorMonad: <S>(S: Semigroup<S>) => Monad<$<IorF, [S]>> = <S>(
  S: Semigroup<S>,
) =>
  Monad.of<$<IorF, [S]>>({
    pure: right,
    flatMap_: flatMap_(S),
    tailRecM_: tailRecM_(S),
    map2Eval_:
      <A, B>(fa: Ior<S, A>, efb: Eval<Ior<S, B>>) =>
      <C>(f: (a: A, b: B) => C): Eval<Ior<S, C>> =>
        fa.fold(
          s => Eval.now(left(s)),
          a => efb.map(fb => fb.map(b => f(a, b))),
          () => efb.map(fb => flatMap_(S)(fa, a => map_(fb, b => f(a, b)))),
        ),
  });

export const iorMonadError: <S>(
  S: Semigroup<S>,
) => MonadError<$<IorF, [S]>, S> = <A>(S: Semigroup<A>) =>
  MonadError.of({
    throwError: (e: A) => left(e),
    handleErrorWith_: (fa, h) => fold_(fa, h, constant(fa), constant(fa)),
    ...iorMonad(S),
  });

export const iorBifunctor: Lazy<Bifunctor<IorF>> = lazy(() =>
  Bifunctor.of({ bimap_: bimap_, map_: map_, leftMap_: leftMap_ }),
);
