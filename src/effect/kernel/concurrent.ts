import { Traversable } from '../../cats';
import { Auto, Kind, URIS } from '../../core';
import { Spawn } from './spawn';

export interface Concurrent<F extends URIS, E, C = Auto>
  extends Spawn<F, E, C> {
  readonly parTraverse: <T extends URIS>(
    T: Traversable<T>,
  ) => <S, R, A, B>(
    f: (a: A) => Kind<F, C, S, R, E, B>,
  ) => <CT, ST, RT, ET>(
    ts: Kind<T, CT, ST, RT, ET, A>,
  ) => Kind<F, C, S, R, E, Kind<T, CT, ST, RT, ET, B>>;

  readonly parSequence: <T extends URIS>(
    T: Traversable<T>,
  ) => <CT, ST, RT, ET, S, R, A>(
    as: Kind<T, CT, ST, RT, ET, Kind<F, C, S, R, E, A>>,
  ) => Kind<F, C, S, R, E, Kind<T, CT, ST, RT, ET, A>>;

  readonly parTraverseN: <T extends URIS>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <S, R, A, B>(
    f: (a: A) => Kind<F, C, S, R, E, B>,
  ) => <CT, ST, RT, ET>(
    ts: Kind<T, CT, ST, RT, ET, A>,
  ) => Kind<F, C, S, R, E, Kind<T, CT, ST, RT, ET, B>>;

  readonly parSequenceN: <T extends URIS>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <CT, ST, RT, ET, S, R, A>(
    as: Kind<T, CT, ST, RT, ET, Kind<F, C, S, R, E, A>>,
  ) => Kind<F, C, S, R, E, Kind<T, CT, ST, RT, ET, A>>;
}
