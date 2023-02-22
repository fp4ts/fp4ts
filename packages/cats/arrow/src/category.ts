// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, lazy, α, λ } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { MonoidK } from '@fp4ts/cats-core';
import { Compose, ComposeRequirements } from './compose';
import { functionCategory } from './instances/function';

/**
 * @category Type Class
 * @category Arrow
 */
export interface Category<P> extends Compose<P> {
  id<A>(): Kind<P, [A, A]>;

  algebraK(): MonoidK<λ<P, [α, α]>>;
  algebra<A>(): Monoid<Kind<P, [A, A]>>;
}

export type CategoryRequirements<P> = Pick<Category<P>, 'id'> &
  ComposeRequirements<P> &
  Partial<Category<P>>;
export const Category = Object.freeze({
  of: <P>(P: CategoryRequirements<P>): Category<P> => {
    const self: Category<P> = {
      ...Compose.of(P),

      algebraK: lazy(() =>
        MonoidK.of<λ<P, [α, α]>>({
          emptyK: self.id,
          combineK_: (x, y) => self.compose_(x, y),
        }),
      ),

      algebra: lazy(<A>() =>
        Monoid.of<Kind<P, [A, A]>>({
          empty: self.id<A>(),
          combine_: (x, y) => self.compose_(x, y),
        }),
      ) as <A>() => Monoid<Kind<P, [A, A]>>,

      ...P,
    };
    return self;
  },

  get Function1() {
    return functionCategory();
  },
});
