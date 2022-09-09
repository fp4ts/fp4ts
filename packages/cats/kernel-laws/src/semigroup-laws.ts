// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Semigroup } from '@fp4ts/cats-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';

export const SemigroupLaws = <A>(S: Semigroup<A>) => ({
  semigroupAssociativity: (x: A, y: A, z: A): IsEq<A> =>
    new IsEq(
      S.combine_(
        S.combine_(x, () => y),
        () => z,
      ),
      S.combine_(x, () => S.combine_(y, () => z)),
    ),

  semigroupDualDualIsIdentity: (x: A, y: A): IsEq<A> =>
    new IsEq(
      S.dual()
        .dual()
        .combine_(x, () => y),
      S.combine_(x, () => y),
    ),
});
