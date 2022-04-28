// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, α, β, λ } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats-core';
import {
  IndexedReaderWriterState,
  IndexedReaderWriterStateF,
} from './indexed-reader-writer-state';
import { MonadState } from '../monad-state';

export type IndexedState<SA, SB, A> = IndexedReaderWriterState<
  never,
  SA,
  SB,
  unknown,
  never,
  A
>;

export const IndexedState: IndexedStateObj = function (f) {
  return IndexedReaderWriterState.state(f);
};

interface IndexedStateObj {
  <SA, SB, A>(f: (sa: SA) => [SB, A]): IndexedState<SA, SB, A>;
  pure<A, S>(a: A): IndexedState<S, S, A>;
  state<SA, SB, A>(f: (sa: SA) => [SB, A]): IndexedState<SA, SB, A>;

  get<S>(): IndexedState<S, S, S>;
  replace<SA, SB>(sb: SB): IndexedState<SA, SB, void>;
  modify<SA, SB>(f: (s: SA) => SB): IndexedState<SA, SB, void>;

  // -- Instances

  Monad<S>(): Monad<IndexedStateF<S, S>>;
  MonadState<S>(): MonadState<IndexedStateF<S, S>, S>;
}

IndexedState.pure = IndexedReaderWriterState.pure;
IndexedState.state = IndexedState;
IndexedState.get = () => IndexedState(s => [s, s]);
IndexedState.modify = f => IndexedState(s => [f(s), undefined]);
IndexedState.replace = s => IndexedState.modify(() => s);

IndexedState.Monad = IndexedReaderWriterState.Monad;
IndexedState.MonadState = IndexedReaderWriterState.MonadState;

// -- HKT

export type IndexedStateF<SA, SB> = $<
  IndexedReaderWriterStateF,
  [never, SA, SB, unknown, never]
>;

export type IndexedStateFA<A> = λ<
  IndexedReaderWriterStateF,
  [Fix<never>, α, β, Fix<unknown>, Fix<never>, Fix<A>]
>;
