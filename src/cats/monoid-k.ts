import { Kind, AnyK } from '../core';
import { Monoid } from './monoid';
import { SemigroupK, SemigroupKRequirements } from './semigroup-k';

export interface MonoidK<F extends AnyK> extends SemigroupK<F> {
  readonly emptyK: <A>() => Kind<F, [A]>;

  readonly algebra: <A>() => Monoid<Kind<F, [A]>>;
}
export type MonoidKRequirements<F extends AnyK> = Pick<MonoidK<F>, 'emptyK'> &
  SemigroupKRequirements<F> &
  Partial<MonoidK<F>>;
export const MonoidK = Object.freeze({
  of: <F extends AnyK>(F: MonoidKRequirements<F>): MonoidK<F> => ({
    ...SemigroupK.of(F),
    ...F,

    algebra: () => ({
      ...SemigroupK.of(F).algebra(),
      empty: F.emptyK(),
    }),
  }),
});
