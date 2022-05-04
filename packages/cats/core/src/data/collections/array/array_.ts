// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { EqK } from '../../../eq-k';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Align } from '../../../align';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { FlatMap } from '../../../flat-map';
import { CoflatMap } from '../../../coflat-map';
import { Monad } from '../../../monad';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';

import {
  arrayAlign,
  arrayAlternative,
  arrayApplicative,
  arrayApply,
  arrayCoflatMap,
  arrayEq,
  arrayEqK,
  arrayFlatMap,
  arrayFoldableWithIndex,
  arrayFunctorWithIndex,
  arrayFunctorFilter,
  arrayMonad,
  arrayMonoidK,
  arraySemigroupK,
  arrayTraversableWithIndex,
} from './instances';
import { ArrayF } from './array';

export const Array = {
  EqK: arrayEqK,
  Align: arrayAlign,
  Apply: arrayApply,
  Eq: arrayEq,
  SemigroupK: arraySemigroupK,
  MonoidK: arrayMonoidK,
  FunctorWithIndex: arrayFunctorWithIndex,
  FunctorFilter: arrayFunctorFilter,
  Applicative: arrayApplicative,
  Alternative: arrayAlternative,
  FlatMap: arrayFlatMap,
  CoflatMap: arrayCoflatMap,
  Monad: arrayMonad,
  FoldableWithIndex: arrayFoldableWithIndex,
  TraversableWithIndex: arrayTraversableWithIndex,
};
interface Array {
  // -- Instances
  Eq<A>(A: Eq<A>): Eq<A[]>;
  EqK: EqK<ArrayF>;
  SemigroupK: SemigroupK<ArrayF>;
  MonoidK: MonoidK<ArrayF>;
  Align: Align<ArrayF>;
  Functor: Functor<ArrayF>;
  FunctorFilter: FunctorFilter<ArrayF>;
  Apply: Apply<ArrayF>;
  Applicative: Applicative<ArrayF>;
  Alternative: Alternative<ArrayF>;
  FlatMap: FlatMap<ArrayF>;
  CoflatMap: CoflatMap<ArrayF>;
  Monad: Monad<ArrayF>;
  Foldable: Foldable<ArrayF>;
  Traversable: Traversable<ArrayF>;
}
