import { Traversable } from '../../cats';
import { Auto, Kind, URIS } from '../../core';
import { Spawn } from './spawn';

export interface Concurrent<F extends URIS, E, C = Auto>
  extends Spawn<F, E, C> {
  parTraverse: <T extends URIS>(
    T: Traversable<T>,
  ) => <S, R, A, B>(
    f: (a: A) => Kind<F, C, S, R, E, B>,
  ) => <C2, S2, R2, E2>(
    ts: Kind<T, C2, S2, R2, E2, A>,
  ) => Kind<F, C, S, R, E, Kind<T, C2, S2, R2, E2, B>>;

  parSequence: <T extends URIS>(
    T: Traversable<T>,
  ) => <S, R, C2, S2, R2, E2, A>(
    as: Kind<T, C2, S2, R2, E2, Kind<F, C, S, R, E, A>>,
  ) => Kind<F, C, S, R, E, Kind<T, C2, S2, R2, E2, A>>;

  parTraverseN: <T extends URIS>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <S, R, A, B>(
    f: (a: A) => Kind<F, C, S, R, E, B>,
  ) => <C2, S2, R2, E2>(
    ts: Kind<T, C2, S2, R2, E2, A>,
  ) => Kind<F, C, S, R, E, Kind<T, C2, S2, R2, E2, B>>;

  parSequenceN: <T extends URIS>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <S, R, C2, S2, R2, E2, A>(
    as: Kind<T, C2, S2, R2, E2, Kind<F, C, S, R, E, A>>,
  ) => Kind<F, C, S, R, E, Kind<T, C2, S2, R2, E2, A>>;
}
