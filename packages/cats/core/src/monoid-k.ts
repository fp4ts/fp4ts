// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT1, Kind } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { SemigroupK, SemigroupKRequirements } from './semigroup-k';

/**
 * @category Type Class
 */
export interface MonoidK<F> extends SemigroupK<F> {
  readonly emptyK: <A>() => Kind<F, [A]>;

  readonly algebra: <A>() => Monoid<Kind<F, [A]>>;
}
export type MonoidKRequirements<F> = Pick<MonoidK<F>, 'emptyK'> &
  SemigroupKRequirements<F> &
  Partial<MonoidK<F>>;

function of<F>(F: MonoidKRequirements<F>): MonoidK<F>;
function of<F>(F: MonoidKRequirements<HKT1<F>>): MonoidK<HKT1<F>> {
  return {
    ...SemigroupK.of(F),
    ...F,

    algebra: () => ({
      ...SemigroupK.of(F).algebra(),
      empty: F.emptyK(),
    }),
  };
}

export const MonoidK = Object.freeze({
  of,
});
