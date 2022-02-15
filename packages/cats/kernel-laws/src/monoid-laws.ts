// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monoid } from '@fp4ts/cats-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';
import { SemigroupLaws } from './semigroup-laws';

export const MonoidLaws = <M>(M: Monoid<M>): MonoidLaws<M> => ({
  ...SemigroupLaws(M),

  monoidRightIdentity: (x: M): IsEq<M> =>
    new IsEq(
      M.combine_(x, () => M.empty),
      x,
    ),

  monoidLeftIdentity: (x: M): IsEq<M> =>
    new IsEq(
      M.combine_(M.empty, () => x),
      x,
    ),
});

export interface MonoidLaws<A> extends SemigroupLaws<A> {
  monoidRightIdentity(x: A): IsEq<A>;

  monoidLeftIdentity(x: A): IsEq<A>;
}
