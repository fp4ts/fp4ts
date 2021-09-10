import { Auto, Kind, URIS } from '../core';
import { Monoid } from './monoid';
import { SemigroupK, SemigroupKRequirements } from './semigroup-k';

export interface MonoidK<F extends URIS, C = Auto> extends SemigroupK<F, C> {
  readonly emptyK: <S, R, E, A>() => Kind<F, C, S, R, E, A>;

  readonly algebra: <S, R, E, A>() => Monoid<Kind<F, C, S, R, E, A>>;
}
export type MonoidKRequirements<F extends URIS, C = Auto> = Pick<
  MonoidK<F, C>,
  'emptyK'
> &
  SemigroupKRequirements<F, C> &
  Partial<MonoidK<F, C>>;
export const MonoidK = Object.freeze({
  of: <F extends URIS, C = Auto>(
    F: MonoidKRequirements<F, C>,
  ): MonoidK<F, C> => ({
    ...SemigroupK.of(F),
    ...F,

    algebra: () => ({
      ...SemigroupK.of(F).algebra(),
      empty: F.emptyK(),
    }),
  }),
});
