// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { ExhaustiveCheck } from './exhaustive-check';

export const fn1Eq = <A, B>(
  ec: ExhaustiveCheck<A>,
  EqB: Eq<B>,
): Eq<(a: A) => B> =>
  Eq.of({
    equals: (fx, fy) => ec.allValues.all(a => EqB.equals(fx(a), fy(a))),
  });
