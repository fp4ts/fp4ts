import { Auto, Kind, URIS } from '../../core';
import { Outcome } from './outcome';

export interface Fiber<F extends URIS, E, A, C = Auto> {
  readonly join: Kind<F, C, unknown, unknown, E, Outcome<F, E, A, C>>;
  readonly joinWith: <S, R, B>(
    this: Fiber<F, E, B, C>,
    onCancel: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, B>;
  readonly joinWithNever: Kind<F, C, unknown, unknown, E, A>;
  readonly cancel: Kind<F, C, unknown, unknown, E, void>;
}
