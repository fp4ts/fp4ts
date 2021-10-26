import { Kind } from '@fp4ts/core';
import { Monoid } from './monoid';
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
export const MonoidK = Object.freeze({
  of: <F>(F: MonoidKRequirements<F>): MonoidK<F> => ({
    ...SemigroupK.of(F),
    ...F,

    algebra: () => ({
      ...SemigroupK.of(F).algebra(),
      empty: F.emptyK(),
    }),
  }),
});
