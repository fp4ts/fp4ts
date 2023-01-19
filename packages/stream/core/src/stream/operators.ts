// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { id, Kind, pipe, tupled } from '@fp4ts/core';
import {
  Applicative,
  Eq,
  Functor,
  Monoid,
  MonoidK,
  Either,
  Left,
  None,
  Option,
  Right,
  Some,
  Ior,
  FunctionK,
} from '@fp4ts/cats';
import {
  Temporal,
  Sync,
  Concurrent,
  Semaphore,
  Deferred,
  Outcome,
  Fiber,
  QueueSink,
} from '@fp4ts/effect';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Compiler } from '../compiler';
import { Scope } from '../internal';

import { Stream } from './algebra';
import {
  fromChunk,
  pure,
  defer,
  throwError,
  evalF,
  evalUnChunk,
  sleep,
  force,
  bracket,
  emitChunk,
  fixedDelay,
  execF,
} from './constructors';
import { CompileOps } from './compile-ops';
import { Channel, Signal, SignallingRef } from '../concurrent';
import { CompositeFailure } from '../composite-failure';

export const head: <F, A>(s: Stream<F, A>) => Stream<F, A> = s => take_(s, 1);

export const headOption: <F, A>(s: Stream<F, A>) => Stream<F, Option<A>> = s =>
  s.pull.uncons1.flatMap(opt => Pull.output1(opt.map(([hd]) => hd))).stream();

export const tail: <F, A>(s: Stream<F, A>) => Stream<F, A> = s => drop_(s, 1);

export const last: <F, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  s.pull.last.flatMap(Pull.outputOption1).stream();

export const lastOption: <F, A>(s: Stream<F, A>) => Stream<F, Option<A>> = s =>
  s.pull.last.flatMap(Pull.output1).stream();

export const init: <F, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  dropRight_(s, 1);

export const uncons: <F, A>(
  s: Stream<F, A>,
) => Stream<F, Option<[A, Stream<F, A>]>> = s =>
  s.pull.uncons1
    .flatMap(opt =>
      Pull.output1(opt.map(([hd, tl]) => tupled(hd, new Stream(tl)))),
    )
    .stream();

export const repeat: <F, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  concat_(
    s,
    defer(() => repeat(s)),
  );

export const cons: <F, A>(x: A, s: Stream<F, A>) => Stream<F, A> = (x, s) =>
  prepend_(s, x);

export const consChunk: <F, A>(c: Chunk<A>, s: Stream<F, A>) => Stream<F, A> = (
  c,
  s,
) => prependChunk_(s, c);

export const prepend: <A2>(
  x: A2,
) => <F, A extends A2>(s: Stream<F, A>) => Stream<F, A2> = x => s =>
  prepend_(s, x);

export const prependChunk: <A2>(
  c: Chunk<A2>,
) => <F, A extends A2>(s: Stream<F, A>) => Stream<F, A2> = c => s =>
  prependChunk_(s, c);

export const drain = <F, A>(s: Stream<F, A>): Stream<F, never> =>
  repeatPull_(s, p =>
    p.uncons.flatMap(uc => Pull.pure(uc.map(([, pp]) => pp))),
  );

export const take: (n: number) => <F, A>(s: Stream<F, A>) => Stream<F, A> =
  n => s =>
    take_(s, n);

export const takeRight: (
  n: number,
) => <F, A>(s: Stream<F, A>) => Stream<F, A> = n => s => takeRight_(s, n);

export const takeWhile: <A>(
  pred: (a: A) => boolean,
  takeFailure?: boolean,
) => <F>(s: Stream<F, A>) => Stream<F, A> = (pred, takeFailure) => s =>
  takeWhile_(s, pred, takeFailure);

export const drop: (n: number) => <F, A>(s: Stream<F, A>) => Stream<F, A> =
  n => s =>
    drop_(s, n);

export const dropRight: (
  n: number,
) => <F, A>(s: Stream<F, A>) => Stream<F, A> = n => s => dropRight_(s, n);

export const dropWhile: <A>(
  pred: (a: A) => boolean,
  dropFailure?: boolean,
) => <F>(s: Stream<F, A>) => Stream<F, A> =
  (pred, dropFailure = false) =>
  s =>
    dropWhile_(s, pred, dropFailure);

export const concat: <F, A>(
  s2: Stream<F, A>,
) => (s1: Stream<F, A>) => Stream<F, A> = s2 => s1 => concat_(s1, s2);

export const chunks = <F, A>(s: Stream<F, A>): Stream<F, Chunk<A>> =>
  repeatPull_(s, p =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.pure(None),
        ([hd, tl]) => Pull.output1<F, Chunk<A>>(hd).map(() => Some(tl)),
      ),
    ),
  );

export const chunkAll = <F, A>(s: Stream<F, A>): Stream<F, Chunk<A>> => {
  const loop = (p: Pull<F, A, void>, acc: Chunk<A>): Pull<F, Chunk<A>, void> =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.output1(acc),
        ([hd, tl]) => loop(tl, acc['+++'](hd)),
      ),
    );
  return loop(s.pull, Chunk.empty).stream();
};

export const chunkLimit: (
  limit: number,
) => <F, A>(s: Stream<F, A>) => Stream<F, Chunk<A>> = limit => s =>
  chunkLimit_(s, limit);

export const chunkMin: (
  n: number,
  allowFewerTotal?: boolean,
) => <F, A>(s: Stream<F, A>) => Stream<F, Chunk<A>> =
  (n, allowFewerTotal = true) =>
  s =>
    chunkMin_(s, n, allowFewerTotal);

export const chunkN: (
  n: number,
  allowFewer?: boolean,
) => <F, A>(s: Stream<F, A>) => Stream<F, Chunk<A>> =
  (n, allowFewer = false) =>
  s =>
    chunkN_(s, n, allowFewer);

export const unchunks = <F, A>(s: Stream<F, Chunk<A>>): Stream<F, A> =>
  flatMap_(s, c => fromChunk(c));

export const sliding: (
  size: number,
  step?: number,
) => <F, A>(s: Stream<F, A>) => Stream<F, Chunk<A>> =
  (size, step = 1) =>
  s =>
    sliding_(s, size, step);

export const changes: <A>(E: Eq<A>) => <F>(s: Stream<F, A>) => Stream<F, A> =
  E => s =>
    filterWithPrevious_(s, E.notEquals);

export const filter: <A>(
  pred: (a: A) => boolean,
) => <F>(s: Stream<F, A>) => Stream<F, A> = pred => s => filter_(s, pred);

export const filterNot: <A>(
  pred: (a: A) => boolean,
) => <F>(s: Stream<F, A>) => Stream<F, A> = pred => s => filterNot_(s, pred);

export const filterWithPrevious: <A>(
  f: (prev: A, next: A) => boolean,
) => <F>(s: Stream<F, A>) => Stream<F, A> = f => s => filterWithPrevious_(s, f);

export const collect: <A, B>(
  f: (a: A) => Option<B>,
) => <F>(s: Stream<F, A>) => Stream<F, B> = f => s => collect_(s, f);

export const collectFirst: <A, B>(
  f: (a: A) => Option<B>,
) => <F>(s: Stream<F, A>) => Stream<F, B> = f => s => collectFirst_(s, f);

