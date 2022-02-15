// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, constant, Lazy, lazyVal } from '@fp4ts/core';
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

export const iorMonad: <A>(S: Semigroup<A>) => Monad<$<IorF, [A]>> = S =>
  Monad.of({ pure: right, flatMap_: flatMap_(S), tailRecM_: tailRecM_(S) });

export const iorMonadError: <A>(
  S: Semigroup<A>,
) => MonadError<$<IorF, [A]>, A> = <A>(S: Semigroup<A>) =>
  MonadError.of({
    throwError: (e: A) => left(e),
    handleErrorWith_: (fa, h) => fold_(fa, h, constant(fa), constant(fa)),
    ...iorMonad(S),
  });

export const iorBifunctor: Lazy<Bifunctor<IorF>> = lazyVal(() =>
  Bifunctor.of({ bimap_: bimap_, map_: map_, leftMap_: leftMap_ }),
);
