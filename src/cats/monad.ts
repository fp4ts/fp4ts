import { Apply, Apply2, Apply2C } from './apply';
import { Applicative, Applicative2C, Applicative2 } from './applicative';
import { FlatMap, FlatMap2C, FlatMap2 } from './flat-map';
import { Functor, Functor2, Functor2C } from './functor';

export interface Monad<F> extends FlatMap<F>, Applicative<F> {}

export type MonadRequirements<F> = Pick<Monad<F>, 'URI' | 'flatMap_' | 'pure'> &
  Partial<Monad<F>>;
export const Monad = Object.freeze({
  of: <F>(F: MonadRequirements<F>): Monad<F> => {
    const self: Monad<F> = {
      ...Monad.deriveFlatMap(F),
      ...Monad.deriveApplicative(F),
      ...F,
    };
    return self;
  },

  deriveFunctor: <F>(F: MonadRequirements<F>): Functor<F> =>
    Functor.of<F>({ map_: (fa, f) => F.flatMap_(fa, x => F.pure(f(x))), ...F }),

  deriveApply: <F>(F: MonadRequirements<F>): Apply<F> =>
    Apply.of<F>({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.flatMap_(fa, a => F.pure(f(a)))),
      ...Monad.deriveFunctor(F),
      ...F,
    }),

  deriveApplicative: <F>(F: MonadRequirements<F>): Applicative<F> =>
    Applicative.of({
      ...Monad.deriveApply(F),
      ...F,
    }),

  deriveFlatMap: <F>(F: MonadRequirements<F>): FlatMap<F> =>
    FlatMap.of<F>({
      ...Monad.deriveApply(F),
      ...F,
    }),
});

export interface Monad2C<F, E> extends FlatMap2C<F, E>, Applicative2C<F, E> {}

export type Monad2CRequirements<F, E> = Pick<
  Monad2C<F, E>,
  'URI' | 'flatMap_' | 'pure'
> &
  Partial<Monad2C<F, E>>;
export const Monad2C = Object.freeze({
  of: <F, E>(F: Monad2CRequirements<F, E>): Monad2C<F, E> => {
    const self: Monad2C<F, E> = {
      ...Monad2C.deriveFlatMap(F),
      ...Monad2C.deriveApplicative(F),
      ...F,
    };
    return self;
  },

  deriveFunctor: <F, E>(F: Monad2CRequirements<F, E>): Functor2C<F, E> =>
    Functor2C.of<F, E>({
      map_: (fa, f) => F.flatMap_(fa, x => F.pure(f(x))),
      ...F,
    }),

  deriveApply: <F, E>(F: Monad2CRequirements<F, E>): Apply2C<F, E> =>
    Apply2C.of<F, E>({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.flatMap_(fa, a => F.pure(f(a)))),
      ...Monad2C.deriveFunctor(F),
      ...F,
    }),

  deriveApplicative: <F, E>(
    F: Monad2CRequirements<F, E>,
  ): Applicative2C<F, E> =>
    Applicative2C.of<F, E>({
      ...Monad2C.deriveApply(F),
      ...F,
    }),

  deriveFlatMap: <F, E>(F: Monad2CRequirements<F, E>): FlatMap2C<F, E> =>
    FlatMap2C.of<F, E>({
      ...Monad2C.deriveApply(F),
      ...F,
    }),
});

export interface Monad2<F> extends FlatMap2<F>, Applicative2<F> {}

export type Monad2Requirements<F> = Pick<
  Monad2<F>,
  'URI' | 'flatMap_' | 'pure'
> &
  Partial<Monad2<F>>;
export const Monad2 = Object.freeze({
  of: <F>(F: Monad2Requirements<F>): Monad2<F> => {
    const self: Monad2<F> = {
      ...Monad2.deriveFlatMap(F),
      ...Monad2.deriveApplicative(F),
      ...F,
    };
    return self;
  },

  deriveFunctor: <F>(F: Monad2Requirements<F>): Functor2<F> =>
    Functor2.of<F>({
      map_: (fa, f) => F.flatMap_(fa, x => F.pure(f(x))),
      ...F,
    }),

  deriveApply: <F>(F: Monad2Requirements<F>): Apply2<F> =>
    Apply2.of<F>({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.flatMap_(fa, a => F.pure(f(a)))),
      ...Monad2.deriveFunctor(F),
      ...F,
    }),

  deriveApplicative: <F>(F: Monad2Requirements<F>): Applicative2<F> =>
    Applicative2.of<F>({
      ...Monad2.deriveApply(F),
      ...F,
    }),

  deriveFlatMap: <F>(F: Monad2Requirements<F>): FlatMap2<F> =>
    FlatMap2.of<F>({
      ...Monad2.deriveApply(F),
      ...F,
    }),
});
