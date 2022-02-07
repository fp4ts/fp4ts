// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, α, λ } from '@fp4ts/core';
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
export const Category = Object.freeze({
  of: <F>(F: CategoryRequirements<F>): Category<F> => {
    const self: Category<F> = {
      ...Compose.of(F),

      algebraK: () =>
        MonoidK.of<λ<F, [α, α]>>({
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
  },
});
