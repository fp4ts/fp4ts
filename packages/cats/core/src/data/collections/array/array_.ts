// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
  arrayTraversableFilter,
} from './instances';

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
  TraversableFilter: arrayTraversableFilter,
};
