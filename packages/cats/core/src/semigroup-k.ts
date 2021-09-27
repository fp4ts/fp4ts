import { Base, instance, Kind, AnyK, Lazy } from '@cats4ts/core';
import { Semigroup } from './semigroup';

export interface SemigroupK<F extends AnyK> extends Base<F> {
  readonly combineK: <A>(
    y: Lazy<Kind<F, [A]>>,
  ) => (x: Kind<F, [A]>) => Kind<F, [A]>;
  readonly combineK_: <A>(
    x: Kind<F, [A]>,
    y: Lazy<Kind<F, [A]>>,
  ) => Kind<F, [A]>;

  readonly algebra: <A>() => Semigroup<Kind<F, [A]>>;
}

export type SemigroupKRequirements<F extends AnyK> = Pick<
  SemigroupK<F>,
  'combineK_'
> &
  Partial<SemigroupK<F>>;
export const SemigroupK = Object.freeze({
  of: <F extends AnyK>(F: SemigroupKRequirements<F>): SemigroupK<F> =>
    instance<SemigroupK<F>>({
      combineK: y => x => F.combineK_(x, y),
      algebra: () => ({
        combine: F.combineK ?? (y => x => F.combineK_(x, y)),
        combine_: F.combineK_,
      }),
      ...F,
    }),
});
