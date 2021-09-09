import { Semigroup } from './semigroup';
import { Kind, Kind2 } from '../fp/hkt';

export interface SemigroupK<F> {
  readonly URI: F;

  readonly combineK: <A>(y: Kind<F, A>) => (x: Kind<F, A>) => Kind<F, A>;
  readonly combineK_: <A>(x: Kind<F, A>, y: Kind<F, A>) => Kind<F, A>;

  readonly algebra: <A>() => Semigroup<Kind<F, A>>;
}

export type SemigroupKRequirements<F> = Pick<
  SemigroupK<F>,
  'URI' | 'combineK_'
> &
  Partial<SemigroupK<F>>;
export const SemigroupK = Object.freeze({
  of: <F>(F: SemigroupKRequirements<F>): SemigroupK<F> => ({
    combineK: y => x => F.combineK_(x, y),
    algebra: () => ({
      combine: F.combineK ?? (y => x => F.combineK_(y, x)),
      combine_: F.combineK_,
    }),
    ...F,
  }),
});

export interface SemigroupK2C<F, E> {
  readonly URI: F;

  readonly combineK: <A>(
    y: Kind2<F, E, A>,
  ) => (x: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly combineK_: <A>(
    x: Kind2<F, E, A>,
    y: Kind2<F, E, A>,
  ) => Kind2<F, E, A>;

  readonly algebra: <A>() => Semigroup<Kind2<F, E, A>>;
}

export type SemigroupK2CRequirements<F, E> = Pick<
  SemigroupK2C<F, E>,
  'URI' | 'combineK_'
> &
  Partial<SemigroupK2C<F, E>>;
export const SemigroupK2C = Object.freeze({
  of: <F, E>(F: SemigroupK2CRequirements<F, E>): SemigroupK2C<F, E> => ({
    combineK: y => x => F.combineK_(x, y),
    algebra: () => ({
      combine: F.combineK ?? (y => x => F.combineK_(y, x)),
      combine_: F.combineK_,
    }),
    ...F,
  }),
});

export interface SemigroupK2<F> {
  readonly URI: F;

  readonly combineK: <E, A>(
    y: Kind2<F, E, A>,
  ) => (x: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly combineK_: <E, A>(
    x: Kind2<F, E, A>,
    y: Kind2<F, E, A>,
  ) => Kind2<F, E, A>;

  readonly algebra: <E, A>() => Semigroup<Kind2<F, E, A>>;
}

export type SemigroupK2Requirements<F> = Pick<
  SemigroupK2<F>,
  'URI' | 'combineK_'
> &
  Partial<SemigroupK2<F>>;
export const SemigroupK2 = Object.freeze({
  of: <F>(F: SemigroupK2Requirements<F>): SemigroupK2<F> => ({
    combineK: y => x => F.combineK_(x, y),
    algebra: () => ({
      combine: F.combineK ?? (y => x => F.combineK_(y, x)),
      combine_: F.combineK_,
    }),
    ...F,
  }),
});
