// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Category } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ComposeLaws } from './compose-laws';

export const CategoryLaws = <F>(F: Category<F>) => ({
  ...ComposeLaws(F),

  categoryLeftIdentity: <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [A, B]>> =>
    new IsEq(F.andThen_(F.id(), fab), fab),

  categoryRightIdentity: <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [A, B]>> =>
    new IsEq(F.andThen_(fab, F.id()), fab),
});
