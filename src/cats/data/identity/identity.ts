import { URI } from '../../../core';
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

  readonly Functor: Functor<[URI<IdentityURI>]>;
  readonly Apply: Apply<[URI<IdentityURI>]>;
  readonly Applicative: Applicative<[URI<IdentityURI>]>;
  readonly FlatMap: FlatMap<[URI<IdentityURI>]>;
  readonly Monad: Monad<[URI<IdentityURI>]>;
}

Identity.pure = pure;
Identity.unit = pure(undefined);

// -- Instances

Object.defineProperty(Identity, 'Functor', {
  get(): Functor<[URI<IdentityURI>]> {
    return identityFunctor();
  },
});

Object.defineProperty(Identity, 'Apply', {
  get(): Apply<[URI<IdentityURI>]> {
    return identityApply();
  },
});

Object.defineProperty(Identity, 'Applicative', {
  get(): Applicative<[URI<IdentityURI>]> {
    return identityApplicative();
  },
});

Object.defineProperty(Identity, 'FlatMap', {
  get(): FlatMap<[URI<IdentityURI>]> {
    return identityFlatMap();
  },
});

Object.defineProperty(Identity, 'Monad', {
  get(): Monad<[URI<IdentityURI>]> {
    return identityMonad();
  },
});

// HKT

export const IdentityURI = 'cats/data/identity';
export type IdentityURI = typeof IdentityURI;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<FC, S, R, E, A> {
    [IdentityURI]: Identity<A>;
  }
}