export const collectWhile: <A, B>(
  f: (a: A) => Option<B>,
) => <F>(s: Stream<F, A>) => Stream<F, B> = f => s => collectWhile_(s, f);

export const mapChunks: <A, B>(
  f: (c: Chunk<A>) => Chunk<B>,
) => <F>(s: Stream<F, A>) => Stream<F, B> = f => s => mapChunks_(s, f);

export const map: <A, B>(
  f: (a: A) => B,
) => <F>(s: Stream<F, A>) => Stream<F, B> = f => s => map_(s, f);

export const mapNoScope: <A, B>(
  f: (a: A) => B,
) => <F>(s: Stream<F, A>) => Stream<F, B> = f => s => mapNoScope_(s, f);

export const mapAccumulate: <S>(
  init: S,
) => <AA, B>(
  f: (s: S, aa: AA) => [S, B],
) => <F, A extends AA>(s: Stream<F, A>) => Stream<F, [S, B]> = init => f => s =>
  mapAccumulate_(s, init, f);

export const evalMap: <F, A, B>(
  f: (a: A) => Kind<F, [B]>,
) => (s: Stream<F, A>) => Stream<F, B> = f => s => evalMap_(s, f);

export const evalCollect: <F, A, B>(
  f: (a: A) => Kind<F, [Option<B>]>,
) => (s: Stream<F, A>) => Stream<F, B> = f => s => evalCollect_(s, f);

export const evalTap: <F>(
  F: Functor<F>,
) => <A>(
  f: (a: A) => Kind<F, [unknown]>,
) => (s: Stream<F, A>) => Stream<F, A> = F => f => s => evalTap_(F)(s, f);

export const evalMapChunk: <F>(
  F: Applicative<F>,
) => <A, B>(f: (a: A) => Kind<F, [B]>) => (s: Stream<F, A>) => Stream<F, B> =
  F => f => s =>
    evalMapChunk_(F)(s, f);

export const flatMap: <F, A, B>(
  f: (a: A) => Stream<F, B>,
) => (s: Stream<F, A>) => Stream<F, B> = f => s => flatMap_(s, f);

export const flatten: <F, A>(
  ss: Stream<F, Stream<F, A>>,
) => Stream<F, A> = ss => flatMap_(ss, id);

export const forEach: <F, A>(
  f: (a: A) => Kind<F, [void]>,
) => (s: Stream<F, A>) => Stream<F, never> = f => s => forEach_(s, f);

export const through: <F, A, B>(
  f: (s: Stream<F, A>) => Stream<F, B>,
) => (s: Stream<F, A>) => Stream<F, B> = f => s => through_(s, f);

export const through2: <F, A, B, C>(
  s2: Stream<F, B>,
  f: (s1: Stream<F, A>, s2: Stream<F, B>) => Stream<F, C>,
) => (s1: Stream<F, A>) => Stream<F, C> = (s2, f) => s1 => through2_(s1, s2, f);

export const throughF: <F, G, A>(
  f: (s: Stream<F, A>) => Stream<G, A>,
) => (s: Stream<F, A>) => Stream<G, A> = f => s => throughF_(s, f);

export const fold: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => <F>(s: Stream<F, A>) => Stream<F, B> = (z, f) => s => fold_(s, z, f);

export const foldMap: <M>(
  M: Monoid<M>,
) => <F, A>(f: (a: A) => M) => (s: Stream<F, A>) => Stream<F, M> =
  M => f => s =>
    foldMap_(M)(s, f);

export const foldMapK: <G>(
  G: MonoidK<G>,
) => <A, B>(
  f: (a: A) => Kind<G, [B]>,
) => <F>(s: Stream<F, A>) => Stream<F, Kind<G, [B]>> = G => f => s =>
  foldMapK_(G)(s, f);

export const scan: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => <F>(s: Stream<F, A>) => Stream<F, B> = (z, f) => s => scan_(s, z, f);

export const scan1: <A2>(
  f: (x: A2, y: A2) => A2,
) => <F, A extends A2>(s: Stream<F, A>) => Stream<F, A2> = f => s =>
  scan1_(s, f);

export const evalScan: <F, A, B>(
  z: B,
  f: (b: B, a: A) => Kind<F, [B]>,
) => (s: Stream<F, A>) => Stream<F, B> = (z, f) => s => evalScan_(s, z, f);

export const scanChunks: <S>(
  init: S,
) => <A, B>(
  f: (s: S, c: Chunk<A>) => [S, Chunk<B>],
) => <F>(s: Stream<F, A>) => Stream<F, B> = init => f => s =>
  scanChunks_(s, init, f);

export const scanChunksOpt: <S>(
  init: S,
) => <AA, B>(
  f: (s: S) => Option<(c: Chunk<AA>) => [S, Chunk<B>]>,
) => <F, A extends AA>(s: Stream<F, A>) => Stream<F, B> = init => f => s =>
  scanChunksOpt_(s, init, f);

export const noneTerminate = <F, A>(s: Stream<F, A>): Stream<F, Option<A>> =>
  pipe(s, map(Some), concat(pure(None as Option<A>)));

export const unNoneTerminate = <F, A>(s: Stream<F, Option<A>>): Stream<F, A> =>
  repeatPull_(s, pull =>
    pull.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.pure(None),
        ([hd, tl]) =>
          hd
            .findIndex(x => x.isEmpty)
            .fold(
              () => Pull.output<F, A>(hd.map(x => x.get)).map(() => Some(tl)),
              idx =>
                idx === 0
                  ? Pull.pure(None)
                  : Pull.output<F, A>(hd.take(idx).map(x => x.get)).map(
                      () => None,
                    ),
            ),
      ),
    ),
  );

export const intersperse: <A>(
  separator: A,
) => <F>(s: Stream<F, A>) => Stream<F, A> = separator => s =>
  intersperse_(s, separator);

export const align: <F, B>(
  s2: Stream<F, B>,
) => <A>(s1: Stream<F, A>) => Stream<F, Ior<A, B>> = s2 => s1 => align_(s1, s2);

export const zip: <F, B>(
  s2: Stream<F, B>,
) => <A>(s1: Stream<F, A>) => Stream<F, [A, B]> = s2 => s1 => zip_(s1, s2);

export const zipLeft: <F, B>(
  s2: Stream<F, B>,
) => <A>(s1: Stream<F, A>) => Stream<F, A> = s2 => s1 => zipLeft_(s1, s2);

export const zipRight: <F, B>(
  s2: Stream<F, B>,
) => <A>(s1: Stream<F, A>) => Stream<F, B> = s2 => s1 => zipRight_(s1, s2);

export const zipWith: <F, A, B, C>(
  s2: Stream<F, B>,
  f: (a: A, b: B) => C,
) => (s1: Stream<F, A>) => Stream<F, C> = (s2, f) => s1 => zipWith_(s1, s2)(f);

export const zipWithIndex = <F, A>(s: Stream<F, A>): Stream<F, [A, number]> =>
  pipe(
    s,
    scanChunks(0)((index, chunk: Chunk<A>) => {
      const out = chunk.map(o => [o, index++] as [A, number]);
      return [index, out];
    }),
  );

