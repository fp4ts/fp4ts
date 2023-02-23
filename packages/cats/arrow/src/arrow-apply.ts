// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { MonadDefer } from '@fp4ts/cats-core';
import { Arrow, ArrowRequirements } from './arrow';
import { functionArrowApply } from './instances/function';
import { kleisliArrowApply } from './instances/kleisli';

/**
 * @category Type Class
 * @category Arrow
 */
export interface ArrowApply<P> extends Arrow<P> {
  app<A, B>(): Kind<P, [[Kind<P, [A, B]>, A], B]>;
}

export type ArrowApplyRequirements<P> = Pick<ArrowApply<P>, 'app'> &
  ArrowRequirements<P> &
  Partial<ArrowApply<P>>;
export const ArrowApply = Object.freeze({
  of: <P>(P: ArrowApplyRequirements<P>): ArrowApply<P> => ({
    ...Arrow.of(P),
    ...P,
  }),

  get Function1() {
    return functionArrowApply();
  },

  Kleisli: <F>(F: MonadDefer<F>) => kleisliArrowApply(F),
});
