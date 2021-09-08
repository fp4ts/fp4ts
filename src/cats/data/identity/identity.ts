import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { Identity as IdentityBase } from './algebra';
import { pure } from './constructors';
import {
  identityApplicative,
  identityApply,
  identityFlatMap,
  identityFunctor,
  identityMonad,
} from './instances';

export type Identity<A> = IdentityBase<A>;

export const Identity: IdentityObj = function <A>(a: A): Identity<A> {
  return pure(a);
} as any;

interface IdentityObj {
  <A>(a: A): Identity<A>;
  pure<A>(a: A): Identity<A>;
  unit: Identity<void>;

  readonly Functor: Functor<URI>;
  readonly Apply: Apply<URI>;
  readonly Applicative: Applicative<URI>;
  readonly FlatMap: FlatMap<URI>;
  readonly Monad: Monad<URI>;
}

Identity.pure = pure;
Identity.unit = pure(undefined);

// -- Instances

Object.defineProperty(Identity, 'Functor', {
  get(): Functor<URI> {
    return identityFunctor();
  },
});

Object.defineProperty(Identity, 'Apply', {
  get(): Apply<URI> {
    return identityApply();
  },
});

Object.defineProperty(Identity, 'Applicative', {
  get(): Applicative<URI> {
    return identityApplicative();
  },
});

Object.defineProperty(Identity, 'FlatMap', {
  get(): FlatMap<URI> {
    return identityFlatMap();
  },
});

Object.defineProperty(Identity, 'Monad', {
  get(): Monad<URI> {
    return identityMonad();
  },
});

// HKT

export const URI = 'cats/data/id';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Identity<A>;
  }
}
