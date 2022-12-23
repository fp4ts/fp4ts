// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { CommutativeSemigroup } from '@fp4ts/cats-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';
import { SemigroupLaws } from './semigroup-laws';

export const CommutativeSemigroupLaws = <A>(S: CommutativeSemigroup<A>) => ({
  ...SemigroupLaws(S),

  commutative: (x: A, y: A): IsEq<A> =>
    new IsEq(S.combine_(x, y), S.combine_(y, x)),
});
