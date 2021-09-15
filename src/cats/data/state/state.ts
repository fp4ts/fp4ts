import { $, TyK, _ } from '../../../core';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { State as StateBase } from './algebra';
import {
  get,
  pure,
  set,
  modify,
  update,
  updateAndGet,
  unit,
} from './constructors';
import {
  stateApplicative,
  stateApply,
  stateFlatMap,
  stateFunctor,
  stateMonad,
} from './instances';

export type State<S, A> = StateBase<S, A>;

export const State: StateObj = {
  pure: pure,
  get: get,
  set: set,
  unit: unit,

  update: update,
  updateAndGet: updateAndGet,
  modify: modify,
} as any;

export interface StateObj {
  pure<S, A>(a: A): State<S, A>;
  unit<S>(): State<S, void>;
  get<S>(): State<S, S>;
  set<S>(s: S): State<S, void>;

  update<S>(f: (s: S) => S): State<S, void>;
  updateAndGet<S>(f: (s: S) => S): State<S, S>;
  modify<S, A>(f: (s: S) => [S, A]): State<S, A>;

  Functor<S>(): Functor<$<StateK, [S]>>;
  Apply<S>(): Apply<$<StateK, [S]>>;
  Applicative<S>(): Applicative<$<StateK, [S]>>;
  FlatMap<S>(): FlatMap<$<StateK, [S]>>;
  Monad<S>(): Monad<$<StateK, [S]>>;
}

State.Functor = stateFunctor;
State.Apply = stateApply;
State.Applicative = stateApplicative;
State.FlatMap = stateFlatMap;
State.Monad = stateMonad;

// HKT

export const StateURI = 'cats/data/state';
export type StateURI = typeof StateURI;
export type StateK = TyK<StateURI, [_, _]>;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [StateURI]: State<Tys[0], Tys[1]>;
  }
}
