import { Kind, Auto, URIS } from '../../core';
import { Concurrent } from './concurrent';

export interface Temporal<F extends URIS, E, C = Auto>
  extends Concurrent<F, E, C> {
  readonly sleep: <S, R>(ms: number) => Kind<F, C, S, R, E, void>;

  readonly delayBy: <S, R, A>(
    fa: Kind<F, C, S, R, E, A>,
    ms: number,
  ) => Kind<F, C, S, R, E, A>;

  readonly timeoutTo: <S, R, A>(
    ioa: Kind<F, C, S, R, E, A>,
    ms: number,
    fallback: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, A>;

  readonly timeout: <S, R, A>(
    ioa: Kind<F, C, S, R, E, A>,
    ms: number,
  ) => Kind<F, C, S, R, E, A>;
}
