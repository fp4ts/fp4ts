import { Traversable } from '../../cats';
import { Kind } from '../../fp/hkt';
import { Spawn } from './spawn';

export interface Concurrent<F, E> extends Spawn<F, E> {
  parTraverse: <T>(
    T: Traversable<T>,
  ) => <A, B>(
    f: (a: A) => Kind<F, B>,
  ) => (ts: Kind<T, A>) => Kind<F, Kind<T, B>>;

  parSequence: <T>(
    T: Traversable<T>,
  ) => <A>(as: Kind<T, Kind<F, A>>) => Kind<F, Kind<T, A>>;

  parTraverseN: <T>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <A, B>(
    f: (a: A) => Kind<F, B>,
  ) => (ts: Kind<T, A>) => Kind<F, Kind<T, B>>;

  parSequenceN: <T>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <A>(as: Kind<T, Kind<F, A>>) => Kind<F, Kind<T, A>>;
}
