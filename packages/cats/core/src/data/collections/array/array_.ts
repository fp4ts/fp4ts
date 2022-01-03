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
import { ArrayK } from './array';

export const Array = {
  Align: arrayAlign,
  Apply: arrayApply,
  Eq: arrayEq,
  SemigroupK: arraySemigroupK,
  MonoidK: arrayMonoidK,
  Functor: arrayFunctor,
  FunctorFilter: arrayFunctorFilter,
  Applicative: arrayApplicative,
  Alternative: arrayAlternative,
  FlatMap: arrayFlatMap,
  Monad: arrayMonad,
  Foldable: arrayFoldable,
  Traversable: arrayTraversable,
};
interface Array {
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
