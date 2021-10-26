import { Kind, α, λ } from '@cats4ts/core';
import { MonoidK } from '../monoid-k';
import { Monoid } from '../monoid';
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
