import { AnyK, id, Kind, pipe } from '@cats4ts/core';
import { MonadError, Monoid, MonoidK } from '@cats4ts/cats-core';
import {
  Either,
  Left,
  None,
  Option,
  Right,
  Some,
} from '@cats4ts/cats-core/lib/data';
import { SyncIoK } from '@cats4ts/effect-core';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Stream } from './algebra';
import { Compiler, PureCompiler } from './compiler';
import { fromChunk, pure, suspend } from './constructor';

export const head: <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  take_(s, 1);

export const headOption: <F extends AnyK, A>(
  s: Stream<F, A>,
) => Stream<F, Option<A>> = s =>
  new Stream(
    s.pull.uncons1.flatMap(opt => Pull.output1(opt.map(([hd]) => hd))),
  );

export const tail: <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  drop_(s, 1);

export const last: <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  new Stream(s.pull.last.flatMap(Pull.outputOption1));

export const lastOption: <F extends AnyK, A>(
  s: Stream<F, A>,
) => Stream<F, Option<A>> = s => new Stream(s.pull.last.flatMap(Pull.output1));

export const init: <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  dropRight_(s, 1);

export const repeat: <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  s['+++'](suspend(() => repeat(s)));

export const cons: <F extends AnyK, A>(x: A, s: Stream<F, A>) => Stream<F, A> =
  (x, s) => prepend_(s, x);

export const consChunk: <F extends AnyK, A>(
  c: Chunk<A>,
  s: Stream<F, A>,
) => Stream<F, A> = (c, s) => prependChunk_(s, c);

export const prepend: <A2>(
  x: A2,
) => <F extends AnyK, A extends A2>(s: Stream<F, A>) => Stream<F, A2> =
  x => s =>
    prepend_(s, x);

export const prependChunk: <A2>(
  c: Chunk<A2>,
) => <F extends AnyK, A extends A2>(s: Stream<F, A>) => Stream<F, A2> =
  c => s =>
    prependChunk_(s, c);

export const take: (
  n: number,
) => <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = n => s =>
  take_(s, n);

export const takeRight: (
  n: number,
) => <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = n => s =>
  takeRight_(s, n);

export const takeWhile: <A>(
  pred: (a: A) => boolean,
  takeFailure?: boolean,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, A> =
  (pred, takeFailure) => s =>
    takeWhile_(s, pred, takeFailure);

export const drop: (
  n: number,
) => <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = n => s =>
  drop_(s, n);

export const dropRight: (
  n: number,
) => <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = n => s =>
  dropRight_(s, n);

export const dropWhile: <A>(
  pred: (a: A) => boolean,
  dropFailure?: boolean,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, A> =
  (pred, dropFailure = false) =>
  s =>
    dropWhile_(s, pred, dropFailure);

export const concat: <F extends AnyK, A2>(
  s2: Stream<F, A2>,
) => <A extends A2>(s1: Stream<F, A>) => Stream<F, A2> = s2 => s1 =>
  concat_(s1, s2);

export const attempt = <F extends AnyK, A>(
  s: Stream<F, A>,
): Stream<F, Either<Error, A>> =>
  pipe(
    s,
    map(x => Right(x) as Either<Error, A>),
    handleErrorWith(e => pure(Left(e) as Either<Error, A>)),
  );

export const handleErrorWith: <F extends AnyK, A2>(
  h: (e: Error) => Stream<F, A2>,
) => <A extends A2>(s: Stream<F, A>) => Stream<F, A2> = h => s =>
  handleErrorWith_(s, h);

export const chunks: <F extends AnyK, A>(
  s: Stream<F, A>,
) => Stream<F, Chunk<A>> = s =>
  repeatPull_(s, p =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.pure(None),
        ([hd, tl]) => Pull.output1(hd).map(() => Some(tl)),
      ),
    ),
  );

