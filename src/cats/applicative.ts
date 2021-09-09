import { Kind, Kind2 } from '../fp/hkt';
import { Functor } from './functor';
import { Apply, Apply2C, Apply2 } from './apply';
import { Functor2, Functor2C } from '.';

export interface Applicative<F> extends Apply<F> {
  readonly pure: <A>(a: A) => Kind<F, A>;
  readonly unit: Kind<F, void>;
}

export type ApplicativeRequirements<F> = Pick<
  Applicative<F>,
  'URI' | 'pure' | 'ap_'
> &
  Partial<Applicative<F>>;
export const Applicative = Object.freeze({
  of: <F>(F: ApplicativeRequirements<F>): Applicative<F> => {
    const self: Applicative<F> = {
      unit: F.pure(undefined as void),

      ...Apply.of({ ...Applicative.deriveFunctor(F), ...F }),
      ...F,
    };
    return self;
  },

  deriveFunctor: <F>(F: ApplicativeRequirements<F>): Functor<F> =>
    Functor.of({
      map_: (fa, f) => F.ap_(F.pure(f), fa),
      ...F,
    }),
});

export interface Applicative2C<F, E> extends Apply2C<F, E> {
  readonly pure: <A>(a: A) => Kind2<F, E, A>;
  readonly unit: Kind2<F, E, void>;
}

export type Applicative2CRequirements<F, E> = Pick<
  Applicative2C<F, E>,
  'URI' | 'pure' | 'ap_'
> &
  Partial<Applicative2C<F, E>>;
export const Applicative2C = Object.freeze({
  of: <F, E>(F: Applicative2CRequirements<F, E>): Applicative2C<F, E> => {
    const self: Applicative2C<F, E> = {
      unit: F.pure(undefined as void),

      ...Apply2C.of({ ...Applicative2C.deriveFunctor(F), ...F }),
      ...F,
    };
    return self;
  },

  deriveFunctor: <F, E>(F: Applicative2CRequirements<F, E>): Functor2C<F, E> =>
    Functor2C.of({ map_: (fa, f) => F.ap_(F.pure(f), fa), ...F }),
});

export interface Applicative2<F> extends Apply2<F> {
  readonly pure: <E, A>(a: A) => Kind2<F, E, A>;
  readonly unit: Kind2<F, never, void>;
}

export type Applicative2Requirements<F> = Pick<
  Applicative2<F>,
  'URI' | 'pure' | 'ap_'
> &
  Partial<Applicative2<F>>;
export const Applicative2 = Object.freeze({
  of: <F>(F: Applicative2Requirements<F>): Applicative2<F> => {
    const self: Applicative2<F> = Object.freeze({
      unit: F.pure<never, void>(undefined as void),

      ...Apply2.of({ ...Applicative2.deriveFunctor(F), ...F }),
      ...F,
    });
    return self;
  },

  deriveFunctor: <F>(F: Applicative2Requirements<F>): Functor2<F> =>
    Functor2.of<F>({ map_: (fa, f) => F.ap_(F.pure(f), fa), ...F }),
});
