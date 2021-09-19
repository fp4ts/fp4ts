import { TyK, _ } from '@cats4ts/core';
import {
  SemigroupK,
  MonoidK,
  Functor,
  FunctorFilter,
  Apply,
  Applicative,
  FlatMap,
  Monad,
  Foldable,
  Traversable,
} from '@cats4ts/cats-core';

import { Either } from '../../either';
import { List } from '../list';

import { Vector as VectorBase } from './algebra';
import { empty, fromArray, fromList, pure, singleton } from './constructors';
import {
  vectorApplicative,
  vectorApply,
  vectorFlatMap,
  vectorFoldable,
  vectorFunctor,
  vectorFunctorFilter,
  vectorMonad,
  vectorMonoidK,
  vectorSemigroupK,
  vectorTraversable,
} from './instances';
import { tailRecM } from './operators';

export type Vector<A> = VectorBase<A>;

export const Vector: VectorObj = function <A>(...xs: A[]): Vector<A> {
  return fromArray(xs);
} as any;

interface VectorObj {
  <A>(...xs: A[]): Vector<A>;

  pure<A>(x: A): Vector<A>;
  singleton<A>(x: A): Vector<A>;
  empty: Vector<never>;

  fromArray<A>(xs: A[]): Vector<A>;
  fromList<A>(xs: List<A>): Vector<A>;

  tailRecM<A>(a: A): <B>(f: (a: A) => Vector<Either<A, B>>) => Vector<B>;

  // -- Instances

  SemigroupK: SemigroupK<VectorK>;
  MonoidK: MonoidK<VectorK>;
  Functor: Functor<VectorK>;
  FunctorFilter: FunctorFilter<VectorK>;
  Apply: Apply<VectorK>;
  Applicative: Applicative<VectorK>;
  FlatMap: FlatMap<VectorK>;
  Monad: Monad<VectorK>;
  Foldable: Foldable<VectorK>;
  Traversable: Traversable<VectorK>;
}

Vector.pure = pure;
Vector.singleton = singleton;
Vector.empty = empty;
Vector.fromArray = fromArray;
Vector.fromList = fromList;

Vector.tailRecM = tailRecM;

Object.defineProperty(Vector, 'SemigroupK', {
  get(): SemigroupK<VectorK> {
    return vectorSemigroupK();
  },
});
Object.defineProperty(Vector, 'MonoidK', {
  get(): MonoidK<VectorK> {
    return vectorMonoidK();
  },
});
Object.defineProperty(Vector, 'Functor', {
  get(): Functor<VectorK> {
    return vectorFunctor();
  },
});
Object.defineProperty(Vector, 'FunctorFilter', {
  get(): FunctorFilter<VectorK> {
    return vectorFunctorFilter();
  },
});
Object.defineProperty(Vector, 'Apply', {
  get(): Apply<VectorK> {
    return vectorApply();
  },
});
Object.defineProperty(Vector, 'Applicative', {
  get(): Applicative<VectorK> {
    return vectorApplicative();
  },
});
Object.defineProperty(Vector, 'FlatMap', {
  get(): FlatMap<VectorK> {
    return vectorFlatMap();
  },
});
Object.defineProperty(Vector, 'Monad', {
  get(): Monad<VectorK> {
    return vectorMonad();
  },
});
Object.defineProperty(Vector, 'Foldable', {
  get(): Foldable<VectorK> {
    return vectorFoldable();
  },
});
Object.defineProperty(Vector, 'Traversable', {
  get(): Traversable<VectorK> {
    return vectorTraversable();
  },
});

// -- HKT

export const VectorURI = 'cats/data/collections/vector';
export type VectorURI = typeof VectorURI;
export type VectorK = TyK<VectorURI, [_]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [VectorURI]: Vector<Tys[0]>;
  }
}
