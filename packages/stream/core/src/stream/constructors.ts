import { ok as assert } from 'assert';
import { constant, id, Kind, pipe } from '@fp4ts/core';
import { Either, List, Option, Some, Vector } from '@fp4ts/cats';
import { ExitCase, Poll, MonadCancel, Spawn, Temporal } from '@fp4ts/effect';

import { PureK } from '../pure';
import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Stream } from './algebra';
import {
  attempts,
  concat_,
  flatMap,
  flatMap_,
  last,
  repeat as repeatOp,
  rethrow,
  scope,
  take,
  takeWhile,
} from './operators';

export const pure = <F, A>(x: A): Stream<F, A> => new Stream(Pull.output1(x));

export const empty = <F>(): Stream<F, never> => new Stream(Pull.done());

export const defer = <F, A>(thunk: () => Stream<F, A>): Stream<F, A> =>
  new Stream(Pull.defer(() => thunk().pull));

export const throwError: <F>(e: Error) => Stream<F, never> = e =>
  new Stream(Pull.throwError(e));

export const of = <F, A>(...xs: A[]): Stream<F, A> => fromArray(xs);

export const evalF = <F, A>(fa: Kind<F, [A]>): Stream<F, A> =>
  new Stream(Pull.evalF(fa).flatMap(Pull.output1));

export const execF = <F, A>(fa: Kind<F, [A]>): Stream<F, never> =>
  new Stream(Pull.evalF(fa).void);

export const force = <F, A>(fs: Kind<F, [Stream<F, A>]>): Stream<F, A> =>
  flatMap_(evalF(fs), id);

export const evalUnChunk = <F, A>(fa: Kind<F, [Chunk<A>]>): Stream<F, A> =>
  new Stream(Pull.evalF(fa).flatMap(Pull.output));

export const repeat = <A>(value: A): Stream<PureK, A> =>
  concat_(
    pure(value),
    defer(() => repeat(value)),
  );

export const repeatEval: <F, A>(fa: Kind<F, [A]>) => Stream<F, A> = s =>
  repeatOp(evalF(s));

export const sleep =
  <F>(F: Temporal<F, Error>) =>
  (ms: number): Stream<F, void> =>
    evalF(F.sleep(ms));

export const retry =
  <F>(F: Temporal<F, Error>) =>
  <A>(
    fa: Kind<F, [A]>,
    delay: number,
    nextDelay: (n: number) => number,
    maxAttempts: number,
    retriable: (e: Error) => boolean = () => true,
  ): Stream<F, A> => {
    assert(maxAttempts > 0, 'max attempts must be >0');

    const delays = unfold(delay)<F, number>(d => Some([d, nextDelay(d)]));

    return pipe(
      evalF(fa),
      attempts(F)(delays),
      take(maxAttempts),
      takeWhile(
        ea => ea.fold(retriable, constant(false)),
        /* takeFailure: */ true,
      ),
      last,
      rethrow,
    );
  };

export const range = <F>(
  from: number,
  until: number,
  step: number = 1,
): Stream<F, number> => {
  const go = (i: number): Stream<F, number> =>
    i < until ? pure<F, number>(i)['+++'](defer(() => go(i + step))) : empty();

  return go(from);
};

export const never: <F>(F: Spawn<F, Error>) => Stream<F, never> = F =>
  evalF(F.never);

export const fromArray = <F, A>(xs: A[]): Stream<F, A> => {
  switch (xs.length) {
    case 0:
      return empty();
    case 1:
      return pure(xs[0]);
    default:
      return new Stream(Pull.output(Chunk.fromArray(xs)));
  }
};

export const unfold =
  <S>(s: S) =>
  <F, A>(f: (s: S) => Option<[A, S]>): Stream<F, A> => {
    const loop = (s: S): Stream<F, A> =>
      f(s).fold(
        () => empty(),
        ([a, next]) =>
          concat_(
            pure(a),
            defer(() => loop(next)),
          ),
      );
    return loop(s);
  };

export const unfoldChunk =
  <S>(s: S) =>
  <F, A>(f: (s: S) => Option<[Chunk<A>, S]>): Stream<F, A> =>
    pipe(
      unfold(s)<F, Chunk<A>>(f),
      flatMap(x => fromChunk(x)),
    );

export const tailRecM: <S>(
  s: S,
) => <F, A>(f: (s: S) => Stream<F, Either<S, A>>) => Stream<F, A> = s => f =>
  tailRecM_(s, f);

export const tailRecM_ = <F, S, A>(
  s: S,
  f: (s: S) => Stream<F, Either<S, A>>,
): Stream<F, A> =>
  pipe(
    f(s),
    flatMap(ea =>
      ea.fold(
        s => tailRecM_(s, f),
        a => pure(a),
      ),
    ),
  );

export const fromList = <F, A>(xs: List<A>): Stream<F, A> =>
  fromArray(xs.toArray);

export const fromVector = <F, A>(xs: Vector<A>): Stream<F, A> =>
  fromArray(xs.toArray);

export const fromChunk = <F, A>(chunk: Chunk<A>): Stream<F, A> =>
  new Stream(Pull.output(chunk));

export const bracket = <F, R>(
  resource: Kind<F, [R]>,
  release: (r: R, ec: ExitCase) => Kind<F, [void]>,
): Stream<F, R> => bracketWeak(resource, release).scope;

export const bracketWeak = <F, R>(
  resource: Kind<F, [R]>,
  release: (r: R, ec: ExitCase) => Kind<F, [void]>,
): Stream<F, R> =>
  new Stream(Pull.acquire(resource, release).flatMap(Pull.output1));

export const bracketFull =
  <F>(F: MonadCancel<F, Error>) =>
  <R>(
    acquire: (p: Poll<F>) => Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ): Stream<F, R> =>
    scope(bracketFullWeak(F)(acquire, release));

export const bracketFullWeak =
  <F>(F: MonadCancel<F, Error>) =>
  <R>(
    acquire: (p: Poll<F>) => Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ): Stream<F, R> =>
    new Stream(
      Pull.acquireCancelable(F)(acquire, release).flatMap(Pull.output1),
    );
