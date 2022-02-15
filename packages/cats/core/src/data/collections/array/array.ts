// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
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
    SemigroupK: SemigroupK<ArrayF>;
    MonoidK: MonoidK<ArrayF>;
    Align: Align<ArrayF>;
    Functor: Functor<ArrayF>;
    FunctorFilter: FunctorFilter<ArrayF>;
    Apply: Apply<ArrayF>;
    Applicative: Applicative<ArrayF>;
    Alternative: Alternative<ArrayF>;
    FlatMap: FlatMap<ArrayF>;
    Monad: Monad<ArrayF>;
    Foldable: Foldable<ArrayF>;
    Traversable: Traversable<ArrayF>;
  }
}

Array.of = of;
Array.empty = empty;

Array.Eq = arrayEq;
Object.defineProperty(Array, 'SemigroupK', {
  get(): SemigroupK<ArrayF> {
    return arraySemigroupK();
  },
});
Object.defineProperty(Array, 'MonoidK', {
  get(): MonoidK<ArrayF> {
    return arrayMonoidK();
  },
});
Object.defineProperty(Array, 'Align', {
  get(): Align<ArrayF> {
    return arrayAlign();
  },
});
Object.defineProperty(Array, 'Functor', {
  get(): Functor<ArrayF> {
    return arrayFunctor();
  },
});
Object.defineProperty(Array, 'FunctorFilter', {
  get(): FunctorFilter<ArrayF> {
    return arrayFunctorFilter();
  },
});
Object.defineProperty(Array, 'Apply', {
  get(): Apply<ArrayF> {
    return arrayApply();
  },
});
Object.defineProperty(Array, 'Applicative', {
  get(): Applicative<ArrayF> {
    return arrayApplicative();
  },
});
Object.defineProperty(Array, 'Alternative', {
  get(): Alternative<ArrayF> {
    return arrayAlternative();
  },
});
Object.defineProperty(Array, 'FlatMap', {
  get(): FlatMap<ArrayF> {
    return arrayFlatMap();
  },
});
Object.defineProperty(Array, 'Monad', {
  get(): Monad<ArrayF> {
    return arrayMonad();
  },
});
Object.defineProperty(Array, 'Foldable', {
  get(): Foldable<ArrayF> {
    return arrayFoldable();
  },
});
Object.defineProperty(Array, 'Traversable', {
  get(): Traversable<ArrayF> {
    return arrayTraversable();
  },
});

// HKT

/**
 * @category Type Constructor
 * @category Collection
 */
export interface ArrayF extends TyK<[unknown]> {
  [$type]: Array<TyVar<this, 0>>;
}
