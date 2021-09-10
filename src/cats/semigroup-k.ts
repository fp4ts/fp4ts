import { Semigroup } from './semigroup';
import { Auto, Base, instance, Kind } from '../core';

export interface SemigroupK<F, C = Auto> extends Base<F, C> {
  readonly combineK: <S, R, E, A>(
    y: Kind<F, C, S, R, E, A>,
  ) => (x: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, A>;
  readonly combineK_: <S, R, E, A>(
    x: Kind<F, C, S, R, E, A>,
    y: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, A>;

  readonly algebra: <S, R, E, A>() => Semigroup<Kind<F, C, S, R, E, A>>;
}

export type SemigroupKRequirements<F, C = Auto> = Pick<
  SemigroupK<F, C>,
  'combineK_'
> &
  Partial<SemigroupK<F, C>>;
export const SemigroupK = Object.freeze({
  of: <F, C = Auto>(F: SemigroupKRequirements<F, C>): SemigroupK<F, C> =>
    instance<SemigroupK<F, C>>({
      combineK: y => x => F.combineK_(x, y),
      algebra: () => ({
        combine: F.combineK ?? (y => x => F.combineK_(y, x)),
        combine_: F.combineK_,
      }),
      ...F,
    }),
});
