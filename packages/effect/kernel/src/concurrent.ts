import { Kind } from '@cats4ts/core';
import { Traversable } from '@cats4ts/cats-core';
import { Spawn } from './spawn';

export interface Concurrent<F, E> extends Spawn<F, E> {
  readonly parTraverse: <T>(
    T: Traversable<T>,
  ) => <A, B>(
    f: (a: A) => Kind<F, [B]>,
  ) => (ts: Kind<T, [A]>) => Kind<F, [Kind<T, [B]>]>;

  readonly parSequence: <T>(
    T: Traversable<T>,
  ) => <A>(as: Kind<T, [Kind<F, [A]>]>) => Kind<F, [Kind<T, [A]>]>;

  readonly parTraverseN: <T>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <A, B>(
    f: (a: A) => Kind<F, [B]>,
  ) => (ts: Kind<T, [A]>) => Kind<F, [Kind<T, [B]>]>;

  readonly parSequenceN: <T>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <A>(as: Kind<T, [Kind<F, [A]>]>) => Kind<F, [Kind<T, [A]>]>;
}
