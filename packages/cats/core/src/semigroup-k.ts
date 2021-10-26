import { Base, instance, Kind, Lazy } from '@cats4ts/core';
import { Semigroup } from './semigroup';

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
