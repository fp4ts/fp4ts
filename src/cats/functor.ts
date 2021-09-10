import { Auto, Base, instance, Kind, URIS } from '../core';

export interface Functor<F extends URIS, C = Auto> extends Base<F, C> {
  readonly map: <A, B>(
    f: (a: A) => B,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, B>;
  readonly map_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    f: (a: A) => B,
  ) => Kind<F, C, S, R, E, B>;

  readonly tap: <A>(
    f: (a: A) => unknown,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, A>;
  readonly tap_: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
    f: (a: A) => unknown,
  ) => Kind<F, C, S, R, E, A>;
}

export type FunctorRequirements<F extends URIS, C = Auto> = Pick<
  Functor<F, C>,
  'map_'
> &
  Partial<Functor<F, C>>;
export const Functor = Object.freeze({
  of: <F extends URIS, C = Auto>(F: FunctorRequirements<F, C>): Functor<F, C> =>
    instance<Functor<F, C>>({
      map: f => fa => F.map_(fa, f),
      tap: f => fa => F.map_(fa, x => (f(x), x)),
      tap_: (fa, f) => F.map_(fa, x => (f(x), x)),
      ...F,
    }),
});