export const zipWithNext = <F, A>(
  s: Stream<F, A>,
): Stream<F, [A, Option<A>]> => {
  const go = (p: Pull<F, A, void>, last: A): Pull<F, [A, Option<A>], void> =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.output1([last, None]),
        ([hd, tl]) => {
          const [newLast, out] = hd.mapAccumulate(last)((prev, next) => [
            next,
            [prev, Some(next)] as [A, Option<A>],
          ]);
          return Pull.output<F, [A, Option<A>]>(out)['>>>'](() =>
            go(tl, newLast),
          );
        },
      ),
    );

  return s.pull.uncons1
    .flatMap(opt =>
      opt.fold(
        () => Pull.done<F>(),
        ([hd, tl]) => go(tl, hd),
      ),
    )
    .stream();
};

export const zipWithPrevious = <F, A>(
  s: Stream<F, A>,
): Stream<F, [Option<A>, A]> =>
  pipe(
    s,
    mapAccumulate(None as Option<A>)<A, [Option<A>, A]>((prev, next) =>
      // prettier-ignore
      [Some(next), [prev, next]],
    ),
    map(([, r]) => r),
  );

export const zipAll: <F, B>(
  s2: Stream<F, B>,
) => <A2>(
  pad1: A2,
  pad2: B,
) => <A extends A2>(s1: Stream<F, A>) => Stream<F, [A2, B]> =
  s2 => (pad1, pad2) => s1 =>
    zipAll_(s1, s2, pad1, pad2);

export const zipAllWith: <F, B>(
  s2: Stream<F, B>,
) => <A2>(
  pad1: A2,
  pad2: B,
) => <C>(
  f: (a: A2, b: B) => C,
) => <A extends A2>(s1: Stream<F, A>) => Stream<F, C> =
  s2 => (pad1, pad2) => f => s1 =>
    zipAllWith_(s1, s2, pad1, pad2)(f);

export const merge: <F>(
  F: Concurrent<F, Error>,
) => <A>(s2: Stream<F, A>) => (s1: Stream<F, A>) => Stream<F, A> =
  F => s2 => s1 =>
    merge_(F)(s1, s2);

export const mergeHaltBoth: <F>(
  F: Concurrent<F, Error>,
) => <A>(s2: Stream<F, A>) => (s1: Stream<F, A>) => Stream<F, A> =
  F => s2 => s1 =>
    mergeHaltBoth_(F)(s1, s2);

export const mergeHaltL: <F>(
  F: Concurrent<F, Error>,
) => <A>(s2: Stream<F, A>) => (s1: Stream<F, A>) => Stream<F, A> =
  F => s2 => s1 =>
    mergeHaltL_(F)(s1, s2);

export const mergeHaltR: <F>(
  F: Concurrent<F, Error>,
) => <A>(s2: Stream<F, A>) => (s1: Stream<F, A>) => Stream<F, A> =
  F => s2 => s1 =>
    mergeHaltR_(F)(s1, s2);

export const parJoin: <F>(
  F: Concurrent<F, Error>,
) => (maxOpen: number) => <A>(outer: Stream<F, Stream<F, A>>) => Stream<F, A> =
  F => maxOpen => outer =>
    parJoin_(F)(outer, maxOpen);

export const parJoinUnbounded: <F>(
  F: Concurrent<F, Error>,
) => <A>(outer: Stream<F, Stream<F, A>>) => Stream<F, A> = F => outer =>
  parJoin_(F)(outer, Infinity);

export const repeatPull: <F, A, B>(
  f: (p: Pull<F, A, void>) => Pull<F, B, Option<Pull<F, A, void>>>,
) => (s: Stream<F, A>) => Stream<F, B> = f => s => repeatPull_(s, f);

export const onFinalize: <F>(
  F: Applicative<F>,
) => (fin: Kind<F, [void]>) => <A>(s: Stream<F, A>) => Stream<F, A> =
  F => fin => s =>
    onFinalize_(F)(s, fin);

export const interruptWhenTrue: <F>(
  F: Concurrent<F, Error>,
) => (
  haltWhenTrue: Stream<F, boolean>,
) => <A>(s: Stream<F, A>) => Stream<F, A> = F => haltWhenTrue => s =>
  interruptWhenTrue_(F)(s, haltWhenTrue);

export const interruptWhen: <F>(
  haltOnSignal: Kind<F, [Either<Error, void>]>,
) => <A>(s: Stream<F, A>) => Stream<F, A> = haltOnSignal => s =>
  interruptWhen_(s, haltOnSignal);

export const attempt = <F, A>(s: Stream<F, A>): Stream<F, Either<Error, A>> =>
  pipe(
    s,
    map(x => Right(x)),
    handleErrorWith(e => pure(Left(e))),
  );

export const attempts: <F>(
  F: Temporal<F, Error>,
) => (
  delays: Stream<F, number>,
) => <A>(s: Stream<F, A>) => Stream<F, Either<Error, A>> = F => delays => s =>
  attempts_(F)(s, delays);

export const redeemWith: <F, A, B>(
  onFailure: (e: Error) => Stream<F, B>,
  onSuccess: (a: A) => Stream<F, B>,
) => (s: Stream<F, A>) => Stream<F, B> = (onFailure, onSuccess) => s =>
  redeemWith_(s, onFailure, onSuccess);

export const rethrow = <F, A>(s: Stream<F, Either<Error, A>>): Stream<F, A> =>
  pipe(
    chunks(s),
    flatMap(c => {
      const firstError = c.findIndex(ea => ea.isLeft);
      return firstError.fold(
        () => fromChunk(c.map(ea => ea.get)),
        i => throwError(c['!!'](i).getLeft),
      );
    }),
  );

export const handleErrorWith: <F, A2>(
  h: (e: Error) => Stream<F, A2>,
) => <A extends A2>(s: Stream<F, A>) => Stream<F, A2> = h => s =>
  handleErrorWith_(s, h);

export const delayBy: <F>(
  F: Temporal<F, Error>,
) => (ms: number) => <A>(s: Stream<F, A>) => Stream<F, A> = F => ms => s =>
  delayBy_(F)(s, ms);

export const spaced: <F>(
  F: Temporal<F, Error>,
) => (period: number) => <A>(s: Stream<F, A>) => Stream<F, A> =
  F => period => s =>
    spaced_(F)(s, period);

export const scope = <F, A>(s: Stream<F, A>): Stream<F, A> =>
  new Stream(s.pull.scope());

export const interruptScope = <F, A>(s: Stream<F, A>): Stream<F, A> =>
  new Stream(s.pull.interruptScope());

export const concurrently: <F>(
  F: Concurrent<F, Error>,
) => <B>(s2: Stream<F, B>) => <A>(s1: Stream<F, A>) => Stream<F, A> =
  F => s2 => s1 =>
    concurrently_(F)(s1, s2);

export const enqueueNoneTerminated: <F, A>(
  q: QueueSink<F, Option<A>>,
) => (s: Stream<F, A>) => Stream<F, never> = q => s =>
  enqueueNoneTerminated_(s, q);

