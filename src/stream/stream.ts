import { ok as assert } from 'assert';
import { id, pipe } from '../fp/core';
import * as E from '../fp/either';
import * as IO from '../effect/io';
import * as P from './pull';

type Stream<A> = P.Pull<A, void>;

// -- Constructors

export const of: <A>(...as: A[]) => Stream<A> = (...xs) => emit(xs);

export const emit: <A>(as: A[]) => Stream<A> = P.output;

export const empty: Stream<never> = P.done;

export const pure: <A>(A: A) => Stream<A> = x => P.output([x]);

export const range: ((until: number) => Stream<number>) &
  ((from: number, to: number) => Stream<number>) = (
  from: number,
  to?: number,
): Stream<number> => {
  const upper = to ?? from;
  const lower = to != null ? from : 0;
  const result: number[] = [];
  for (let i = lower; i < upper; i++) result.push(i);
  return P.output(result);
};

export const rangeFrom = (x: number = 0): Stream<number> =>
  concat_(pure(x), () => rangeFrom(x + 1));

export const integers: () => Stream<number> = () => rangeFrom(1);

export const fromIO = <A>(t: IO.IO<A>): Stream<A> =>
  pipe(P.fromIO(t), P.flatMap(P.output1));

export const repeat = <A>(fa: Stream<A>): Stream<A> => concat_(fa, () => fa);

export const suspend = <A>(thunk: () => Stream<A>): Stream<A> =>
  P.defer(IO.delay(thunk));

export const cons = <A>(as: A[], fa: Stream<A>): Stream<A> =>
  P.cons(
    as,
    IO.delay(() => fa),
  );

export const unfold = <S, A>(
  x: S,
  f: (a: S) => [S, A] | undefined,
): Stream<A> => {
  const go = (x: S): Stream<A> => {
    const next = f(x);
    return next ? concat_(pure(next[1]), () => go(next[0])) : empty;
  };
  return go(x);
};

export const retry: (
  delay: number,
  nextDelay: (ms: number) => number,
  maxAttempts: number,
  retriable?: (e: Error) => boolean, //= () => true,
) => <A>(ioa: IO.IO<A>) => Stream<A> =
  (delay, nextDelay, maxAttempts, retriable = () => true) =>
  ioa =>
    retry_(ioa, delay, nextDelay, maxAttempts, retriable);

export const retry_ = <A>(
  ioa: IO.IO<A>,
  delay: number,
  nextDelay: (ms: number) => number,
  maxAttempts: number,
  retriable: (e: Error) => boolean = () => true,
): Stream<A> => {
  assert(maxAttempts > 0, 'Max attempts must be greater than zero');

  const delays: Stream<number> = unfold(delay, d => [d, nextDelay(d)]);

  return pipe(
    fromIO(ioa),
    attempts(delays),
    take(maxAttempts),
    takeThrough(E.fold(retriable, () => false)),
    last,
    map(x => {
      console.log('LAST', x);
      return x!;
    }),
    rethrow,
  );
};

// -- Operators

export const head: <A>(fa: Stream<A>) => Stream<A> = fa => take_(fa, 1);
export const tail: <A>(fa: Stream<A>) => Stream<A> = fa => drop_(fa, 1);

export const take: (n: number) => <A>(fa: Stream<A>) => Stream<A> = P.take;
export const drop: (n: number) => <A>(fa: Stream<A>) => Stream<A> = P.drop;
export const slice: (
  from: number,
  to: number,
) => <A>(fa: Stream<A>) => Stream<A> = (from, to) => fa => slice_(fa, from, to);

export const takeThrough: <A>(
  p: (a: A) => boolean,
) => (fa: Stream<A>) => Stream<A> = p => fa => takeThrough_(fa, p);

export const takeWhile: <A>(
  p: (a: A) => boolean,
) => (fa: Stream<A>) => Stream<A> = p => fa => takeWhile_(fa, p);

export const last: <A>(fa: Stream<A>) => Stream<A | undefined> = fa =>
  pipe(fa, P.last, P.flatMap(P.output1));

