// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { MonadDefer } from '@fp4ts/cats-core';
import { MonadState } from '../monad-state';
import { IxRWS, IxRWSF, RWS } from './ix-rws';

export type State<S, A> = IxRWS<unknown, never, S, S, A>;

export const State: StateObj = function (runState) {
  return State.state(runState);
};

interface StateObj {
  <S, A>(runIxState: (s1: S) => [A, S]): State<S, A>;
  pure<S, A>(a: A): State<S, A>;
  state<S, A>(f: (s1: S) => [A, S]): State<S, A>;

  get<S>(): State<S, S>;
  set<S>(s: S): State<S, void>;
  modify<S>(f: (s1: S) => S): State<S, void>;

  // -- Instances

  Monad<S>(): MonadDefer<StateF<S>>;
  MonadState<S>(): MonadState<StateF<S>, S>;
}

State.pure = RWS.pure;
State.state = RWS.state;
State.get = RWS.get;
State.set = RWS.set;
State.modify = RWS.modify;

State.Monad = RWS.Monad;
State.MonadState = RWS.MonadState;

// -- HKT

export type StateF<S> = $<IxRWSF, [unknown, never, S, S]>;