export const enqueueNoneTerminatedChunks: <F, A>(
  q: QueueSink<F, Option<Chunk<A>>>,
) => (s: Stream<F, A>) => Stream<F, never> = q => s =>
  enqueueNoneTerminatedChunks_(s, q);

export const covary =
  <F2>() =>
  <F extends F2, A>(s: Stream<F, A>): Stream<F2, A> =>
    s as Stream<F2, A>;

export const covaryOutput =
  <B>() =>
  <F, A extends B>(s: Stream<F, A>): Stream<F, B> =>
    s;

export const covaryAll =
  <F2, B>() =>
  <F extends F2, A extends B>(s: Stream<F, A>): Stream<F2, B> =>
    s as Stream<F2, A>;

export const mapK: <F, G>(
  nt: FunctionK<F, G>,
) => <A>(s: Stream<F, A>) => Stream<G, A> = nt => s => mapK_(s, nt);

export const compile = <F, G, A>(
  s: Stream<F, A>,
  compiler: Compiler<F, G>,
): CompileOps<F, G, A> => new CompileOps(s.pull, compiler);

export const compileSync = <F, A>(
  s: Stream<F, A>,
  F: Sync<F>,
): CompileOps<F, F, A> => new CompileOps(s.pull, Compiler.targetSync(F));

export const compileConcurrent = <F, A>(
  s: Stream<F, A>,
  F: Concurrent<F, Error>,
): CompileOps<F, F, A> => new CompileOps(s.pull, Compiler.targetConcurrent(F));

// -- Point-ful operators

export const prepend_ = <F, A>(s: Stream<F, A>, c: A): Stream<F, A> =>
  concat_(pure(c), s);

export const prependChunk_ = <F, A>(
  s: Stream<F, A>,
  c: Chunk<A>,
): Stream<F, A> => concat_(fromChunk(c), s);

export const take_ = <F, A>(s: Stream<F, A>, n: number): Stream<F, A> =>
  s.pull.take(n).void.stream();

export const takeRight_ = <F, A>(s: Stream<F, A>, n: number): Stream<F, A> =>
  s.pull.takeRight(n).flatMap(Pull.output).stream();

export const takeWhile_ = <F, A>(
  s: Stream<F, A>,
  p: (a: A) => boolean,
  takeFailure: boolean = false,
): Stream<F, A> => s.pull.takeWhile(p, takeFailure).void.stream();

export const drop_ = <F, A>(s: Stream<F, A>, n: number): Stream<F, A> =>
  s.pull
    .drop(n)
    .flatMap(opt => opt.map(id).getOrElse(() => Pull.done()))
    .stream();

export const dropRight_ = <F, A>(s: Stream<F, A>, n: number): Stream<F, A> => {
  const go = (p: Pull<F, A, void>, acc: Chunk<A>): Pull<F, A, void> =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.done(),
        ([hd, tl]) => {
          const all = acc['+++'](hd);
          return Pull.output<F, A>(all.dropRight(n))['>>>'](() =>
            go(tl, all.takeRight(n)),
          );
        },
      ),
    );

  return n <= 0 ? s : go(s.pull, Chunk.empty).stream();
};

export const dropWhile_ = <F, A>(
  s: Stream<F, A>,
  pred: (a: A) => boolean,
  dropFailure: boolean = false,
): Stream<F, A> =>
  s.pull
    .dropWhile(pred, dropFailure)
    .flatMap(opt => opt.fold(() => Pull.done<F>(), id))
    .stream();

export const concat_ = <F, A>(
  s1: Stream<F, A>,
  s2: Stream<F, A>,
): Stream<F, A> => new Stream(s1.pull.flatMap(() => s2.pull));

export const attempts_ =
  <F>(F: Temporal<F, Error>) =>
  <A>(
    s: Stream<F, A>,
    delays: Stream<F, number>,
  ): Stream<F, Either<Error, A>> =>
    concat_(
      attempt(s),
      pipe(
        delays,
        flatMap(sleep(F)),
        flatMap(() => attempt(s)),
      ),
    );

export const redeemWith_ = <F, A, B>(
  s: Stream<F, A>,
  onFailure: (e: Error) => Stream<F, B>,
  onSuccess: (a: A) => Stream<F, B>,
): Stream<F, B> =>
  pipe(
    s,
    attempt,
    flatMap(ea => ea.fold(onFailure, onSuccess)),
  );

export const handleErrorWith_ = <F, A>(
  s: Stream<F, A>,
  h: (e: Error) => Stream<F, A>,
): Stream<F, A> => new Stream(s.pull.scope().handleErrorWith(e => h(e).pull));

export const chunkLimit_ = <F, A>(
  s: Stream<F, A>,
  limit: number,
): Stream<F, Chunk<A>> =>
  repeatPull_(s, p =>
    p.unconsLimit(limit).flatMap(opt =>
      opt.fold(
        () => Pull.pure(None),
        ([hd, tl]) => Pull.output1<F, Chunk<A>>(hd).map(() => Some(tl)),
      ),
    ),
  );

export const chunkMin_ = <F, A>(
  s: Stream<F, A>,
  n: number,
  allowFewerTotal: boolean = true,
): Stream<F, Chunk<A>> => {
  const go = (p: Pull<F, A, void>, c: Chunk<A>): Pull<F, Chunk<A>, void> =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => (c.size > 0 && allowFewerTotal ? Pull.output1(c) : Pull.done()),
        ([hd, tl]) => {
          const next = c['+++'](hd);
          return next.size >= n
            ? Pull.output1<F, Chunk<A>>(next)['>>>'](() => go(tl, Chunk.empty))
            : go(tl, next);
        },
      ),
    );

  return s.pull.uncons
    .flatMap(opt =>
      opt.fold(
        () => Pull.done<F>(),
        ([hd, tl]) =>
          hd.size >= n
            ? Pull.output1<F, Chunk<A>>(hd)['>>>'](() => go(tl, Chunk.empty))
            : go(tl, hd),
      ),
    )
    .stream();
};

export const chunkN_ = <F, A>(
  s: Stream<F, A>,
  n: number,
  allowFewer: boolean = false,
): Stream<F, Chunk<A>> =>
  repeatPull_(s, p =>
    p.unconsN(n, allowFewer).flatMap(opt =>
      opt.fold(
        () => Pull.pure(None),
        ([hd, tl]) => Pull.output1<F, Chunk<A>>(hd).map(() => Some(tl)),
      ),
    ),
  );