export const concat: <A>(fb: () => Stream<A>) => (fa: Stream<A>) => Stream<A> =
  P.append;

export const tap: <A>(f: (a: A) => unknown) => (fa: Stream<A>) => Stream<A> =
  f => fa =>
    tap_(fa, f);

export const filter: <A>(p: (a: A) => boolean) => (fa: Stream<A>) => Stream<A> =
  P.filterOutput;

export const map: <A, B>(f: (a: A) => B) => (fa: Stream<A>) => Stream<B> =
  P.mapOutput;

export const flatMap: <A, B>(
  f: (a: A) => Stream<B>,
) => (fa: Stream<A>) => Stream<B> = P.flatMapOutput;

export const flatten: <A>(ffa: Stream<Stream<A>>) => Stream<A> = flatMap(id);

export const evalMap: <A, B>(
  f: (a: A) => IO.IO<B>,
) => (fa: Stream<A>) => Stream<B> = f => fa => evalMap_(fa, f);

export const handleErrorWith: <A>(
  h: (e: Error) => Stream<A>,
) => (fa: Stream<A>) => Stream<A> = P.handleErrorWith;

export const delayBy: (ms: number) => <A>(fa: Stream<A>) => Stream<A> =
  P.delayBy;

export const attempt = <A>(fa: Stream<A>): Stream<E.Either<Error, A>> =>
  pipe(
    fa,
    map(E.right),
    handleErrorWith<E.Either<Error, A>>(e => pure(E.left(e))),
  );

export const attempts: (
  delays: Stream<number>,
) => <A>(fa: Stream<A>) => Stream<E.Either<Error, A>> = delays => fa =>
  attempts_(fa, delays);

export const rethrow = <A>(fa: Stream<E.Either<Error, A>>): Stream<A> =>
  pipe(
    fa,
    chunks,
    flatMap(chunk => {
      const failure = collectArrayFirst(
        chunk,
        E.fold(id, () => undefined),
      );

      return failure
        ? P.throwError(failure)
        : P.output(
            collectArray(
              chunk,
              E.fold(() => undefined, id),
            ),
          );
    }),
  );

/// Converts stream into stream of its chunks
export const chunks = <A>(fa: Stream<A>): Stream<A[]> =>
  pipe(
    P.uncons(fa),
    P.flatMap(x => (!x ? P.done : cons([x[0]], chunks(x[1])))),
  );

/// Collects all outputs into a single chunk which get emitted
export const chunkAll = <A>(fa: Stream<A>): Stream<A[]> => {
  const loop = (acc: A[], next: Stream<A>): Stream<A[]> =>
    pipe(
      P.uncons(next),
      P.flatMap(x => (!x ? pure(acc) : loop(acc.concat(x[0]), x[1]))),
    );
  return loop([], fa);
};

export const chunkN: (
  n: number,
  allowFewer?: boolean,
) => <A>(fa: Stream<A>) => Stream<A[]> =
  (n, allowFewer = true) =>
  fa =>
    chunkN_(fa, n, allowFewer);

export const unchunks: <A>(fa: Stream<A[]>) => Stream<A> = flatMap(emit);

export const zip: <B>(
  fb: () => Stream<B>,
) => <A>(fa: Stream<A>) => Stream<[A, B]> = fb => fa => zip_(fa, fb());

export const zipWithIndex: <A>(fa: Stream<A>) => Stream<[A, number]> = zip(() =>
  rangeFrom(0),
);

export const zipWithPrev = <A>(fa: Stream<A>): Stream<[A | undefined, A]> =>
  pipe(
    cons([undefined] as [A | undefined], fa),
    zip(() => fa),
  );

export const zipWith: <A, B, C>(
  fb: Stream<B>,
  combine: (a: A, b: B) => C,
) => (fa: Stream<A>) => Stream<C> = (fb, combine) => fa =>
  zipWith_(fa, fb, combine);

export const fold: <A, B>(
  init: B,
  combine: (b: B, a: A) => B,
) => (fa: Stream<A>) => Stream<B> = (init, combine) => fa =>
  fold_(fa, combine, init);

