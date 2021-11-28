// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '../../../eq';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Align } from '../../../align';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { FlatMap } from '../../../flat-map';
import { Monad } from '../../../monad';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';

import { empty, of } from './constructors';
import {
  arrayAlign,
  arrayAlternative,
  arrayApplicative,
  arrayApply,
  arrayEq,
  arrayFlatMap,
  arrayFoldable,
  arrayFunctor,
  arrayFunctorFilter,
  arrayMonad,
  arrayMonoidK,
  arraySemigroupK,
  arrayTraversable,
} from './instances';

declare global {
  interface ArrayConstructor {
    empty: Array<never>;
    of<T>(...xs: T[]): Array<T>;

    // -- Instances
    Eq<A>(A: Eq<A>): Eq<A[]>;
    SemigroupK: SemigroupK<ArrayK>;
    MonoidK: MonoidK<ArrayK>;
    Align: Align<ArrayK>;
    Functor: Functor<ArrayK>;
    FunctorFilter: FunctorFilter<ArrayK>;
    Apply: Apply<ArrayK>;
    Applicative: Applicative<ArrayK>;
    Alternative: Alternative<ArrayK>;
    FlatMap: FlatMap<ArrayK>;
    Monad: Monad<ArrayK>;
    Foldable: Foldable<ArrayK>;
    Traversable: Traversable<ArrayK>;
  }
}

Array.of = of;
Array.empty = empty;

Array.Eq = arrayEq;
Object.defineProperty(Array, 'SemigroupK', {
  get(): SemigroupK<ArrayK> {
    return arraySemigroupK();
  },
});
Object.defineProperty(Array, 'MonoidK', {
  get(): MonoidK<ArrayK> {
    return arrayMonoidK();
  },
});
Object.defineProperty(Array, 'Align', {
  get(): Align<ArrayK> {
    return arrayAlign();
  },
});
Object.defineProperty(Array, 'Functor', {
  get(): Functor<ArrayK> {
    return arrayFunctor();
  },
});
Object.defineProperty(Array, 'FunctorFilter', {
  get(): FunctorFilter<ArrayK> {
    return arrayFunctorFilter();
  },
});
Object.defineProperty(Array, 'Apply', {
  get(): Apply<ArrayK> {
    return arrayApply();
  },
});
Object.defineProperty(Array, 'Applicative', {
  get(): Applicative<ArrayK> {
    return arrayApplicative();
  },
});
Object.defineProperty(Array, 'Alternative', {
  get(): Alternative<ArrayK> {
    return arrayAlternative();
  },
});
Object.defineProperty(Array, 'FlatMap', {
  get(): FlatMap<ArrayK> {
    return arrayFlatMap();
  },
});
Object.defineProperty(Array, 'Monad', {
  get(): Monad<ArrayK> {
    return arrayMonad();
  },
});
Object.defineProperty(Array, 'Foldable', {
  get(): Foldable<ArrayK> {
    return arrayFoldable();
  },
});
Object.defineProperty(Array, 'Traversable', {
  get(): Traversable<ArrayK> {
    return arrayTraversable();
  },
});

// HKT

/**
 * @category Type Constructor
 * @category Collection
 */
export interface ArrayK extends TyK<[unknown]> {
  [$type]: Array<TyVar<this, 0>>;
}