export const sliding_ = <F, A>(
  s: Stream<F, A>,
  size: number,
  step: number = 1,
): Stream<F, Chunk<A>> => {
  assert(size > 0, 'sliding window size must be >0');
  assert(step > 0, 'sliding window step must be >0');

  const stepNotSmallerThanSize = (
    p: Pull<F, A, void>,
    prev: Chunk<A>,
  ): Pull<F, Chunk<A>, void> =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => (prev.isEmpty ? Pull.done() : Pull.output1(prev.take(size))),
        ([hd, tl]) => {
          const arr: Chunk<A>[] = [];
          let current = prev['+++'](hd);
          while (current.size >= step) {
            const [hdx, tlx] = current.splitAt(step);
            arr.push(hdx.take(size));
            current = tlx;
          }
          return Pull.output<F, Chunk<A>>(Chunk.fromArray(arr))['>>>'](() =>
            stepNotSmallerThanSize(tl, current),
          );
        },
      ),
    );

  const stepSmallerThanSize = (
    p: Pull<F, A, void>,
    window: Chunk<A>,
    prev: Chunk<A>,
  ): Pull<F, Chunk<A>, void> =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () =>
          prev.isEmpty
            ? Pull.done()
            : Pull.output1<F, Chunk<A>>(window['+++'](prev).take(size)),
        ([hd, tl]) => {
          const arr: Chunk<A>[] = [];
          let w = window;
          let current = prev['+++'](hd);
          while (current.size >= step) {
            const [hdx, tlx] = current.splitAt(step);
            const wind = w['+++'](hdx);
            arr.push(wind);
            w = wind.drop(step);
            current = tlx;
          }
          return Pull.output<F, Chunk<A>>(Chunk.fromArray(arr))['>>>'](() =>
            stepSmallerThanSize(tl, w, current),
          );
        },
      ),
    );

  const resultPull =
    step < size
      ? s.pull.unconsN(size, true).flatMap(opt =>
          opt.fold(
            () => Pull.done<F>(),
            ([hd, tl]) =>
              Pull.output1<F, Chunk<A>>(hd)['>>>'](() =>
                stepSmallerThanSize(tl, hd.drop(step), Chunk.emptyChain),
              ),
          ),
        )
      : stepNotSmallerThanSize(s.pull, Chunk.emptyChain);

  return resultPull.stream();
};

export const filter_ = <F, A>(
  s: Stream<F, A>,
  pred: (a: A) => boolean,
): Stream<F, A> => mapChunks_(s, chunk => chunk.filter(pred));

export const filterNot_ = <F, A>(
  s: Stream<F, A>,
  pred: (a: A) => boolean,
): Stream<F, A> => filter_(s, x => !pred(x));

export const filterWithPrevious_ = <F, A>(
  s: Stream<F, A>,
  f: (prev: A, cur: A) => boolean,
): Stream<F, A> => {
  const go = (p: Pull<F, A, void>, last: A): Pull<F, A, void> =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.done(),
        ([hd, tl]) => {
          const [allPass, newLast] = hd.foldLeft(
            [true, last] as [boolean, A],
            ([acc, last], a) => [acc && f(last, a), a],
          );
          // we can forward the chunk without modifications
          if (allPass)
            return Pull.output<F, A>(hd)['>>>'](() => go(tl, newLast));

          const arr: A[] = [];
          let curLast = last;
          hd.forEach(a => {
            if (f(curLast, a)) arr.push(a);
            curLast = a;
          });

          return Pull.output<F, A>(Chunk.fromArray(arr))['>>>'](() =>
            go(tl, curLast),
          );
        },
      ),
    );

  return s.pull.uncons1
    .flatMap(opt =>
      opt.fold(
        () => Pull.done<F>(),
        ([hd, tl]) => Pull.output1<F, A>(hd)['>>>'](() => go(tl, hd)),
      ),
    )
    .stream();
};

export const collect_ = <F, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Option<B>,
): Stream<F, B> => mapChunks_(s, c => c.collect(f));

export const collectFirst_ = <F, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Option<B>,
): Stream<F, B> =>
  s.pull
    .mapOutput(f)
    .find(x => x.nonEmpty)
    .flatMap(opt =>
      opt.fold(
        () => Pull.done<F>(),
        ([hd]) => Pull.output1<F, B>(hd.get),
      ),
    )
    .stream();

export const collectWhile_ = <F, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Option<B>,
): Stream<F, B> =>
  map_(
    s.pull
      .mapOutput(f)
      .takeWhile(o => o.nonEmpty)
      .void.stream(),
    o => o.get,
  );

export const mapChunks_ = <F, A, B>(
  s: Stream<F, A>,
  f: (c: Chunk<A>) => Chunk<B>,
): Stream<F, B> =>
  repeatPull_(s, p =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.pure(None),
        ([hd, tl]) => Pull.output<F, B>(f(hd)).map(() => Some(tl)),
      ),
    ),
  );

export const map_ = <F, A, B>(s: Stream<F, A>, f: (a: A) => B): Stream<F, B> =>
  s.pull.mapOutput(f).streamNoScope();

export const mapNoScope_ = <F, A, B>(
  s: Stream<F, A>,
  f: (a: A) => B,
): Stream<F, B> => s.pull.mapOutputNoScope(f).streamNoScope();

export const mapAccumulate_ = <F, S, A, B>(
  s: Stream<F, A>,
  init: S,
  f: (s: S, a: A) => [S, B],
): Stream<F, [S, B]> =>
  scanChunks_(s, init, (acc, chunk) =>
    chunk.mapAccumulate(acc)((s, a) => {
      const [s2, b] = f(s, a);
      return [s2, [s2, b]];
    }),
  );

export const evalMap_ = <F, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Kind<F, [B]>,
): Stream<F, B> => flatMap_(s, x => evalF(f(x)));

export const evalCollect_ = <F, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Kind<F, [Option<B>]>,
): Stream<F, B> => pipe(evalMap_(s, f), collect(id));

export const evalTap_ =
  <F>(F: Functor<F>) =>
  <A>(s: Stream<F, A>, f: (a: A) => Kind<F, [unknown]>): Stream<F, A> =>
    evalMap_(s, x => F.map_(f(x), () => x));

export const evalMapChunk_ =
  <F>(F: Applicative<F>) =>
  <A, B>(s: Stream<F, A>, f: (a: A) => Kind<F, [B]>): Stream<F, B> =>
    pipe(
      chunks(s),
      flatMap(c => evalUnChunk(c.traverse(F)(f))),
    );

export const flatMap_ = <F, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Stream<F, B>,
): Stream<F, B> => s.pull.flatMapOutput(o => f(o).pull).streamNoScope();

export const forEach_ = <F, A>(
  s: Stream<F, A>,
  f: (a: A) => Kind<F, [void]>,
): Stream<F, never> => flatMap_(s, x => execF(f(x)));

export const fold_ = <F, A, B>(
  s: Stream<F, A>,
  z: B,
  f: (b: B, a: A) => B,
): Stream<F, B> => s.pull.fold(z, f).flatMap(Pull.output1).stream();

export const through_ = <F, A, B>(
  s: Stream<F, A>,
  f: (s: Stream<F, A>) => Stream<F, B>,
): Stream<F, B> => f(s);

export const through2_ = <F, A, B, C>(
  s1: Stream<F, A>,
  s2: Stream<F, B>,
  f: (s1: Stream<F, A>, s2: Stream<F, B>) => Stream<F, C>,
): Stream<F, C> => f(s1, s2);

export const throughF_ = <F, G, A>(
  s: Stream<F, A>,
  f: (s: Stream<F, A>) => Stream<G, A>,
): Stream<G, A> => f(s);

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <F, A>(s: Stream<F, A>, f: (a: A) => M): Stream<F, M> =>
    fold_(s, M.empty, (m, a) => M.combine_(m, f(a)));

