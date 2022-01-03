// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative } from '@fp4ts/cats';
import { Unique } from '@fp4ts/effect-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';

export const UniqueLaws = <F>(
  F: Unique<F> & Applicative<F>,
): UniqueLaws<F> => ({
  uniqueness: (): IsEq<Kind<F, [boolean]>> =>
    new IsEq(
      F.map2_(F.unique, F.unique)((l, r) => l.notEquals(r)),
      F.pure(true),
    ),
});

export interface UniqueLaws<F> {
  readonly uniqueness: () => IsEq<Kind<F, [boolean]>>;
}
