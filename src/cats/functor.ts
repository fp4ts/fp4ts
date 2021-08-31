import { Kind, Kind2 } from '../fp/hkt';

export interface Functor<F> {
  readonly URI: F;

  readonly map: <A, B>(f: (a: A) => B) => (fa: Kind<F, A>) => Kind<F, B>;

  readonly tap: <A>(f: (a: A) => unknown) => (fa: Kind<F, A>) => Kind<F, A>;
}

export interface Functor2C<F, E> {
  readonly URI: F;

  readonly map: <A, B>(
    f: (a: A) => B,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;

  readonly tap: <A>(
    f: (a: A) => unknown,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, A>;
}

export interface Functor2<F> {
  readonly URI: F;

  readonly map: <E, A, B>(
    f: (a: A) => B,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;

  readonly tap: <E, A>(
    f: (a: A) => unknown,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, A>;
}