export const foldMapK_ =
  <G>(G: MonoidK<G>) =>
  <F, A, B>(
    s: Stream<F, A>,
    f: (a: A) => Kind<G, [B]>,
  ): Stream<F, Kind<G, [B]>> =>
    fold_(s, G.emptyK(), (m, a) => G.combineK_(m, f(a)));

export const scan_ = <F, A, B>(
  s: Stream<F, A>,
  z: B,
  f: (b: B, a: A) => B,
): Stream<F, B> =>
  Pull.output1<F, B>(z)
    ['>>>'](() => _scan(s.pull, z, f))
    .stream();

export const scan1_ = <F, A>(
  s: Stream<F, A>,
  f: (x: A, y: A) => A,
): Stream<F, A> =>
  s.pull.uncons
    .flatMap(opt =>
      opt.fold(
        () => Pull.done<F>(),
        ([hd, tl]) => {
          const [pfx, sfx] = hd.splitAt(1);
          const z = pfx['!!'](0);
          return Pull.output1<F, A>(z)['>>>'](() => _scan(tl.cons(sfx), z, f));
        },
      ),
    )
    .stream();

export const evalScan_ = <F, A, B>(
  s: Stream<F, A>,
  z: B,
  f: (b: B, a: A) => Kind<F, [B]>,
): Stream<F, B> => {
  const go = (z: B, p: Pull<F, A, void>): Pull<F, B, void> =>
    p.uncons1.flatMap(opt =>
      opt.fold(
        () => Pull.done(),
        ([hd, tl]) =>
          Pull.evalF(f(z, hd)).flatMap(b =>
            Pull.output1<F, B>(b)['>>>'](() => go(b, tl)),
          ),
      ),
    );

  return Pull.output1<F, B>(z)
    ['>>>'](() => go(z, s.pull))
    .stream();
};

export const scanChunks_ = <F, S, A, B>(
  s: Stream<F, A>,
  init: S,
  f: (s: S, c: Chunk<A>) => [S, Chunk<B>],
): Stream<F, B> => scanChunksOpt_(s, init, s => Some(c => f(s, c)));

export const scanChunksOpt_ = <F, S, A, B>(
  s: Stream<F, A>,
  init: S,
  f: (s: S) => Option<(c: Chunk<A>) => [S, Chunk<B>]>,
): Stream<F, B> => s.pull.scanChunksOpt(init, f).void.stream();

export const intersperse_ = <F, A>(
  s: Stream<F, A>,
  separator: A,
): Stream<F, A> => {
  const doChunk = (hd: Chunk<A>, isFirst: boolean): Chunk<A> => {
    const result: A[] = new Array(hd.size * 2 + (isFirst ? 1 : 0));
    const iter = hd.iterator;
    let idx = 0;
    if (isFirst) result[idx++] = iter.next().value!;
    for (let i = iter.next(); !i.done; i = iter.next()) {
      result[idx++] = separator;
      result[idx++] = i.value;
    }
    return Chunk.fromArray(result);
  };

  const loop = (pull: Pull<F, A, void>): Pull<F, A, void> =>
    pull.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.done(),
        ([hd, tl]) =>
          Pull.output<F, A>(doChunk(hd, false))['>>>'](() => loop(tl)),
      ),
    );

  return s.pull.uncons
    .flatMap(opt =>
      opt.fold(
        () => Pull.done<F>(),
        ([hd, tl]) =>
          Pull.output<F, A>(doChunk(hd, true))['>>>'](() => loop(tl)),
      ),
    )
    .stream();
};

export const align_ = <F, A, B>(
  s1: Stream<F, A>,
  s2: Stream<F, B>,
): Stream<F, Ior<A, B>> =>
  zipAllWith_(
    map_(s1, Some),
    map_(s2, Some),
    None,
    None,
  )((oa, ob) => Ior.fromOptions(oa, ob).get);

export const zip_ = <F, A, B>(
  s1: Stream<F, A>,
  s2: Stream<F, B>,
): Stream<F, [A, B]> => zipWith_(s1, s2)((a, b) => [a, b]);

export const zipLeft_ = <F, A, B>(
  s1: Stream<F, A>,
  s2: Stream<F, B>,
): Stream<F, A> => zipWith_(s1, s2)((a, _) => a);

export const zipRight_ = <F, A, B>(
  s1: Stream<F, A>,
  s2: Stream<F, B>,
): Stream<F, B> => zipWith_(s1, s2)((_, b) => b);

export const zipWith_ =
  <F, A, B>(s1: Stream<F, A>, s2: Stream<F, B>) =>
  <C>(f: (a: A, b: B) => C): Stream<F, C> =>
    _zipWith(
      s1,
      s2,
      () => Pull.done(),
      () => Pull.done(),
      () => Pull.done(),
      f,
    );

export const zipAll_ = <F, A, B>(
  s1: Stream<F, A>,
  s2: Stream<F, B>,
  pad1: A,
  pad2: B,
): Stream<F, [A, B]> => zipAllWith_(s1, s2, pad1, pad2)((a, b) => [a, b]);

export const zipAllWith_ =
  <F, A, B>(s1: Stream<F, A>, s2: Stream<F, B>, pad1: A, pad2: B) =>
  <C>(f: (a: A, b: B) => C): Stream<F, C> => {
    const cont1 = (hd: Chunk<A>, tl: Stream<F, A>): Pull<F, C, void> =>
      Pull.output<F, C>(hd.map(o1 => f(o1, pad2)))['>>>'](() => contLeft(tl));

    const cont2 = (hd: Chunk<B>, tl: Stream<F, B>): Pull<F, C, void> =>
      Pull.output<F, C>(hd.map(o2 => f(pad1, o2)))['>>>'](() => contRight(tl));

    const contLeft = (s: Stream<F, A>): Pull<F, C, void> =>
      s.pull.mapOutput(x => f(x, pad2));

    const contRight = (s: Stream<F, B>): Pull<F, C, void> =>
      s.pull.mapOutput(y => f(pad1, y));

    return _zipWith<F, A, B, C>(s1, s2, cont1, cont2, contRight, f);
  };

