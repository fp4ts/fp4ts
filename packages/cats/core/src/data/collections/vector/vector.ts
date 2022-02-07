// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Align } from '../../../align';
import { Apply } from '../../../apply';
import { Alternative } from '../../../alternative';
import { Applicative } from '../../../applicative';
import { FlatMap } from '../../../flat-map';
import { Monad } from '../../../monad';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';

import { Either } from '../../either';
import { List } from '../list';

import { Vector as VectorBase } from './algebra';
import {
  empty,
  fromArray,
  fromIterator,
  fromList,
  pure,
  range,
  singleton,
} from './constructors';
import {
  vectorAlign,
  vectorAlternative,
  vectorApplicative,
  vectorApply,
  vectorEq,
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
  fromIterator<A>(xs: Iterator<A>): Vector<A>;

  range(from: number, to: number): Vector<number>;

  tailRecM<A>(a: A): <B>(f: (a: A) => Vector<Either<A, B>>) => Vector<B>;

  // -- Instances

  Eq<A>(E: Eq<A>): Eq<Vector<A>>;
  readonly SemigroupK: SemigroupK<VectorK>;
  readonly MonoidK: MonoidK<VectorK>;
  readonly Functor: Functor<VectorK>;
  readonly Align: Align<VectorK>;
  readonly FunctorFilter: FunctorFilter<VectorK>;
  readonly Apply: Apply<VectorK>;
  readonly Applicative: Applicative<VectorK>;
  readonly Alternative: Alternative<VectorK>;
  readonly FlatMap: FlatMap<VectorK>;
  readonly Monad: Monad<VectorK>;
  readonly Foldable: Foldable<VectorK>;
  readonly Traversable: Traversable<VectorK>;
}

Vector.pure = pure;
Vector.singleton = singleton;
Vector.empty = empty;
Vector.fromArray = fromArray;
Vector.fromList = fromList;
Vector.fromIterator = fromIterator;

Vector.range = range;

Vector.tailRecM = tailRecM;

Vector.Eq = vectorEq;
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
Object.defineProperty(Vector, 'Align', {
  get(): Align<VectorK> {
    return vectorAlign();
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
Object.defineProperty(Vector, 'Alternative', {
  get(): Alternative<VectorK> {
    return vectorAlternative();
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

/**
 * @category Type Constructor
 * @category Collection
 */
export interface VectorK extends TyK<[unknown]> {
  [$type]: Vector<TyVar<this, 0>>;
}
