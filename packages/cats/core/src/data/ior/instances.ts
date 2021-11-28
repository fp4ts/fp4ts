// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, constant, Lazy, lazyVal } from '@fp4ts/core';
import { Eq } from '../../eq';
import { Semigroup } from '../../semigroup';
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
import { IorK } from './ior';
import { left, right } from './constructors';

export const iorEq: <A, B>(EqA: Eq<A>, EqB: Eq<B>) => Eq<Ior<A, B>> = (
  EqA,
  EqB,
) => Eq.of({ equals: equals_(EqA, EqB) });

export const iorMonad: <A>(S: Semigroup<A>) => Monad<$<IorK, [A]>> = S =>
  Monad.of({ pure: right, flatMap_: flatMap_(S), tailRecM_: tailRecM_(S) });

export const iorMonadError: <A>(
  S: Semigroup<A>,
) => MonadError<$<IorK, [A]>, A> = <A>(S: Semigroup<A>) =>
  MonadError.of({
    throwError: (e: A) => left(e),
    handleErrorWith_: (fa, h) => fold_(fa, h, constant(fa), constant(fa)),
    ...iorMonad(S),
  });

export const iorBifunctor: Lazy<Bifunctor<IorK>> = lazyVal(() =>
  Bifunctor.of({ bimap_: bimap_, map_: map_, leftMap_: leftMap_ }),
);
