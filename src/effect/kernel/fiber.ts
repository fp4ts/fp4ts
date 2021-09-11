import { Auto, Empty, Intro, Kind, Mix, URIS } from '../../core';
import { Outcome } from './outcome';

export interface Fiber<F extends URIS, E, A, C = Auto> {
  readonly join: Kind<
    F,
    C,
    Empty<C, 'S'>,
    Empty<C, 'R'>,
    E,
    Outcome<F, E, A, C>
  >;
  readonly joinWith: <S, R, S2, R2, B>(
    this: Fiber<F, E, B, C>,
    onCancel: Kind<F, C, Intro<C, 'S', S2, S>, Intro<C, 'R', R2, R>, E, B>,
  ) => Kind<F, C, Mix<C, 'S', [S2, S]>, Mix<C, 'R', [R2, R]>, E, B>;
  readonly joinWithNever: Kind<F, C, Empty<C, 'S'>, Empty<C, 'R'>, E, A>;
  readonly cancel: Kind<F, C, Empty<C, 'S'>, Empty<C, 'R'>, E, void>;
}
