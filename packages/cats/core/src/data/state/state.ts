import { $, TyK, _ } from '@cats4ts/core';

import {
  Applicative,
  Apply,
  FlatMap,
  Functor,
  Monad,
} from '@cats4ts/cats-core';

import { Either } from '../either';

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
import { tailRecM } from './operators';

export type State<S, A> = StateBase<S, A>;

export const State: StateObj = {
  pure: pure,
  get: get,
  set: set,
  unit: unit,

  tailRecM: tailRecM,

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

  tailRecM<A>(a: A): <S, B>(f: (a: A) => State<S, Either<A, B>>) => State<S, B>;

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

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [StateURI]: State<Tys[0], Tys[1]>;
  }
}