export const chunkAll = <F extends AnyK, A>(
  s: Stream<F, A>,
): Stream<F, Chunk<A>> => {
  const loop = (p: Pull<F, A, void>, acc: Chunk<A>): Pull<F, Chunk<A>, void> =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.output1(acc),
        ([hd, tl]) => loop(tl, acc['+++'](hd)),
      ),
    );
  return new Stream(loop(s.pull, Chunk.empty));
};

export const filter: <A>(
  pred: (a: A) => boolean,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, A> = pred => s =>
  filter_(s, pred);

export const filterNot: <A>(
  pred: (a: A) => boolean,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, A> = pred => s =>
  filterNot_(s, pred);

export const collect: <A, B>(
  f: (a: A) => Option<B>,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, B> = f => s =>
  collect_(s, f);

export const collectFirst: <A, B>(
  f: (a: A) => Option<B>,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, B> = f => s =>
  collectFirst_(s, f);

export const collectWhile: <A, B>(
  f: (a: A) => Option<B>,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, B> = f => s =>
  collectWhile_(s, f);

export const map: <A, B>(
  f: (a: A) => B,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, B> = f => s => map_(s, f);

export const flatMap: <F extends AnyK, A, B>(
  f: (a: A) => Stream<F, B>,
) => (s: Stream<F, A>) => Stream<F, B> = f => s => flatMap_(s, f);

export const flatten: <F extends AnyK, A>(
  ss: Stream<F, Stream<F, A>>,
) => Stream<F, A> = ss => flatMap_(ss, id);

export const fold: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, B> = (z, f) => s =>
  fold_(s, z, f);

export const foldMap: <M>(
  M: Monoid<M>,
) => <F extends AnyK, A>(f: (a: A) => M) => (s: Stream<F, A>) => Stream<F, M> =
  M => f => s =>
    foldMap_(M)(s, f);

export const foldMapK: <G extends AnyK>(
  G: MonoidK<G>,
) => <A, B>(
  f: (a: A) => Kind<G, [B]>,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, Kind<G, [B]>> =
  G => f => s =>
    foldMapK_(G)(s, f);

export const zip: <F extends AnyK, B>(
  s2: Stream<F, B>,
) => <A>(s1: Stream<F, A>) => Stream<F, [A, B]> = s2 => s1 => zip_(s1, s2);

export const zipWith: <F extends AnyK, A, B, C>(
  s2: Stream<F, B>,
  f: (a: A, b: B) => C,
) => (s1: Stream<F, A>) => Stream<F, C> = (s2, f) => s1 => zipWith_(s1, s2)(f);

export const compile: <A>(s: Stream<SyncIoK, A>) => PureCompiler<A> = s =>
  new PureCompiler(s.pull);

export const compileF: <F extends AnyK>(
  F: MonadError<F, Error>,
) => <A>(s: Stream<F, A>) => Compiler<F, A> = F => s => new Compiler(F, s.pull);

// -- Point-ful operators

export const prepend_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  c: A,
): Stream<F, A> => concat_(pure(c), s);

export const prependChunk_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  c: Chunk<A>,
): Stream<F, A> => concat_(fromChunk(c), s);

export const take_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  n: number,
): Stream<F, A> => new Stream(s.pull.take(n).void);

export const takeRight_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  n: number,
): Stream<F, A> => new Stream(s.pull.takeRight(n).flatMap(Pull.output));

export const takeWhile_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  p: (a: A) => boolean,
  takeFailure: boolean = false,
): Stream<F, A> => new Stream(s.pull.takeWhile(p, takeFailure).void);

export const drop_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  n: number,
): Stream<F, A> =>
  new Stream(
    s.pull.drop(n).flatMap(opt => opt.map(id).getOrElse(() => Pull.done())),
  );

export const dropRight_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  n: number,
): Stream<F, A> => {
  const go = (p: Pull<F, A, void>, acc: Chunk<A>): Pull<F, A, void> =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.done(),
        ([hd, tl]) => {
          const all = acc['+++'](hd);
          return Pull.output(all.dropRight(n))['>>>'](() =>
            go(tl, all.takeRight(n)),
          );
        },
      ),
    );

  return n <= 0 ? s : new Stream(go(s.pull, Chunk.empty));
};

