// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT2, Kind } from '@fp4ts/core';
import { Profunctor, ProfunctorRequirements } from './profunctor';

/**
 * @category Type Class
 */
export interface Strong<F> extends Profunctor<F> {
  readonly first: <A, B, C>(fab: Kind<F, [A, B]>) => Kind<F, [[A, C], [B, C]]>;
  readonly second: <A, B, C>(fab: Kind<F, [A, B]>) => Kind<F, [[C, A], [C, B]]>;
}

export type StrongRequirements<F> = Pick<Strong<F>, 'first' | 'second'> &
  ProfunctorRequirements<F> &
  Partial<Strong<F>>;

function of<F>(F: StrongRequirements<F>): Strong<F>;
function of<F>(F: StrongRequirements<HKT2<F>>): Strong<HKT2<F>> {
  return {
    ...Profunctor.of(F),
    ...F,
  };
}

export const Strong = Object.freeze({
  of,
});
