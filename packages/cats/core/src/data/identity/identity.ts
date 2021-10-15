import { $type, TyK, TyVar } from '@cats4ts/core';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { Either } from '../either';

import { pure } from './constructors';
import {
  identityApplicative,
  identityApply,
  identityFlatMap,
  identityFoldable,
  identityFunctor,
  identityMonad,
  identityTraversable,
} from './instances';
import { tailRecM } from './operators';

export type Identity<A> = A;

export const Identity: IdentityObj = function <A>(a: A): Identity<A> {
  return pure(a);
} as any;

interface IdentityObj {
  <A>(a: A): Identity<A>;
  pure<A>(a: A): Identity<A>;
  unit: Identity<void>;
  tailRecM: <A>(
    a: A,
  ) => <B>(f: (a: A) => Identity<Either<A, B>>) => Identity<B>;

  readonly Functor: Functor<IdentityK>;
  readonly Apply: Apply<IdentityK>;
  readonly Applicative: Applicative<IdentityK>;
  readonly FlatMap: FlatMap<IdentityK>;
  readonly Monad: Monad<IdentityK>;
  readonly Foldable: Foldable<IdentityK>;
  readonly Traversable: Traversable<IdentityK>;
}

Identity.pure = pure;
Identity.unit = pure(undefined);
Identity.tailRecM = tailRecM;

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
Object.defineProperty(Identity, 'Foldable', {
  get(): Foldable<IdentityK> {
    return identityFoldable();
  },
});
Object.defineProperty(Identity, 'Traversable', {
  get(): Traversable<IdentityK> {
    return identityTraversable();
  },
});

// HKT

export interface IdentityK extends TyK<[unknown]> {
  [$type]: TyVar<this, 0>;
}
