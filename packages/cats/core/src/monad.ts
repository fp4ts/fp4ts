import { Apply } from './apply';
import { Applicative } from './applicative';
import { FlatMap } from './flat-map';
import { Functor } from './functor';

export interface Monad<F> extends FlatMap<F>, Applicative<F> {}

export type MonadRequirements<F> = Pick<
  Monad<F>,
  'flatMap_' | 'pure' | 'tailRecM_'
> &
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
    Functor.of({ map_: (fa, f) => F.flatMap_(fa, x => F.pure(f(x))), ...F }),

  deriveApply: <F>(F: MonadRequirements<F>): Apply<F> =>
    Apply.of({
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
    FlatMap.of({
      ...Monad.deriveApply(F),
      ...F,
    }),
});
