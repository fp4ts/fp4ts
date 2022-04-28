// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Applicative, Functor, Monad, MonadError } from '@fp4ts/cats-core';
import {
  IndexedReaderWriterStateT,
  IndexedReaderWriterStateTF,
} from './indexed-reader-writer-state-t';
import { MonadState } from '../monad-state';

export type StateT<F, S, A> = IndexedReaderWriterStateT<
  F,
  unknown,
  S,
  S,
  unknown,
  A
>;

export const StateT: StateTObj = function (F) {
  return IndexedReaderWriterStateT.state(F);
};

interface StateTObj {
  <F>(F: Applicative<F>): <S, A>(
    f: (s: S) => Kind<F, [[S, A]]>,
  ) => StateT<F, S, A>;
  // -- Instances

  Functor<F, S>(F: Functor<F>): Functor<StateTF<F, S>>;
  Monad<F, S>(F: Monad<F>): Monad<StateTF<F, S>>;
  MonadError<F, S, E>(F: MonadError<F, E>): MonadError<StateTF<F, S>, E>;
  MonadState<F, S>(F: Monad<F>): MonadState<StateTF<F, S>, S>;
}

StateT.Functor = IndexedReaderWriterStateT.Functor;
StateT.Monad = IndexedReaderWriterStateT.Monad;
StateT.MonadError = IndexedReaderWriterStateT.MonadError;
StateT.MonadState = IndexedReaderWriterStateT.MonadState;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export type StateTF<F, S> = $<
  IndexedReaderWriterStateTF,
  [F, unknown, S, S, unknown]
>;
