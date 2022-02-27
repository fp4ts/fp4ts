// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import {
  CoflatMap,
  Comonad,
  Foldable,
  Functor,
  Traversable,
} from '@fp4ts/cats-core';
import { CofreeF } from './cofree';
import {
  coflatMap_,
  coflatten,
  extract,
  foldLeft_,
  foldMap_,
  foldRightEval_,
  map_,
  traverse_,
} from './operators';

export const cofreeFunctor: <S>(
  S: Functor<S>,
) => Functor<$<CofreeF, [S]>> = S => Functor.of({ map_: map_(S) });

export const cofreeCoflatMap: <S>(
  S: Functor<S>,
) => CoflatMap<$<CofreeF, [S]>> = S =>
  CoflatMap.of({
    ...cofreeFunctor(S),
    coflatMap_: coflatMap_(S),
    coflatten: coflatten(S),
  });

export const cofreeComonad: <S>(
  S: Functor<S>,
) => Comonad<$<CofreeF, [S]>> = S =>
  Comonad.of({ ...cofreeCoflatMap(S), extract: extract });

export const cofreeFoldable: <S>(
  S: Foldable<S>,
) => Foldable<$<CofreeF, [S]>> = <S>(S: Foldable<S>) =>
  Foldable.of<$<CofreeF, [S]>>({
    foldMap_: M => foldMap_(S, M),
    foldLeft_: foldLeft_(S),
    foldRight_: foldRightEval_(S),
  });

export const cofreeTraversable: <S>(
  S: Traversable<S>,
) => Traversable<$<CofreeF, [S]>> = <S>(S: Traversable<S>) =>
  Traversable.of({
    ...cofreeFoldable(S),
    traverse_: G => traverse_(S, G),
  });
