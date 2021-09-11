import { Auto, id, Intro, Kind, Mix, URIS } from '../core';
import { Apply } from './apply';

export interface FlatMap<F extends URIS, C = Auto> extends Apply<F, C> {
  readonly flatMap: <S2, R2, E2, A, B>(
    f: (a: A) => Kind<F, C, S2, R2, E2, B>,
  ) => <S, R, E>(
    fa: Kind<
      F,
      C,
      Intro<C, 'S', S2, S>,
      Intro<C, 'R', R2, R>,
      Intro<C, 'E', E2, E>,
      A
    >,
  ) => Kind<
    F,
    C,
    Mix<C, 'S', [S2, S]>,
    Mix<C, 'R', [R2, R]>,
    Mix<C, 'E', [E2, E]>,
    B
  >;
  readonly flatMap_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    f: (a: A) => Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, B>;

  readonly flatTap: <S2, R2, E2, A>(
    f: (a: A) => Kind<F, C, S2, R2, E2, unknown>,
  ) => <S, R, E>(
    fa: Kind<
      F,
      C,
      Intro<C, 'S', S2, S>,
      Intro<C, 'R', R2, R>,
      Intro<C, 'E', E2, E>,
      A
    >,
  ) => Kind<
    F,
    C,
    Mix<C, 'S', [S2, S]>,
    Mix<C, 'R', [R2, R]>,
    Mix<C, 'E', [E2, E]>,
    A
  >;
  readonly flatTap_: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
    f: (a: A) => Kind<F, C, S, R, E, unknown>,
  ) => Kind<F, C, S, R, E, A>;

  readonly flatten: <S2, R2, E2, S, R, E, A>(
    ffa: Kind<
      F,
      C,
      S2,
      R2,
      E2,
      Kind<
        F,
        C,
        Intro<C, 'S', S2, S>,
        Intro<C, 'R', R2, R>,
        Intro<C, 'E', E2, E>,
        A
      >
    >,
  ) => Kind<
    F,
    C,
    Mix<C, 'S', [S2, S]>,
    Mix<C, 'R', [R2, R]>,
    Mix<C, 'E', [E2, E]>,
    A
  >;
}

export type FlatMapRequirements<F extends URIS, C = Auto> = Pick<
  FlatMap<F, C>,
  'flatMap_' | 'map_'
> &
  Partial<FlatMap<F, C>>;
export const FlatMap = Object.freeze({
  of: <F extends URIS, C = Auto>(
    F: FlatMapRequirements<F, C>,
  ): FlatMap<F, C> => {
    const self: FlatMap<F, C> = {
      flatMap: f => fa => self.flatMap_(fa, f),

      flatTap: f => fa => self.flatTap_(fa, f),

      flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

      flatten: ffa => self.flatMap_(ffa, id),

      ...FlatMap.deriveApply(F),
      ...F,
    };

    return self;
  },

  deriveApply: <F extends URIS, C = Auto>(
    F: FlatMapRequirements<F, C>,
  ): Apply<F, C> =>
    Apply.of<F, C>({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.map_(fa, a => f(a))),
      ...F,
    }),
});