export const merge_ =
  <F>(F: Concurrent<F, Error>) =>
  <A>(s1: Stream<F, A>, s2: Stream<F, A>): Stream<F, A> => {
    const fStream = F.do(function* (_) {
      const interrupt = yield* _(F.deferred<void>());
      const resultL = yield* _(F.deferred<Either<Error, void>>());
      const resultR = yield* _(F.deferred<Either<Error, void>>());
      const otherSideDone = yield* _(F.ref<boolean>(false));
      const resultChan = yield* _(Channel.unbounded<F, Stream<F, A>>(F));
      const watchInterrupted = (s: Stream<F, A>): Stream<F, A> =>
        interruptWhen_(s, F.attempt(interrupt.get()));

      const doneAndClose: Kind<F, [void]> = F.flatten(
        otherSideDone.modify(done =>
          done ? [true, F.void(resultChan.close)] : [true, F.unit],
        ),
      );

      const signalInterruption: Kind<F, [void]> = interrupt.complete();

      const go = (
        pull: Pull<F, A, void>,
        sem: Semaphore<F>,
      ): Pull<F, A, void> =>
        Pull.evalF(sem.acquire())['>>>'](() =>
          pull.uncons.flatMap(opt =>
            opt.fold(
              () => Pull.done(),
              ([hd, tl]) => {
                const send = resultChan.send(
                  onFinalize_(F)(emitChunk(hd), sem.release()),
                );
                return Pull.evalF(send)['>>>'](() => go(tl, sem));
              },
            ),
          ),
        );

      const runStream = (
        s: Stream<F, A>,
        whenDone: Deferred<F, Either<Error, void>>,
      ): Kind<F, [void]> =>
        F.flatMap_(Semaphore.withPermits(F)(1), sem => {
          const str = watchInterrupted(go(s.pull, sem).stream());
          return F.flatMap_(F.attempt(str.compileConcurrent(F).drain), r =>
            r.fold(
              () => F.productR_(whenDone.complete(r), signalInterruption),
              () => F.productR_(whenDone.complete(r), doneAndClose),
            ),
          );
        });

      const runAtEnd: Kind<F, [void]> = F.do(function* (_) {
        yield* _(signalInterruption);
        const left = yield* _(resultL.get());
        const right = yield* _(resultR.get());
        return yield* _(
          CompositeFailure.fromResults(left, right).fold(
            e => F.throwError<void>(e),
            x => F.pure(x),
          ),
        );
      });

      const runStreams = F.productR_(
        F.fork(runStream(s1, resultL)),
        F.fork(runStream(s2, resultR)),
      );

      return flatMap_(
        bracket(runStreams, () => runAtEnd),
        () => watchInterrupted(flatten(resultChan.stream)),
      );
    });

    return flatten(evalF(fStream));
  };

export const mergeHaltBoth_ =
  <F>(F: Concurrent<F, Error>) =>
  <A>(s1: Stream<F, A>, s2: Stream<F, A>): Stream<F, A> =>
    pipe(merge_(F)(noneTerminate(s1), noneTerminate(s2)), unNoneTerminate);

export const mergeHaltL_ =
  <F>(F: Concurrent<F, Error>) =>
  <A>(s1: Stream<F, A>, s2: Stream<F, A>): Stream<F, A> =>
    pipe(merge_(F)(noneTerminate(s1), map_(s2, Some)), unNoneTerminate);

export const mergeHaltR_ =
  <F>(F: Concurrent<F, Error>) =>
  <A>(s1: Stream<F, A>, s2: Stream<F, A>): Stream<F, A> =>
    mergeHaltL_(F)(s2, s1);

export const parJoin_ =
  <F>(F: Concurrent<F, Error>) =>
  <A>(outer: Stream<F, Stream<F, A>>, maxOpen: number): Stream<F, A> => {
    assert(maxOpen > 0, 'maxOpen has to be >0');
    if (maxOpen === 1) return flatten(outer);

    const fStream = F.do(function* (_) {
      const done = yield* _(SignallingRef(F)(None as Option<Option<Error>>));
      const available = yield* _(Semaphore.withPermits(F)(maxOpen));
      const running = yield* _(SignallingRef(F)(1));
      const outcomes = yield* _(Channel.unbounded<F, Kind<F, [void]>>(F));
      const output = yield* _(Channel.synchronous<F, Chunk<A>>(F));
      const stop = (res: Option<Error>): Kind<F, [void]> =>
        done.update(res0 =>
          res0.fold<Option<Option<Error>>>(
            () => Some(res),
            res1 =>
              res1.fold(
                () => Some(res),
                err0 =>
                  res.fold(
                    () => res0,
                    err => Some(Some(CompositeFailure.from(err0, err))),
                  ),
              ),
          ),
        );

      const incrementRunning: Kind<F, [void]> = running.update(x => x + 1);
      const decrementRunning: Kind<F, [void]> = pipe(
        running.updateAndGet(x => x - 1),
        F.flatMap(now => (now === 0 ? F.void(outcomes.close) : F.unit)),
      );

      const awaitWhileRunning: Kind<F, [void]> = pipe(
        running.discrete(),
        takeWhile(n => n > 0),
        s => compileConcurrent(s, F),
      ).drain;

      const onOutcome = (
        oc: Outcome<F, Error, void>,
        cancelResult: Either<Error, void>,
      ): Kind<F, [void]> =>
        oc.fold(
          () =>
            cancelResult.fold(
              e => stop(Some(e)),
              () => F.unit,
            ),
          e =>
            CompositeFailure.fromResults(Left(e), cancelResult).fold(
              e => stop(Some(e)),
              () => F.unit,
            ),
          fu =>
            cancelResult.fold(
              e => stop(Some(e)),
              () => F.void(outcomes.send(fu)),
            ),
        );

      const runInner = (
        inner: Stream<F, A>,
        outerScope: Scope<F>,
      ): Kind<F, [void]> =>
        F.uncancelable(() =>
          pipe(
            outerScope.lease,
            F.flatTap(() => F.productR_(available.acquire(), incrementRunning)),
            F.flatMap(lease =>
              pipe(
                chunks(inner),
                forEach(s => F.void(output.send(s))),
                interruptWhenTrue(F)(map_(done.discrete(), s => s.nonEmpty)),
                s => compileConcurrent(s, F).drain,
                F.finalize(oc =>
                  pipe(
                    lease.cancel,
                    F.flatMap(r => onOutcome(oc, r)),
                    F.productR(available.release()),
                    F.productR(decrementRunning),
                  ),
                ),
                F.handleError(() => {}),
                F.fork,
              ),
            ),
            F.void,
          ),
        );

      const runOuter: Kind<F, [void]> = F.uncancelable(() =>
        pipe(
          outer,
          flatMap(
            inner =>
              new Stream(
                Pull.getScope<F>().flatMap(outerScope =>
                  Pull.evalF(runInner(inner, outerScope)),
                ),
              ),
          ),
          drain,
          interruptWhenTrue(F)(map_(done.discrete(), s => s.nonEmpty)),
          s => compileConcurrent(s, F).drain,
          F.finalize(oc =>
            F.productR_(onOutcome(oc, Either.rightUnit), decrementRunning),
          ),
          F.handleError(() => {}),
        ),
      );

      const outerJoiner: Kind<F, [void]> = pipe(
        outcomes.stream,
        evalMap(id),
        s => compileConcurrent(s, F).drain,
        F.finalize(oc =>
          oc.fold(
            () => F.productR_(stop(None), F.void(output.close)),
            e => F.productR_(stop(Some(e)), F.void(output.close)),
            () => F.productR_(stop(None), F.void(output.close)),
          ),
        ),
        F.handleError(() => {}),
      );

      const signalResult = (fiber: Fiber<F, Error, void>): Kind<F, [void]> =>
        pipe(
          done.get(),
          F.flatMap(res =>
            res
              .flatten()
              .fold<Kind<F, [void]>>(
                () => fiber.joinWithNever(F),
                F.throwError,
              ),
          ),
        );

      return pipe(
        bracket(F.productR_(F.fork(runOuter), F.fork(outerJoiner)), fiber =>
          pipe(
            stop(None),
            F.productR(awaitWhileRunning),
            F.productR(signalResult(fiber)),
          ),
        ),
        flatMap(() => flatMap_(output.stream, c => emitChunk<F, A>(c))),
      );
    });

    return flatten(evalF(fStream));
  };

