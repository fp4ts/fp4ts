import { AnyK, id, Kind } from '@cats4ts/core';
import { MonadError } from '@cats4ts/cats-core';
import { SyncIoK } from '@cats4ts/effect-core';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Stream } from './algebra';
import { Compiler, PureCompiler } from './compiler';
import { fromChunk, pure, suspend } from './constructor';

export const head: <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  take_(s, 1);

export const tail: <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = s =>
  drop_(s, 1);

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

export const drop: (
  n: number,
) => <F extends AnyK, A>(s: Stream<F, A>) => Stream<F, A> = n => s =>
  drop_(s, n);

export const concat: <F extends AnyK, A2>(
  s2: Stream<F, A2>,
) => <A extends A2>(s1: Stream<F, A>) => Stream<F, A2> = s2 => s1 =>
  concat_(s1, s2);

export const map: <A, B>(
  f: (a: A) => B,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, B> = f => s => map_(s, f);

export const flatMap: <F extends AnyK, A, B>(
  f: (a: A) => Stream<F, B>,
) => (s: Stream<F, A>) => Stream<F, B> = f => s => flatMap_(s, f);

export const flatten: <F extends AnyK, A>(
  ss: Stream<F, Stream<F, A>>,
) => Stream<F, A> = ss => flatMap_(ss, id);

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

export const drop_ = <F extends AnyK, A>(
  s: Stream<F, A>,
  n: number,
): Stream<F, A> =>
  new Stream(
    s.pull.drop(n).flatMap(opt => opt.map(id).getOrElse(() => Pull.done())),
  );

export const concat_ = <F extends AnyK, A>(
  s1: Stream<F, A>,
  s2: Stream<F, A>,
): Stream<F, A> => new Stream(s1.pull.flatMap(() => s2.pull));

export const map_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => B,
): Stream<F, B> => new Stream(s.pull.mapOutput(f));

export const flatMap_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Stream<F, B>,
): Stream<F, B> => new Stream(s.pull.flatMapOutput(o => f(o).pull));

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
