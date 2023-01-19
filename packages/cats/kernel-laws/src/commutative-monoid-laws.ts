// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { CommutativeMonoid } from '@fp4ts/cats-kernel';
import { MonoidLaws } from './monoid-laws';
import { CommutativeSemigroupLaws } from './commutative-semigroup-laws';

export const CommutativeMonoidLaws = <A>(S: CommutativeMonoid<A>) => ({
  ...CommutativeSemigroupLaws(S),
  ...MonoidLaws(S),
});
