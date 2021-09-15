import { AnyK } from '../core';
import { Apply } from './apply';
import { Applicative } from './applicative';
import { FlatMap } from './flat-map';
import { Functor } from './functor';

export interface Monad<F extends AnyK> extends FlatMap<F>, Applicative<F> {}

export type MonadRequirements<F extends AnyK> = Pick<
  Monad<F>,
  'flatMap_' | 'pure'
> &
  Partial<Monad<F>>;
export const Monad = Object.freeze({
  of: <F extends AnyK>(F: MonadRequirements<F>): Monad<F> => {
    const self: Monad<F> = {
      ...Monad.deriveFlatMap(F),
      ...Monad.deriveApplicative(F),
      ...F,
    };
    return self;
  },

  deriveFunctor: <F extends AnyK>(F: MonadRequirements<F>): Functor<F> =>
    Functor.of({ map_: (fa, f) => F.flatMap_(fa, x => F.pure(f(x))), ...F }),

  deriveApply: <F extends AnyK>(F: MonadRequirements<F>): Apply<F> =>
    Apply.of({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.flatMap_(fa, a => F.pure(f(a)))),
      ...Monad.deriveFunctor(F),
      ...F,
    }),

  deriveApplicative: <F extends AnyK>(
    F: MonadRequirements<F>,
  ): Applicative<F> =>
    Applicative.of({
      ...Monad.deriveApply(F),
      ...F,
    }),

  deriveFlatMap: <F extends AnyK>(F: MonadRequirements<F>): FlatMap<F> =>
    FlatMap.of({
      ...Monad.deriveApply(F),
      ...F,
    }),
});