export const scan: <A, B>(
  init: B,
  combine: (b: B, a: A) => B,
) => (fa: Stream<A>) => Stream<B> = (init, combine) => fa =>
  scan_(fa, combine, init);

export const scan1: <A>(
  combine: (l: A, r: A) => A,
) => (fa: Stream<A>) => Stream<A> = combine => fa => scan1_(fa, combine);

export const compile: <A, B>(
  init: B,
  combine: (b: B, a: A) => B,
) => (fa: Stream<A>) => IO.IO<B> = P.compile;

export const drain: <A>(fa: Stream<A>) => IO.IO<void> = compile(
  undefined,
  () => undefined,
);

export const toArray = <A>(fa: Stream<A>): IO.IO<A[]> =>
  pipe(
    chunks(fa),
    compile([], (xs: A[], ys) => xs.concat(ys)),
  );

// -- Pointful functions

export const take_: <A>(fa: Stream<A>, n: number) => Stream<A> = P.take_;
export const drop_: <A>(fa: Stream<A>, n: number) => Stream<A> = P.drop_;
export const slice_: <A>(fa: Stream<A>, from: number, to: number) => Stream<A> =
  (fa, from, to) => pipe(fa, drop(from), take(to - from));

export const takeThrough_ = <A>(
  fa: Stream<A>,
  p: (a: A) => boolean,
): Stream<A> =>
  pipe(
    P.uncons(fa),
    P.flatMap(x => {
      if (!x) return P.done;
      const [hd, tl] = x;
      const ys = takeArrayWhile(hd, p);

      return ys.length < hd.length
        ? emit([...ys, hd[ys.length]])
        : cons([...ys, hd[ys.length]], takeThrough_(tl, p));
    }),
  );

export const takeWhile_ = <A>(fa: Stream<A>, p: (a: A) => boolean): Stream<A> =>
  pipe(
    P.uncons(fa),
    P.flatMap(x => {
      if (!x) return P.done;
      const [hd, tl] = x;
      const ys = takeArrayWhile(hd, p);

      return ys.length < hd.length ? emit(ys) : cons(ys, takeWhile_(tl, p));
    }),
  );

export const concat_: <A>(fa: Stream<A>, fb: () => Stream<A>) => Stream<A> =
  P.append_;

export const tap_ = <A>(fa: Stream<A>, f: (a: A) => unknown): Stream<A> =>
  map_(fa, (x: A) => {
    f(x);
    return x;
  });

export const filter_: <A>(fa: Stream<A>, p: (a: A) => boolean) => Stream<A> =
  P.filterOutput_;

export const map_: <A, B>(fa: Stream<A>, f: (a: A) => B) => Stream<B> =
  P.mapOutput_;

export const flatMap_: <A, B>(
  fa: Stream<A>,
  f: (a: A) => Stream<B>,
) => Stream<B> = P.flatMapOutput_;

export const handleErrorWith_: <A>(
  fa: Stream<A>,
  h: (e: Error) => Stream<A>,
) => Stream<A> = P.handleErrorWith_;

export const evalMap_ = <A, B>(
  fa: Stream<A>,
  f: (a: A) => IO.IO<B>,
): Stream<B> => flatMap_(fa, x => pipe(P.fromIO(f(x)), P.flatMap(P.output1)));

export const delayBy_: <A>(fa: Stream<A>, ms: number) => Stream<A> = P.delayBy_;

export const attempts_ = <A>(
  fa: Stream<A>,
  delays: Stream<number>,
): Stream<E.Either<Error, A>> =>
  pipe(
    attempt(fa),
    concat(() =>
      pipe(
        delays,
        flatMap(delay => delayBy_(attempt(fa), delay)),
      ),
    ),
  );

export const chunkN_ = <A>(
  fa: Stream<A>,
  n: number,
  allowFewer: boolean = true,
): Stream<A[]> =>
  pipe(
    P.unconsN_(fa, n, allowFewer),
    P.flatMap(x => (!x ? P.done : cons([x[0]], chunkN_(x[1], n, allowFewer)))),
  );

