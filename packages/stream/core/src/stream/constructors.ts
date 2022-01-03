// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { constant, fst, id, Kind, pipe } from '@fp4ts/core';
import { Either, List, Option, Some, Vector } from '@fp4ts/cats';
import {
  ExitCase,
  Poll,
  MonadCancel,
  Spawn,
  Temporal,
  Resource,
  QueueSource,
} from '@fp4ts/effect';
import { view } from '@fp4ts/effect-kernel/lib/resource/algebra';

import { PureK } from '../pure';
import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Stream } from './algebra';
import {
  attempts,
  concat_,
  evalMap_,
  flatMap,
  flatMap_,
  last,
  mapNoScope,
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

export const emitChunk = <F, A>(c: Chunk<A>): Stream<F, A> =>
  new Stream(Pull.output(c));

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

export const awakeDelay =
  <F>(F: Temporal<F, Error>) =>
  (period: number): Stream<F, number> =>
    flatMap_(evalF(F.monotonic), start =>
      evalMap_(fixedDelay(F)(period), () =>
        F.map_(F.monotonic, cur => cur - start),
      ),
    );

export const fixedDelay =
  <F>(F: Temporal<F, Error>) =>
  (period: number): Stream<F, void> =>
    repeatOp(sleep(F)(period));

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

export const resource =
  <F>(F: MonadCancel<F, Error>) =>
  <A>(r: Resource<F, A>): Stream<F, A> =>
    scope(resourceWeak(F)(r));

export const resourceWeak = <F>(F: MonadCancel<F, Error>) => {
  return function go<A>(r0: Resource<F, A>): Stream<F, A> {
    const r = view(r0);
    switch (r.tag) {
      case 'allocate':
        return pipe(
          bracketFullWeak(F)(r.resource, ([, release], exit) => release(exit)),
          mapNoScope(fst),
        );

      case 'flatMap':
        return defer(() => flatMap_(go(r.self), x => go(r.f(x))));

      case 'pure':
        return pure(r.value);

      case 'eval':
        return evalF(r.fa);
    }
  };
};

export const fromQueueNoneTerminated = <F, A>(
  q: QueueSource<F, Option<A>>,
  limit: number = Infinity,
): Stream<F, A> =>
  _fromQueueNoneTerminatedSingletons(q.take(), q.tryTake(), limit);

export const fromQueueNoneTerminatedChunk = <F, A>(
  q: QueueSource<F, Option<Chunk<A>>>,
  limit: number = Infinity,
): Stream<F, A> => _fromQueueNoneTerminatedChunk(q.take(), q.tryTake(), limit);

// -- Private implementation

const _fromQueueNoneTerminatedSingletons = <F, A>(
  take: Kind<F, [Option<A>]>,
  tryTake: Kind<F, [Option<Option<A>>]>,
  limit: number,
): Stream<F, A> => {
  const await: Stream<F, A> = flatMap_(evalF(take), opt =>
    opt.fold(
      () => empty(),
      c => pump(1, [c]),
    ),
  );

  const pump = (curSize: number, acc: A[]): Stream<F, A> => {
    if (curSize === limit) {
      return concat_(fromArray(acc), await);
    } else {
      return flatMap_(evalF(tryTake), opt =>
        opt.fold(
          () => concat_(fromArray(acc), await),
          opt =>
            opt.fold(
              () => fromArray(acc),
              c => {
                acc.push(c);
                return pump(curSize + 1, acc);
              },
            ),
        ),
      );
    }
  };

  return await;
};

const _fromQueueNoneTerminatedChunk = <F, A>(
  take: Kind<F, [Option<Chunk<A>>]>,
  tryTake: Kind<F, [Option<Option<Chunk<A>>>]>,
  limit: number,
): Stream<F, A> => {
  const await: Stream<F, A> = flatMap_(evalF(take), opt =>
    opt.fold(
      () => empty(),
      c => pump(c),
    ),
  );

  const pump = (acc: Chunk<A>): Stream<F, A> => {
    const sz = acc.size;
    if (sz > limit) {
      const [pfx, sfx] = acc.splitAt(limit);
      return concat_(
        fromChunk(pfx),
        defer(() => pump(sfx)),
      );
    } else if (sz === limit) {
      return concat_(fromChunk(acc), await);
    } else {
      return flatMap_(evalF(tryTake), opt =>
        opt.fold(
          () => concat_(fromChunk(acc), await),
          opt =>
            opt.fold(
              () => fromChunk(acc),
              c => pump(acc['+++'](c)),
            ),
        ),
      );
    }
  };

  return await;
};