export const dropWhile_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  pred: (a: A) => boolean,
  dropFailure: boolean = false,
): Stream<F, A> =>
  new Stream(
    s.pull
      .dropWhile(pred, dropFailure)
      .flatMap(opt => opt.fold(() => Pull.done(), id)),
  );

export const concat_ = <F extends AnyK, A>(
  s1: Stream<F, A>,
  s2: Stream<F, A>,
): Stream<F, A> => new Stream(s1.pull.flatMap(() => s2.pull));

export const handleErrorWith_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  h: (e: Error) => Stream<F, A>,
): Stream<F, A> => new Stream(s.pull.handleErrorWith(e => h(e).pull));

export const filter_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  pred: (a: A) => boolean,
): Stream<F, A> => mapChunks_(s, chunk => chunk.filter(pred));

export const filterNot_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  pred: (a: A) => boolean,
): Stream<F, A> => filter_(s, x => !pred(x));

export const collect_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Option<B>,
): Stream<F, B> => mapChunks_(s, c => c.collect(f));

export const collectFirst_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Option<B>,
): Stream<F, B> =>
  new Stream(
    s.pull
      .mapOutput(f)
      .find(x => x.nonEmpty)
      .flatMap(opt =>
        opt.fold(
          () => Pull.done(),
          ([hd]) => Pull.output1(hd.get),
        ),
      ),
  );

export const collectWhile_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Option<B>,
): Stream<F, B> =>
  new Stream(s.pull.mapOutput(f).takeWhile(o => o.nonEmpty).void).map(
    o => o.get,
  );

export const mapChunks_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (c: Chunk<A>) => Chunk<B>,
): Stream<F, B> =>
  repeatPull_(s, p =>
    p.uncons.flatMap(opt =>
      opt.fold(
        () => Pull.pure(None),
        ([hd, tl]) => Pull.output(f(hd)).map(() => Some(tl)),
      ),
    ),
  );

export const map_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => B,
): Stream<F, B> => new Stream(s.pull.mapOutput(f));

export const flatMap_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Stream<F, B>,
): Stream<F, B> => new Stream(s.pull.flatMapOutput(o => f(o).pull));

export const fold_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  z: B,
  f: (b: B, a: A) => B,
): Stream<F, B> => new Stream(s.pull.fold(z, f).flatMap(Pull.output1));

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <F extends AnyK, A>(s: Stream<F, A>, f: (a: A) => M): Stream<F, M> =>
    fold_(s, M.empty, (m, a) => M.combine_(m, f(a)));

export const foldMapK_ =
  <G extends AnyK>(G: MonoidK<G>) =>
  <F extends AnyK, A, B>(
    s: Stream<F, A>,
    f: (a: A) => Kind<G, [B]>,
  ): Stream<F, Kind<G, [B]>> =>
    fold_(s, G.emptyK(), (m, a) => G.combineK_(m, f(a)));

export const zip_ = <F extends AnyK, A, B>(
  s1: Stream<F, A>,
  s2: Stream<F, B>,
): Stream<F, [A, B]> => zipWith_(s1, s2)((a, b) => [a, b]);

export const zipWith_ =
  <F extends AnyK, A, B>(s1: Stream<F, A>, s2: Stream<F, B>) =>
  <C>(f: (a: A, b: B) => C): Stream<F, C> =>
    _zipWith(
      s1,
      s2,
      () => Pull.done(),
      () => Pull.done(),
      () => Pull.done(),
      f,
    );

export const repeatPull_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (p: Pull<F, A, void>) => Pull<F, B, Option<Pull<F, A, void>>>,
): Stream<F, B> => new Stream(Pull.loop(f)(s.pull));

const _zipWith = <F extends AnyK, A, B, C>(
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
    return Pull.output(out)['>>>'](() => {
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
