// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { MonoidK } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { SemigroupKLaws } from './semigroup-k-laws';

export interface MonoidKLaws<F> extends SemigroupKLaws<F> {
  monoidKLeftIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  monoidKRightIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;
}

export const MonoidKLaws = <F>(F: MonoidK<F>): MonoidKLaws<F> => ({
  ...SemigroupKLaws(F),

  monoidKLeftIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.combineK_(fa, F.emptyK()), fa),

  monoidKRightIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(fa, F.combineK_(F.emptyK(), fa)),
});
