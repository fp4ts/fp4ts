import { id } from '../fp/core';
import { Kind, Kind2 } from '../fp/hkt';
import { Apply, Apply2C, Apply2 } from './apply';

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

export type FlatMapRequirements<F> = Pick<
  FlatMap<F>,
  'URI' | 'flatMap_' | 'map_'
> &
  Partial<FlatMap<F>>;
export const FlatMap = Object.freeze({
  of: <F>(F: FlatMapRequirements<F>): FlatMap<F> => {
    const self: FlatMap<F> = {
      flatMap: f => fa => self.flatMap_(fa, f),

      flatTap: f => fa => self.flatTap_(fa, f),

      flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

      flatten: ffa => self.flatMap_(ffa, id),

      ...FlatMap.deriveApply(F),
      ...F,
    };

    return self;
  },

  deriveApply: <F>(F: FlatMapRequirements<F>): Apply<F> =>
    Apply.of<F>({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.map_(fa, a => f(a))),
      ...F,
    }),
});

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

export type FlatMap2CRequirements<F, E> = Pick<
  FlatMap2C<F, E>,
  'URI' | 'flatMap_' | 'map_'
> &
  Partial<FlatMap2C<F, E>>;
export const FlatMap2C = Object.freeze({
  of: <F, E>(F: FlatMap2CRequirements<F, E>): FlatMap2C<F, E> => {
    const self: FlatMap2C<F, E> = {
      flatMap: f => fa => self.flatMap_(fa, f),

      flatTap: f => fa => self.flatTap_(fa, f),

      flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

      flatten: ffa => self.flatMap_(ffa, id),

      ...FlatMap2C.deriveApply(F),
      ...F,
    };

    return self;
  },

  deriveApply: <F, E>(F: FlatMap2CRequirements<F, E>): Apply2C<F, E> =>
    Apply2C.of<F, E>({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.map_(fa, a => f(a))),
      ...F,
    }),
});

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

export type FlatMap2Requirements<F> = Pick<
  FlatMap2<F>,
  'URI' | 'flatMap_' | 'map_'
> &
  Partial<FlatMap2<F>>;
export const FlatMap2 = Object.freeze({
  of: <F>(F: FlatMap2Requirements<F>): FlatMap2<F> => {
    const self: FlatMap2<F> = {
      flatMap: f => fa => self.flatMap_(fa, f),

      flatTap: f => fa => self.flatTap_(fa, f),

      flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

      flatten: ffa => self.flatMap_(ffa, id),

      ...FlatMap2.deriveApply(F),
      ...F,
    };

    return self;
  },

  deriveApply: <F>(F: FlatMap2Requirements<F>): Apply2<F> =>
    Apply2.of<F>({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.map_(fa, a => f(a))),
      ...F,
    }),
});
