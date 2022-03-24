// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, HKT1, instance, Kind, Lazy } from '@fp4ts/core';
import { Semigroup } from '@fp4ts/cats-kernel';

/**
 * @category Type Class
 */
export interface SemigroupK<F> extends Base<F> {
  readonly combineK: <A>(
    y: Lazy<Kind<F, [A]>>,
  ) => (x: Kind<F, [A]>) => Kind<F, [A]>;
  readonly combineK_: <A>(
    x: Kind<F, [A]>,
    y: Lazy<Kind<F, [A]>>,
  ) => Kind<F, [A]>;

  readonly algebra: <A>() => Semigroup<Kind<F, [A]>>;
}

export type SemigroupKRequirements<F> = Pick<SemigroupK<F>, 'combineK_'> &
  Partial<SemigroupK<F>>;
function of<F>(F: SemigroupKRequirements<F>): SemigroupK<F>;
function of<F>(F: SemigroupKRequirements<HKT1<F>>): SemigroupK<HKT1<F>> {
  return instance<SemigroupK<HKT1<F>>>({
    combineK: y => x => F.combineK_(x, y),
    algebra: () => ({
      combine: F.combineK ?? (y => x => F.combineK_(x, y)),
      combine_: F.combineK_,
    }),
    ...F,
  });
}
export const SemigroupK = Object.freeze({
  of,
});
