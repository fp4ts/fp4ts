// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Applicative } from '../applicative';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { MonadError } from '../monad-error';
import {
  IndexedReaderWriterStateT,
  IndexedReaderWriterStateTF,
} from './indexed-reader-writer-state-t';

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
}

StateT.Functor = IndexedReaderWriterStateT.Functor;
StateT.Monad = IndexedReaderWriterStateT.Monad;
StateT.MonadError = IndexedReaderWriterStateT.MonadError;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export type StateTF<F, S> = $<
  IndexedReaderWriterStateTF,
  [F, unknown, S, S, unknown]
>;
