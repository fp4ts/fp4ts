import { AnyK } from '@cats4ts/core';
import { Stream } from './algebra';

export const concat_ = <F extends AnyK, A>(
  s1: Stream<F, A>,
  s2: Stream<F, A>,
): Stream<F, A> => new Stream(s1._underlying.flatMap(() => s2._underlying));

export const map_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => B,
): Stream<F, B> => new Stream(s._underlying.mapOutput(f));

export const flatMap_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Stream<F, B>,
): Stream<F, B> =>
  new Stream(s._underlying.flatMapOutput(o => f(o)._underlying));
