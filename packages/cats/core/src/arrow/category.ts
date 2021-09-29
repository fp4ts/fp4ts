import { $, AnyK, Kind, α, λ } from '@cats4ts/core';
import { MonoidK } from '../monoid-k';
import { Monoid } from '../monoid';
import { Compose, ComposeRequirements } from './compose';

export interface Category<F extends AnyK> extends Compose<F> {
  readonly id: <A>() => Kind<F, [A, A]>;

  readonly algebraK: () => MonoidK<λ<[α], $<F, [α, α]>>>;
  readonly algebra: <A>() => Monoid<Kind<F, [A, A]>>;
}

export type CategoryRequirements<F extends AnyK> = Pick<Category<F>, 'id'> &
  ComposeRequirements<F> &
  Partial<Category<F>>;
export const Category = Object.freeze({
  of: <F extends AnyK>(F: CategoryRequirements<F>): Category<F> => {
    const self: Category<F> = {
      ...Compose.of(F),

      algebraK: () =>
        MonoidK.of({
          emptyK: <A>() => self.id<A>(),
          combineK_: <A>(x: Kind<F, [A, A]>, y: () => Kind<F, [A, A]>) =>
            self.compose_(x, y()),
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
