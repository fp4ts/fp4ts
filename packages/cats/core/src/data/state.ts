// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Monad } from '../monad';
import {
  IndexedReaderWriterState,
  IndexedReaderWriterStateF,
} from './indexed-reader-writer-state';

export type State<S, A> = IndexedReaderWriterState<
  never,
  S,
  S,
  unknown,
  never,
  A
>;

export const State: StateObj = function (f) {
  return IndexedReaderWriterState.state(f);
};

interface StateObj {
  <S, A>(f: (s: S) => [S, A]): State<S, A>;
  pure<A, S>(a: A): State<S, A>;
  state<S, A>(f: (s: S) => [S, A]): State<S, A>;

  get<S>(): State<S, S>;
  replace<S>(s: S): State<S, void>;
  modify<S>(f: (s: S) => S): State<S, void>;

  // -- Instances

  Monad<S>(): Monad<StateF<S>>;
}

State.pure = IndexedReaderWriterState.pure;
State.state = State;
State.get = () => State(s => [s, s]);
State.modify = f => State(s => [f(s), undefined]);
State.replace = s => State.modify(() => s);

State.Monad = IndexedReaderWriterState.Monad;

// -- HKT

export type StateF<S> = $<
  IndexedReaderWriterStateF,
  [never, S, S, unknown, never]
>;
