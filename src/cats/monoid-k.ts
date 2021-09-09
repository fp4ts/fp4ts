import { Kind, Kind2 } from '../fp/hkt';
import { Monoid } from './monoid';
import {
  SemigroupK,
  SemigroupK2C,
  SemigroupK2,
  SemigroupKRequirements,
  SemigroupK2CRequirements,
  SemigroupK2Requirements,
} from './semigroup-k';

export interface MonoidK<F> extends SemigroupK<F> {
  readonly emptyK: <A>() => Kind<F, A>;

  readonly algebra: <A>() => Monoid<Kind<F, A>>;
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

export interface MonoidK2C<F, E> extends SemigroupK2C<F, E> {
  readonly emptyK: <A>() => Kind2<F, E, A>;

  readonly algebra: <A>() => Monoid<Kind2<F, E, A>>;
}
export type MonoidK2CRequirements<F, E> = Pick<MonoidK2C<F, E>, 'emptyK'> &
  SemigroupK2CRequirements<F, E> &
  Partial<MonoidK2C<F, E>>;
export const MonoidK2C = Object.freeze({
  of: <F, E>(F: MonoidK2CRequirements<F, E>): MonoidK2C<F, E> => ({
    ...SemigroupK2C.of(F),
    ...F,

    algebra: () => ({
      ...SemigroupK2C.of(F).algebra(),
      empty: F.emptyK(),
    }),
  }),
});

export interface MonoidK2<F> extends SemigroupK2<F> {
  readonly emptyK: <E, A>() => Kind2<F, E, A>;

  readonly algebra: <E, A>() => Monoid<Kind2<F, E, A>>;
}

export type MonoidK2Requirements<F> = Pick<MonoidK2<F>, 'emptyK'> &
  SemigroupK2Requirements<F> &
  Partial<MonoidK2<F>>;
export const MonoidK2 = Object.freeze({
  of: <F>(F: MonoidK2Requirements<F>): MonoidK2<F> => ({
    ...SemigroupK2.of(F),
    ...F,

    algebra: () => ({
      ...SemigroupK2.of(F).algebra(),
      empty: F.emptyK(),
    }),
  }),
});
