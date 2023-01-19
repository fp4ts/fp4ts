// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Compose } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const ComposeLaws = <F>(F: Compose<F>) => ({
  composeAssociativity: <A, B, C, D>(
    fab: Kind<F, [A, B]>,
    fbc: Kind<F, [B, C]>,
    fcd: Kind<F, [C, D]>,
  ): IsEq<Kind<F, [A, D]>> =>
    new IsEq(
      F.andThen_(fab, F.andThen_(fbc, fcd)),
      F.andThen_(F.andThen_(fab, fbc), fcd),
    ),
});
