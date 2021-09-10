import { Auto, Kind } from '../core';
import { Functor } from './functor';
import { Apply } from './apply';

export interface Applicative<F, C = Auto> extends Apply<F, C> {
  readonly pure: <S, R, E, A>(a: A) => Kind<F, C, S, R, E, A>;
  readonly unit: <S, R, E>() => Kind<F, C, S, R, E, void>;
}

export type ApplicativeRequirements<F, C = Auto> = Pick<
  Applicative<F, C>,
  'pure' | 'ap_'
> &
  Partial<Applicative<F, C>>;
export const Applicative = Object.freeze({
  of: <F, C = Auto>(F: ApplicativeRequirements<F, C>): Applicative<F, C> => {
    const self: Applicative<F, C> = {
      unit: () => F.pure(undefined as void),

      ...Apply.of<F, C>({ ...Applicative.deriveFunctor<F, C>(F), ...F }),
      ...F,
    };
    return self;
  },

  deriveFunctor: <F, C = Auto>(
    F: ApplicativeRequirements<F, C>,
  ): Functor<F, C> =>
    Functor.of<F, C>({
      map_: (fa, f) => F.ap_(F.pure(f), fa),
      ...F,
    }),
});
