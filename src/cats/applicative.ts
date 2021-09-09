import { Kind, Kind2 } from '../fp/hkt';
import { Apply, Apply2C, Apply2 } from './apply';

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
    const self: Applicative<F> = Object.freeze({
      ...Apply.of({
        map_: F.map_ ?? ((fa, f) => self.ap_(self.pure(f), fa)),
        ...F,
      }),

      unit: F.pure(undefined as void),

      ...F,
    });
    return self;
  },
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
    const self: Applicative2C<F, E> = Object.freeze({
      ...Apply2C.of({
        map_: F.map_ ?? ((fa, f) => self.ap_(self.pure(f), fa)),
        ...F,
      }),

      unit: F.pure(undefined as void),

      ...F,
    });
    return self;
  },
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
      ...Apply2.of({
        map_:
          F.map_ ??
          (<E, A, B>(fa: Kind2<F, E, A>, f: (a: A) => B) =>
            self.ap_(self.pure<E, (a: A) => B>(f), fa)),
        ...F,
      }),

      unit: F.pure<never, void>(undefined as void),

      ...F,
    });
    return self;
  },
});
