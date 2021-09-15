import { Traversable } from '../../cats';
import { AnyK, Kind } from '../../core';
import { Spawn } from './spawn';

export interface Concurrent<F extends AnyK, E> extends Spawn<F, E> {
  readonly parTraverse: <T extends AnyK>(
    T: Traversable<T>,
  ) => <A, B>(
    f: (a: A) => Kind<F, [B]>,
  ) => (ts: Kind<T, [A]>) => Kind<F, [Kind<T, [B]>]>;

  readonly parSequence: <T extends AnyK>(
    T: Traversable<T>,
  ) => <A>(as: Kind<T, [Kind<F, [A]>]>) => Kind<F, [Kind<T, [A]>]>;

  readonly parTraverseN: <T extends AnyK>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <A, B>(
    f: (a: A) => Kind<F, [B]>,
  ) => (ts: Kind<T, [A]>) => Kind<F, [Kind<T, [B]>]>;

  readonly parSequenceN: <T extends AnyK>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <A>(as: Kind<T, [Kind<F, [A]>]>) => Kind<F, [Kind<T, [A]>]>;
}
