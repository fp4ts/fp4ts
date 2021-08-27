import { Kind } from '../../fp/hkt';
import { Spawn } from './spawn';

export interface Concurrent<F, E> extends Spawn<F, E> {
  parTraverse: <A>(as: A[]) => <B>(f: (a: A) => Kind<F, B>) => Kind<F, B[]>;
  parSequence: <A>(as: Kind<F, A>[]) => Kind<F, A[]>;

  parTraverseN: (
    maxConcurrent: number,
  ) => <A>(as: A[]) => <B>(f: (a: A) => Kind<F, B>) => Kind<F, B[]>;

  parSequenceN: (
    maxConcurrent: number,
  ) => <A>(as: Kind<F, A>[]) => Kind<F, A[]>;
}
