import { Auto, Empty, Kind, Kind2, URIS } from '../../core';
import { Outcome } from './outcome';

export interface Fiber<F extends URIS, E, A, C = Auto> {
  readonly join: Kind2<F, C, E, Outcome<F, E, A>>;
  readonly joinWith: <S, R, B>(
    this: Fiber<F, E, B, C>,
    onCancel: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, B>;
  readonly joinWithNever: Kind2<F, C, E, A>;
  readonly cancel: Kind2<F, C, E, void>;
}
