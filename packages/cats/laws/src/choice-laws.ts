// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Choice } from '@fp4ts/cats-core';
import { Either } from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';
import { CategoryLaws } from './category-laws';

export const ChoiceLaws = <F>(F: Choice<F>) => ({
  ...CategoryLaws(F),

  choiceCompositionDistributivity: <A, B, C, D>(
    fac: Kind<F, [A, C]>,
    fbc: Kind<F, [B, C]>,
    fcd: Kind<F, [C, D]>,
  ): IsEq<Kind<F, [Either<A, B>, D]>> =>
    new IsEq(
      F.andThen_(F.choice(fac, fbc), fcd),
      F.choice(F.andThen_(fac, fcd), F.andThen_(fbc, fcd)),
    ),
});
