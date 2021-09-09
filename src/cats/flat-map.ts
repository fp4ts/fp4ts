import { id } from '../fp/core';
import { Kind, Kind2 } from '../fp/hkt';
import {
  Apply,
  Apply2C,
  Apply2,
  Apply2CRequirements,
  Apply2Requirements,
  ApplyRequirements,
} from './apply';

export interface FlatMap<F> extends Apply<F> {
  readonly flatMap: <A, B>(
    f: (a: A) => Kind<F, B>,
  ) => (fa: Kind<F, A>) => Kind<F, B>;
  readonly flatMap_: <A, B>(
    fa: Kind<F, A>,
    f: (a: A) => Kind<F, B>,
  ) => Kind<F, B>;

  readonly flatTap: <A>(
    f: (a: A) => Kind<F, unknown>,
  ) => (fa: Kind<F, A>) => Kind<F, A>;
  readonly flatTap_: <A>(
    fa: Kind<F, A>,
    f: (a: A) => Kind<F, unknown>,
  ) => Kind<F, A>;

  readonly flatten: <A>(ffa: Kind<F, Kind<F, A>>) => Kind<F, A>;
}

export type FlatMapRequirements<F> = Pick<FlatMap<F>, 'flatMap_'> &
  ApplyRequirements<F> &
  Partial<FlatMap<F>>;
export const FlatMap = {
  of: <F>(F: FlatMapRequirements<F>): FlatMap<F> => {
    const self: FlatMap<F> = Object.freeze({
      ...Apply.of(F),

      flatMap:
        <A, B>(f: (a: A) => Kind<F, B>) =>
        (fa: Kind<F, A>) =>
          self.flatMap_(fa, f),

      flatTap:
        <A>(f: (a: A) => Kind<F, unknown>) =>
        (fa: Kind<F, A>) =>
          self.flatTap_(fa, f),

      flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

      flatten: ffa => self.flatMap_(ffa, id),

      ...F,
    });

    return self;
  },
};

export interface FlatMap2C<F, E> extends Apply2C<F, E> {
  readonly flatMap: <A, B>(
    f: (a: A) => Kind2<F, E, B>,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly flatMap_: <A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Kind2<F, E, B>,
  ) => Kind2<F, E, B>;

  readonly flatTap: <A>(
    f: (a: A) => Kind2<F, E, unknown>,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly flatTap_: <A>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Kind2<F, E, unknown>,
  ) => Kind2<F, E, A>;

  readonly flatten: <A>(ffa: Kind2<F, E, Kind2<F, E, A>>) => Kind2<F, E, A>;
}

export type FlatMap2CRequirements<F, E> = Pick<FlatMap2C<F, E>, 'flatMap_'> &
  Apply2CRequirements<F, E> &
  Partial<FlatMap2C<F, E>>;
export const FlatMap2C = {
  of: <F, E>(F: FlatMap2CRequirements<F, E>): FlatMap2C<F, E> => {
    const self: FlatMap2C<F, E> = Object.freeze({
      ...Apply2C.of(F),

      flatMap:
        <A, B>(f: (a: A) => Kind2<F, E, B>) =>
        (fa: Kind2<F, E, A>) =>
          self.flatMap_(fa, f),

      flatTap:
        <A>(f: (a: A) => Kind2<F, E, unknown>) =>
        (fa: Kind2<F, E, A>) =>
          self.flatTap_(fa, f),

      flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

      flatten: ffa => self.flatMap_(ffa, id),

      ...F,
    });

    return self;
  },
};

export interface FlatMap2<F> extends Apply2<F> {
  readonly flatMap: <E, A, B>(
    f: (a: A) => Kind2<F, E, B>,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly flatMap_: <E, A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Kind2<F, E, B>,
  ) => Kind2<F, E, B>;

  readonly flatTap: <E, A>(
    f: (a: A) => Kind2<F, E, unknown>,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly flatTap_: <E, A>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Kind2<F, E, unknown>,
  ) => Kind2<F, E, A>;

  readonly flatten: <E, A>(ffa: Kind2<F, E, Kind2<F, E, A>>) => Kind2<F, E, A>;
}

export type FlatMap2Requirements<F> = Pick<FlatMap2<F>, 'flatMap_'> &
  Apply2Requirements<F> &
  Partial<FlatMap2<F>>;
export const FlatMap2 = {
  of: <F>(F: FlatMap2Requirements<F>): FlatMap2<F> => {
    const self: FlatMap2<F> = Object.freeze({
      ...Apply2.of(F),

      flatMap:
        <E, A, B>(f: (a: A) => Kind2<F, E, B>) =>
        (fa: Kind2<F, E, A>) =>
          self.flatMap_(fa, f),

      flatTap:
        <E, A>(f: (a: A) => Kind2<F, E, unknown>) =>
        (fa: Kind2<F, E, A>) =>
          self.flatTap_(fa, f),

      flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

      flatten: ffa => self.flatMap_(ffa, id),

      ...F,
    });

    return self;
  },
};
