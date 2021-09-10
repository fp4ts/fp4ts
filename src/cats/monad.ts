import { Auto } from '../core';
import { Apply } from './apply';
import { Applicative } from './applicative';
import { FlatMap } from './flat-map';
import { Functor } from './functor';

export interface Monad<F, C = Auto> extends FlatMap<F, C>, Applicative<F, C> {}

export type MonadRequirements<F, C = Auto> = Pick<
  Monad<F, C>,
  'flatMap_' | 'pure'
> &
  Partial<Monad<F, C>>;
export const Monad = Object.freeze({
  of: <F, C = Auto>(F: MonadRequirements<F, C>): Monad<F, C> => {
    const self: Monad<F, C> = {
      ...Monad.deriveFlatMap(F),
      ...Monad.deriveApplicative(F),
      ...F,
    };
    return self;
  },

  deriveFunctor: <F, C = Auto>(F: MonadRequirements<F, C>): Functor<F, C> =>
    Functor.of({ map_: (fa, f) => F.flatMap_(fa, x => F.pure(f(x))), ...F }),

  deriveApply: <F, C>(F: MonadRequirements<F, C>): Apply<F, C> =>
    Apply.of({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.flatMap_(fa, a => F.pure(f(a)))),
      ...Monad.deriveFunctor(F),
      ...F,
    }),

  deriveApplicative: <F, C>(F: MonadRequirements<F, C>): Applicative<F, C> =>
    Applicative.of({
      ...Monad.deriveApply(F),
      ...F,
    }),

  deriveFlatMap: <F, C>(F: MonadRequirements<F, C>): FlatMap<F, C> =>
    FlatMap.of({
      ...Monad.deriveApply(F),
      ...F,
    }),
});
