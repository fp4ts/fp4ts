import { Kind, Kind2 } from '../fp/hkt';

export interface Functor<F> {
  readonly URI: F;

  readonly map: <A, B>(f: (a: A) => B) => (fa: Kind<F, A>) => Kind<F, B>;
  readonly map_: <A, B>(fa: Kind<F, A>, f: (a: A) => B) => Kind<F, B>;

  readonly tap: <A>(f: (a: A) => unknown) => (fa: Kind<F, A>) => Kind<F, A>;
  readonly tap_: <A>(fa: Kind<F, A>, f: (a: A) => unknown) => Kind<F, A>;
}

export type FunctorRequirements<F> = Pick<Functor<F>, 'URI' | 'map_'> &
  Partial<Functor<F>>;
export const Functor = Object.freeze({
  of: <F>(F: FunctorRequirements<F>): Functor<F> => ({
    map: f => fa => F.map_(fa, f),
    tap: f => fa => F.map_(fa, x => (f(x), x)),
    tap_: (fa, f) => F.map_(fa, x => (f(x), x)),
    ...F,
  }),
});

export interface Functor2C<F, E> {
  readonly URI: F;

  readonly map: <A, B>(
    f: (a: A) => B,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly map_: <A, B>(fa: Kind2<F, E, A>, f: (a: A) => B) => Kind2<F, E, B>;

  readonly tap: <A>(
    f: (a: A) => unknown,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly tap_: <A>(
    fa: Kind2<F, E, A>,
    f: (a: A) => unknown,
  ) => Kind2<F, E, A>;
}

export type Functor2CRequirements<F, E> = Pick<
  Functor2C<F, E>,
  'URI' | 'map_'
> &
  Partial<Functor2C<F, E>>;
export const Functor2C = Object.freeze({
  of: <F, E>(F: Functor2CRequirements<F, E>): Functor2C<F, E> => ({
    map: f => fa => F.map_(fa, f),
    tap: f => fa => F.map_(fa, x => (f(x), x)),
    tap_: (fa, f) => F.map_(fa, x => (f(x), x)),
    ...F,
  }),
});

export interface Functor2<F> {
  readonly URI: F;

  readonly map: <E, A, B>(
    f: (a: A) => B,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly map_: <E, A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => B,
  ) => Kind2<F, E, B>;

  readonly tap: <E, A>(
    f: (a: A) => unknown,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly tap_: <E, A>(
    fa: Kind2<F, E, A>,
    f: (a: A) => unknown,
  ) => Kind2<F, E, A>;
}

export type Functor2Requirements<F> = Pick<Functor2<F>, 'URI' | 'map_'> &
  Partial<Functor2<F>>;
export const Functor2 = Object.freeze({
  of: <F>(F: Functor2Requirements<F>): Functor2<F> => ({
    map: f => fa => F.map_(fa, f),
    tap: f => fa => F.map_(fa, x => (f(x), x)),
    tap_: (fa, f) => F.map_(fa, x => (f(x), x)),
    ...F,
  }),
});
