// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, instance, Kind, Lazy } from '@fp4ts/core';
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
export const SemigroupK = Object.freeze({
  of: <F>(F: SemigroupKRequirements<F>): SemigroupK<F> =>
    instance<SemigroupK<F>>({
      combineK: y => x => F.combineK_(x, y),
      algebra: () => ({
        combine: F.combineK ?? (y => x => F.combineK_(x, y)),
        combine_: F.combineK_,
      }),
      ...F,
    }),
});
