// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind } from '@fp4ts/core';
import { Arrow, ArrowRequirements } from './arrow';

export interface ArrowApply<F> extends Arrow<F> {
  app<A, B>(): Kind<F, [[Kind<F, [A, B]>, A], B]>;
}

export type ArrowApplyRequirements<F> = Pick<ArrowApply<F>, 'app'> &
  ArrowRequirements<F> &
  Partial<ArrowApply<F>>;
export const ArrowApply = Object.freeze({
  of: <F>(F: ArrowApplyRequirements<F>): ArrowApply<F> =>
    instance<ArrowApply<F>>({
      ...Arrow.of(F),
      ...F,
    }),
});