export const zip_ = <A, B>(fa: Stream<A>, fb: Stream<B>): Stream<[A, B]> =>
  zipWith_(fa, fb, (x, y) => [x, y]);

export const zipWith_ = <A, B, C>(
  fa: Stream<A>,
  fb: Stream<B>,
  combine: (a: A, b: B) => C,
): Stream<C> =>
  pipe(
    P.uncons(fa),
    P.flatMap(x =>
      !x
        ? empty
        : pipe(
            P.uncons(fb),
            P.flatMap(y =>
              !y ? empty : pure([x, y] as [[A[], Stream<A>], [B[], Stream<B>]]),
            ),
          ),
    ),
    flatMap(([[xhd, xtl], [yhd, ytl]]) => {
      if (xhd.length < yhd.length)
        return cons(
          zipArrayWith(xhd, yhd.slice(0, xhd.length), combine),
          zipWith_(xtl, cons(yhd.slice(xhd.length), ytl), combine),
        );
      if (xhd.length > yhd.length)
        return cons(
          zipArrayWith(xhd.slice(0, yhd.length), yhd, combine),
          zipWith_(cons(xhd.slice(yhd.length), xtl), ytl, combine),
        );
      return cons(zipArrayWith(xhd, yhd, combine), zipWith_(xtl, ytl, combine));
    }),
  );

export const fold_ = <A, B>(
  fa: Stream<A>,
  combine: (b: B, a: A) => B,
  init: B,
): Stream<B> =>
  pipe(
    P.uncons(fa),
    P.flatMap(x =>
      !x ? pure(init) : fold_(x[1], combine, x[0].reduce(combine, init)),
    ),
  );

export const scan_ = <A, B>(
  fa: Stream<A>,
  combine: (b: B, a: A) => B,
  init: B,
): Stream<B> =>
  pipe(
    P.uncons(fa),
    P.flatMap(x => {
      if (!x) return pure(init);
      const head = scanArray(x[0], combine, init).slice(1);
      return cons(head, scan_(x[1], combine, head[head.length - 1]));
    }),
  );

export const scan1_ = <A>(
  fa: Stream<A>,
  combine: (l: A, r: A) => A,
): Stream<A> =>
  pipe(
    P.uncons(fa),
    P.flatMap(x =>
      !x ? P.done : pipe(cons(x[0].slice(1), x[1]), scan(x[0][0], combine)),
    ),
  );

// export const parJoin_ = <A>(fa: Stream<A>, maxOpen: number): Stream<A> => {
//   assert(maxOpen > 0, 'maxOpen must be > 0');

// };

export const compile_: <A, B>(
  fa: Stream<A>,
  combine: (b: B, a: A) => B,
  init: B,
) => IO.IO<B> = P.compile_;

const scanArray = <A, B>(xs: A[], combine: (b: B, a: A) => B, z: B): B[] =>
  xs.reduce((zs, x) => [...zs, combine(zs[zs.length - 1], x)], [z]);

const zipArrayWith = <A, B, C>(xs: A[], ys: B[], f: (a: A, b: B) => C): C[] =>
  xs.reduce((zs, x, idx) => [...zs, f(x, ys[idx])], [] as C[]);

const takeArrayWhile = <A>(xs: A[], p: (a: A) => boolean): A[] => {
  const ys: A[] = [];
  for (let i = 0; i < xs.length; i++) {
    if (!p(xs[i])) return ys;
    ys.push(xs[i]);
  }
  return ys;
};

export const collectArray = <A, B>(
  xs: A[],
  pf: (a: A) => B | undefined,
): B[] => {
  const results: B[] = [];
  for (const x of xs) {
    const result = pf(x);
    if (result) results.push(result);
  }
  return results;
};

export const collectArrayFirst = <A, B>(
  xs: A[],
  pf: (a: A) => B | undefined,
): B | undefined => {
  for (let i = 0; i < xs.length; i++) {
    const result = pf(xs[i]);
    if (result) return result;
  }
  return undefined;
};
