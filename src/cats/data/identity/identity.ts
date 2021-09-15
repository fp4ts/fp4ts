import { TyK, _ } from '../../../core';
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

  readonly Functor: Functor<IdentityK>;
  readonly Apply: Apply<IdentityK>;
  readonly Applicative: Applicative<IdentityK>;
  readonly FlatMap: FlatMap<IdentityK>;
  readonly Monad: Monad<IdentityK>;
}

Identity.pure = pure;
Identity.unit = pure(undefined);

// -- Instances

Object.defineProperty(Identity, 'Functor', {
  get(): Functor<IdentityK> {
    return identityFunctor();
  },
});

Object.defineProperty(Identity, 'Apply', {
  get(): Apply<IdentityK> {
    return identityApply();
  },
});

Object.defineProperty(Identity, 'Applicative', {
  get(): Applicative<IdentityK> {
    return identityApplicative();
  },
});

Object.defineProperty(Identity, 'FlatMap', {
  get(): FlatMap<IdentityK> {
    return identityFlatMap();
  },
});

Object.defineProperty(Identity, 'Monad', {
  get(): Monad<IdentityK> {
    return identityMonad();
  },
});

// HKT

export const IdentityURI = 'cats/data/identity';
export type IdentityURI = typeof IdentityURI;
export type IdentityK = TyK<IdentityURI, [_]>;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [IdentityURI]: Identity<Tys[0]>;
  }
}
