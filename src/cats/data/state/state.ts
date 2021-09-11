import { URI } from '../../../core';
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
  Variance,
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

  readonly FunctorK: Functor<[URI<StateURI, Variance>], Variance>;
  readonly Apply: Apply<[URI<StateURI, Variance>], Variance>;
  readonly Applicative: Applicative<[URI<StateURI, Variance>], Variance>;
  readonly FlatMap: FlatMap<[URI<StateURI, Variance>], Variance>;
  readonly Monad: Monad<[URI<StateURI, Variance>], Variance>;
}

Object.defineProperty(State, 'Functor', {
  get(): Functor<[URI<StateURI, Variance>], Variance> {
    return stateFunctor();
  },
});
Object.defineProperty(State, 'Apply', {
  get(): Apply<[URI<StateURI, Variance>], Variance> {
    return stateApply();
  },
});
Object.defineProperty(State, 'Applicative', {
  get(): Applicative<[URI<StateURI, Variance>], Variance> {
    return stateApplicative();
  },
});
Object.defineProperty(State, 'FlatMap', {
  get(): FlatMap<[URI<StateURI, Variance>], Variance> {
    return stateFlatMap();
  },
});
Object.defineProperty(State, 'Monad', {
  get(): Monad<[URI<StateURI, Variance>], Variance> {
    return stateMonad();
  },
});

// HKT

export const StateURI = 'cats/data/state';
export type StateURI = typeof StateURI;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<FC, S, R, E, A> {
    [StateURI]: State<S, A>;
  }
}
