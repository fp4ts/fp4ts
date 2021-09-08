import { Applicative2C, Applicative2 } from '../../applicative';
import { Apply2C, Apply2 } from '../../apply';
import { FlatMap2C, FlatMap2 } from '../../flat-map';
import { Functor2C, Functor2 } from '../../functor';
import { Monad2C, Monad2 } from '../../monad';

import { State as StateBase } from './algebra';
import { get, pure, set, modify, update, updateAndGet } from './constructors';
import {
  stateApplicative2,
  stateApplicative2C,
  stateApply2,
  stateApply2C,
  stateFlatMap2,
  stateFlatMap2C,
  stateFunctor2,
  stateFunctor2C,
  stateMonad2,
  stateMonad2C,
} from './instances';

export type State<S, A> = StateBase<S, A>;

export const State: StateObj = {
  pure: pure,
  get: get,
  set: set,

  update: update,
  updateAndGet: updateAndGet,
  modify: modify,

  Functor2C<S>(): Functor2C<URI, S> {
    return stateFunctor2C();
  },
  Apply2C<S>(): Apply2C<URI, S> {
    return stateApply2C();
  },
  Applicative2C<S>(): Applicative2C<URI, S> {
    return stateApplicative2C();
  },
  FlatMap2C<S>(): FlatMap2C<URI, S> {
    return stateFlatMap2C();
  },
  Monad2C<S>(): Monad2C<URI, S> {
    return stateMonad2C();
  },
} as any;

export interface StateObj {
  pure<S, A>(a: A): State<S, A>;
  get<S>(): State<S, S>;
  set<S>(s: S): State<S, void>;

  update<S>(f: (s: S) => S): State<S, void>;
  updateAndGet<S>(f: (s: S) => S): State<S, S>;
  modify<S, A>(f: (s: S) => [S, A]): State<S, A>;

  Functor2C<S>(): Functor2C<URI, S>;
  Apply2C<S>(): Apply2C<URI, S>;
  Applicative2C<S>(): Applicative2C<URI, S>;
  FlatMap2C<S>(): FlatMap2C<URI, S>;
  Monad2C<S>(): Monad2C<URI, S>;
  readonly FunctorK2: Functor2<URI>;
  readonly Apply2: Apply2<URI>;
  readonly Applicative2: Applicative2<URI>;
  readonly FlatMap2: FlatMap2<URI>;
  readonly Monad2: Monad2<URI>;
}

Object.defineProperty(State, 'Functor2', {
  get(): Functor2<URI> {
    return stateFunctor2();
  },
});
Object.defineProperty(State, 'Apply2', {
  get(): Apply2<URI> {
    return stateApply2();
  },
});
Object.defineProperty(State, 'Applicative2', {
  get(): Applicative2<URI> {
    return stateApplicative2();
  },
});
Object.defineProperty(State, 'FlatMap2', {
  get(): FlatMap2<URI> {
    return stateFlatMap2();
  },
});
Object.defineProperty(State, 'Monad2', {
  get(): Monad2<URI> {
    return stateMonad2();
  },
});

// HKT

export const URI = 'cats/data/state';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind2<E, A> {
    [URI]: State<E, A>;
  }
}
