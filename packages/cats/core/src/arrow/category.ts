// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT2, Kind, α, λ } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { MonoidK } from '../monoid-k';
import { Compose, ComposeRequirements } from './compose';

/**
 * @category Type Class
 */
export interface Category<F> extends Compose<F> {
  readonly id: <A>() => Kind<F, [A, A]>;

  readonly algebraK: () => MonoidK<λ<F, [α, α]>>;
  readonly algebra: <A>() => Monoid<Kind<F, [A, A]>>;
}

export type CategoryRequirements<F> = Pick<Category<F>, 'id'> &
  ComposeRequirements<F> &
  Partial<Category<F>>;

function of<F>(F: CategoryRequirements<F>): Category<F>;
function of<F>(F: CategoryRequirements<HKT2<F>>): Category<HKT2<F>> {
  const self: Category<HKT2<F>> = {
    ...Compose.of(F),

    algebraK: () =>
      MonoidK.of<λ<HKT2<F>, [α, α]>>({
        emptyK: self.id,
        combineK_: (x, y) => self.compose_(x, y()),
      }),

    algebra: () =>
      Monoid.of({
        empty: self.id(),
        combine_: (x, y) => self.compose_(x, y()),
      }),

    ...F,
  };
  return self;
}

export const Category = Object.freeze({ of });
