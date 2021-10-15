import { $, $type, TyK, TyVar } from '@cats4ts/core';
import { Functor } from '../../functor';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

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

export interface StateK extends TyK<[unknown, unknown]> {
  [$type]: State<TyVar<this, 0>, TyVar<this, 1>>;
}
