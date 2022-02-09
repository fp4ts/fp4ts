// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Align } from '../../../align';
import { Alternative } from '../../../alternative';
import { Applicative } from '../../../applicative';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Monad } from '../../../monad';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';
import { MonoidK } from '../../../monoid-k';

import { List } from '../list';

import { Vector as VectorBase } from './algebra';
import { fromArray, fromIterator, fromList, pure } from './constructors';
import {
  vectorAlign,
  vectorAlternative,
  vectorApplicative,
  vectorEq,
  vectorFoldable,
  vectorFunctor,
  vectorFunctorFilter,
  vectorMonad,
  vectorMonoidK,
  vectorTraversable,
} from './instances';

export type Vector<A> = VectorBase<A>;

export const Vector: VectorObj = function <A>(...xs: A[]): Vector<A> {
  return fromArray(xs);
} as any;

interface VectorObj {
  <A>(...xs: A[]): Vector<A>;
  empty: Vector<never>;
  pure<A>(x: A): Vector<A>;
  fromArray<A>(xs: A[]): Vector<A>;
  fromList<A>(xs: List<A>): Vector<A>;
  fromIterator<A>(iter: Iterator<A>): Vector<A>;

  // -- Instances
  Eq<A>(E: Eq<A>): Eq<Vector<A>>;
  readonly MonoidK: MonoidK<VectorK>;
  readonly Align: Align<VectorK>;
  readonly Functor: Functor<VectorK>;
  readonly FunctorFilter: FunctorFilter<VectorK>;
  readonly Applicative: Applicative<VectorK>;
  readonly Alternative: Alternative<VectorK>;
  readonly Monad: Monad<VectorK>;
  readonly Foldable: Foldable<VectorK>;
  readonly Traversable: Traversable<VectorK>;
}

Object.defineProperty(Vector, 'empty', {
  get() {
    return VectorBase.empty;
  },
});
Vector.pure = pure;
Vector.fromArray = fromArray;
Vector.fromList = fromList;
Vector.fromIterator = fromIterator;

Vector.Eq = vectorEq;
Object.defineProperty(Vector, 'MonoidK', {
  get() {
    return vectorMonoidK();
  },
});
Object.defineProperty(Vector, 'Align', {
  get() {
    return vectorAlign();
  },
});
Object.defineProperty(Vector, 'Functor', {
  get() {
    return vectorFunctor();
  },
});
Object.defineProperty(Vector, 'FunctorFilter', {
  get() {
    return vectorFunctorFilter();
  },
});
Object.defineProperty(Vector, 'Applicative', {
  get() {
    return vectorApplicative();
  },
});
Object.defineProperty(Vector, 'Alternative', {
  get() {
    return vectorAlternative();
  },
});
Object.defineProperty(Vector, 'Monad', {
  get() {
    return vectorMonad();
  },
});
Object.defineProperty(Vector, 'Foldable', {
  get() {
    return vectorFoldable();
  },
});
Object.defineProperty(Vector, 'Traversable', {
  get() {
    return vectorTraversable();
  },
});

// -- HKT

export interface VectorK extends TyK<[unknown]> {
  [$type]: Vector<TyVar<this, 0>>;
}