export const repeatPull_ = <F, A, B>(
  s: Stream<F, A>,
  f: (p: Pull<F, A, void>) => Pull<F, B, Option<Pull<F, A, void>>>,
): Stream<F, B> => Pull.loop(f)(s.pull).stream();

export const delayBy_ =
  <F>(F: Temporal<F, Error>) =>
  <A>(s: Stream<F, A>, ms: number): Stream<F, A> =>
    concat_(drain(sleep(F)(ms)), s);

export const spaced_ =
  <F>(F: Temporal<F, Error>) =>
  <A>(s: Stream<F, A>, period: number): Stream<F, A> =>
    zipRight_(fixedDelay(F)(period), s);

export const interruptOnSignal_ =
  <F>(F: Concurrent<F, Error>) =>
  <A>(s: Stream<F, A>, haltOnSignal: Signal<F, boolean>): Stream<F, A> =>
    interruptWhenTrue_(F)(s, haltOnSignal.discrete());

export const interruptWhenTrue_ =
  <F>(F: Concurrent<F, Error>) =>
  <A>(s: Stream<F, A>, haltWhenTrue: Stream<F, boolean>): Stream<F, A> =>
    force(
      F.do(function* (_) {
        const interruptL = yield* _(F.deferred<void>());
        const interruptR = yield* _(F.deferred<void>());
        const backResult = yield* _(F.deferred<Either<Error, void>>());
        const watch = pipe(
          haltWhenTrue,
          filter(id),
          take(1),
          interruptWhen(F.attempt(interruptR.get())),
          s => compileConcurrent(s, F).drain,
        );

        const wakeWatch = F.finalize_(watch, oc => {
          const r = oc.fold(
            () => Either.rightUnit,
            e => Left(e),
            () => Either.rightUnit,
          );
          return F.productR_(backResult.complete(r), interruptL.complete());
        });

        const stopWatch = F.productR_(
          interruptR.complete(),
          F.flatMap_(backResult.get(), ea =>
            ea.fold(
              e => F.throwError<void>(e),
              x => F.pure(x),
            ),
          ),
        );
        const backWatch = bracket(
          F.fork(F.attempt(wakeWatch)),
          () => stopWatch,
        );

        return flatMap_(backWatch, () =>
          interruptWhen_(s, F.attempt(interruptL.get())),
        );
      }),
    );

export const onFinalize_ =
  <F>(F: Applicative<F>) =>
  <A>(s: Stream<F, A>, fin: Kind<F, [void]>): Stream<F, A> =>
    flatMap_(
      bracket(F.unit, () => fin),
      () => s,
    );

export const interruptWhen_ = <F, A>(
  s: Stream<F, A>,
  haltOnSignal: Kind<F, [Either<Error, void>]>,
): Stream<F, A> =>
  pipe(
    Pull.interruptWhen(haltOnSignal)
      ['>>>'](() => s.pull)
      .stream(),
    interruptScope,
  );

export const concurrently_ =
  <F>(F: Concurrent<F, Error>) =>
  <A, B>(s1: Stream<F, A>, s2: Stream<F, B>): Stream<F, A> => {
    const fStream = F.do(function* (_) {
      const interrupt = yield* _(F.deferred<void>());
      const backResult = yield* _(F.deferred<Either<Error, void>>());
      const watch = <X>(str: Stream<F, X>) =>
        interruptWhen_(str, F.attempt(interrupt.get()));

      const compileBack: Kind<F, [void]> = pipe(
        watch(s2),
        s_ => compileConcurrent(s_, F).drain,
        F.finalize(oc =>
          oc.fold(
            () => backResult.complete(Either.rightUnit),
            e =>
              F.productR_(backResult.complete(Left(e)), interrupt.complete()),
            () => backResult.complete(Either.rightUnit),
          ),
        ),
      );

      const stopBack: Kind<F, [void]> = F.productR_(
        interrupt.complete(),
        F.flatMap_<Either<Error, void>, void>(backResult.get(), ea =>
          ea.fold(F.throwError, F.pure),
        ),
      );

      return flatMap_(
        bracket(F.fork(F.attempt(compileBack)), () => stopBack),
        () => watch(s1),
      );
    });

    return flatten(evalF(fStream));
  };

export const enqueueNoneTerminated_ = <F, A>(
  s: Stream<F, A>,
  q: QueueSink<F, Option<A>>,
): Stream<F, never> => forEach_(noneTerminate(s), x => q.offer(x));

export const enqueueNoneTerminatedChunks_ = <F, A>(
  s: Stream<F, A>,
  q: QueueSink<F, Option<Chunk<A>>>,
): Stream<F, never> => forEach_(noneTerminate(chunks(s)), x => q.offer(x));

export const mapK_ = <F, G, A>(
  s: Stream<F, A>,
  nt: FunctionK<F, G>,
): Stream<G, A> => s.pull.translate(nt).stream();

// -- Private implementation

export const _scan = <F, A, B>(
  p: Pull<F, A, void>,
  z: B,
  f: (b: B, a: A) => B,
): Pull<F, B, void> =>
  p.uncons.flatMap(opt =>
    opt.fold(
      () => Pull.done(),
      ([hd, tl]) => {
        const [out, carry] = hd.scanLeftCarry(z, f);
        return Pull.output<F, B>(out)['>>>'](() => _scan(tl, carry, f));
      },
    ),
  );

const _zipWith = <F, A, B, C>(
  s1: Stream<F, A>,
  s2: Stream<F, B>,
  k1: (c: Chunk<A>, s: Stream<F, A>) => Pull<F, C, void>,
  k2: (c: Chunk<B>, s: Stream<F, B>) => Pull<F, C, void>,
  k3: (s: Stream<F, B>) => Pull<F, C, void>,
  f: (a: A, b: B) => C,
): Stream<F, C> => {
  const go = (
    [l1h, l1t]: [Chunk<A>, Pull<F, A, void>],
    [l2h, l2t]: [Chunk<B>, Pull<F, B, void>],
  ): Pull<F, C, void> => {
    const out = l1h.zipWith(l2h, f);
    return Pull.output<F, C>(out)['>>>'](() => {
      if (l1h.size > l2h.size) {
        const extra1 = l1h.drop(l2h.size);
        return l2t.uncons.flatMap(opt =>
          opt.fold(
            () => k1(extra1, new Stream(l1t)),
            tl2 => go([extra1, l1t], tl2),
          ),
        );
      } else {
        const extra2 = l2h.drop(l1h.size);
        return l1t.uncons.flatMap(opt =>
          opt.fold(
            () => k2(extra2, new Stream(l2t)),
            tl1 => go(tl1, [extra2, l2t]),
          ),
        );
      }
    });
  };

  return new Stream(
    s1.pull.uncons.flatMap(opt1 =>
      opt1.fold(
        () => k3(s2),
        leg1 =>
          s2.pull.uncons.flatMap(opt2 =>
            opt2.fold(
              () => k1(leg1[0], new Stream(leg1[1])),
              leg2 => go(leg1, leg2),
            ),
          ),
      ),
    ),
  );
};
