// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, α, β, λ } from '@fp4ts/core';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { MonadError } from '../monad-error';

import {
  IndexedReaderWriterStateT,
  IndexedReaderWriterStateTF,
} from './indexed-reader-writer-state-t';

export type IndexedStateT<F, SA, SB, A> = IndexedReaderWriterStateT<
  F,
  unknown,
  SA,
  SB,
  unknown,
  A
>;

export const IndexedStateT: IndexedStateTObj = function () {};

interface IndexedStateTObj {
  // -- Instances

  Functor<F, S>(F: Functor<F>): Functor<IndexedStateTF<F, S, S>>;
  Monad<F, S>(F: Monad<F>): Monad<IndexedStateTF<F, S, S>>;
  MonadError<F, S, E>(
    F: MonadError<F, E>,
  ): MonadError<IndexedStateTF<F, S, S>, E>;
}

IndexedStateT.Functor = IndexedReaderWriterStateT.Functor;
IndexedStateT.Monad = IndexedReaderWriterStateT.Monad;
IndexedStateT.MonadError = IndexedReaderWriterStateT.MonadError;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export type IndexedStateTF<F, SA, SB> = $<
  IndexedReaderWriterStateTF,
  [F, unknown, SA, SB, unknown]
>;

/**
 * @category Type Constructor
 * @category Data
 */
export type IndexedStateTFA<F, A> = λ<
  IndexedReaderWriterStateTF,
  [Fix<F>, Fix<unknown>, α, β, Fix<unknown>, Fix<A>]
>;
