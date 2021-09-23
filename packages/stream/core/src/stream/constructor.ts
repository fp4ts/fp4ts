import { AnyK, Kind } from '@cats4ts/core';
import { List, Vector } from '@cats4ts/cats-core/lib/data';
import { Spawn } from '@cats4ts/effect-kernel';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Stream } from './algebra';
import { repeat } from './operators';

export const pure = <F extends AnyK, A>(x: A): Stream<F, A> =>
  new Stream(Pull.output1(x));

export const empty = <F extends AnyK>(): Stream<F, never> =>
  new Stream(Pull.done());

export const suspend = <F extends AnyK, A>(
  thunk: () => Stream<F, A>,
): Stream<F, A> => new Stream(Pull.suspend(() => thunk().pull));

export const throwError: <F extends AnyK>(e: Error) => Stream<F, never> = e =>
  new Stream(Pull.throwError(e));

export const of = <F extends AnyK, A>(...xs: A[]): Stream<F, A> =>
  fromArray(xs);

export const evalF = <F extends AnyK, A>(fa: Kind<F, [A]>): Stream<F, A> =>
  new Stream(Pull.evalF(fa).flatMap(Pull.output1));

export const repeatEval: <F extends AnyK, A>(fa: Kind<F, [A]>) => Stream<F, A> =
  s => repeat(evalF(s));

export const range = <F extends AnyK>(
  from: number,
  until: number,
  step: number = 1,
): Stream<F, number> => {
  const go = (i: number): Stream<F, number> =>
    i < until
      ? pure<F, number>(i)['+++'](suspend(() => go(i + step)))
      : empty();

  return go(from);
};

export const never: <F extends AnyK>(F: Spawn<F, Error>) => Stream<F, never> =
  F => evalF(F.never);

export const fromArray = <F extends AnyK, A>(xs: A[]): Stream<F, A> => {
  switch (xs.length) {
    case 0:
      return empty();
    case 1:
      return pure(xs[0]);
    default:
      return new Stream(Pull.output(Chunk.fromArray(xs)));
  }
};

export const fromList = <F extends AnyK, A>(xs: List<A>): Stream<F, A> =>
  fromArray(xs.toArray);

export const fromVector = <F extends AnyK, A>(xs: Vector<A>): Stream<F, A> =>
  fromArray(xs.toArray);

export const fromChunk = <F extends AnyK, A>(chunk: Chunk<A>): Stream<F, A> =>
  new Stream(Pull.output(chunk));
