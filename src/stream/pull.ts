import { pipe } from '../fp/core';
import * as IO from '../effect/io';

type Terminal<R> = Succeed<R> | Fail;
export type Pull<O, R> = Cons<O, R> | Suspend<O, R> | Terminal<R>;

interface Cons<O, R> {
  readonly tag: 'output';
  readonly head: O[];
  readonly tail: IO.IO<Pull<O, R>>;
}

interface Suspend<O, R> {
  readonly tag: 'suspend';
  readonly thunk: IO.IO<Pull<O, R>>;
}

interface Succeed<R> {
  readonly tag: 'succeed';
  readonly result: R;
}

interface Fail {
  readonly tag: 'fail';
  readonly error: Error;
}

export const pure: <R>(result: R) => Pull<never, R> = result => ({
  tag: 'succeed',
  result,
});

export const done: Pull<never, void> = pure(undefined);

export const throwError: (error: Error) => Pull<never, never> = error => ({
  tag: 'fail',
  error,
});

export const output1: <O>(a: O) => Pull<O, void> = x =>
  cons([x], IO.pure(done));

export const output: <O>(as: O[]) => Pull<O, void> = xs =>
  cons(xs, IO.pure(done));

export const cons: <O, R>(as: O[], tail: IO.IO<Pull<O, R>>) => Pull<O, R> = (
  xs,
  tail,
) => (xs.length === 0 ? suspend(tail) : { tag: 'output', head: xs, tail });

export const suspend: <O, R>(thunk: IO.IO<Pull<O, R>>) => Pull<O, R> =
  thunk => ({
    tag: 'suspend',
    thunk,
  });

export const fromIO: <R>(task: IO.IO<R>) => Pull<never, R> = task =>
  suspend(
    pipe(
      task,
      IO.map(pure),
      IO.handleErrorWith(e => IO.pure(throwError(e))),
    ),
  );

export const append: <O, R2>(
  fb: () => Pull<O, R2>,
) => <R>(fa: Pull<O, R>) => Pull<O, R2> = fb => fa => append_(fa, fb);

export const map: <O, R, R2>(
  f: (r: R) => R2,
) => (fa: Pull<O, R>) => Pull<O, R2> = f => fa => map_(fa, f);

export const flatMap: <O, R, R2>(
  f: (r: R) => Pull<O, R2>,
) => (fa: Pull<O, R>) => Pull<O, R2> = f => fa => flatMap_(fa, f);

export const handleErrorWith: <O, R>(
  h: (e: Error) => Pull<O, R>,
) => (fa: Pull<O, R>) => Pull<O, R> = h => fa => handleErrorWith_(fa, h);

export const delayBy: (ms: number) => <O, R>(fa: Pull<O, R>) => Pull<O, R> =
  ms => fa =>
    delayBy_(fa, ms);

export const append_ = <O, R, R2>(
  fa: Pull<O, R>,
  fb: () => Pull<O, R2>,
): Pull<O, R2> => flatMap_(fa, fb);

export const map_ = <O, R, R2>(fa: Pull<O, R>, f: (r: R) => R2): Pull<O, R2> =>
  flatMap_(fa, r => pure(f(r)));

export const flatMap_ = <O, R, R2>(
  fa: Pull<O, R>,
  f: (r: R) => Pull<O, R2>,
): Pull<O, R2> => {
  switch (fa.tag) {
    case 'succeed':
      try {
        return f(fa.result);
      } catch (e) {
        return throwError(e as Error);
      }

    case 'fail':
      return fa;

    case 'suspend':
      return suspend(IO.map_(fa.thunk, flatMap(f)));

    case 'output':
      return cons(fa.head, IO.map_(fa.tail, flatMap(f)));
  }
};

export const handleErrorWith_ = <O, R>(
  fa: Pull<O, R>,
  h: (e: Error) => Pull<O, R>,
): Pull<O, R> => {
  switch (fa.tag) {
    case 'succeed':
      return fa;

    case 'fail':
      try {
        return h(fa.error);
      } catch (e) {
        return throwError(e as Error);
      }

    case 'suspend':
      return suspend(IO.map_(fa.thunk, handleErrorWith(h)));

    case 'output':
      return cons(fa.head, IO.map_(fa.tail, handleErrorWith(h)));
  }
};

export const delayBy_ = <O, R>(fa: Pull<O, R>, ms: number): Pull<O, R> =>
  pipe(
    IO.defer(() => done),
    IO.delayBy(ms),
    IO.map(() => fa),
    suspend,
  );

// -- Output functions

export const take: (n: number) => <O>(fa: Pull<O, void>) => Pull<O, void> =
  n => fa =>
    take_(fa, n);

export const drop: (n: number) => <O>(fa: Pull<O, void>) => Pull<O, void> =
  n => fa =>
    drop_(fa, n);

export const last: <O>(fa: Pull<O, void>) => Pull<never, O | undefined> =
  fa => {
    const go = <O>(fa: Pull<O, void>, prev?: O): Pull<never, O | undefined> =>
      pipe(
        uncons(fa),
        flatMap(x => {
          if (!x) return pure(prev);
          const [hd, tl] = x;

          return go(tl, hd[hd.length - 1]);
        }),
      );
    return go(fa, undefined);
  };

export const filterOutput: <O>(
  p: (o: O) => boolean,
) => (fa: Pull<O, void>) => Pull<O, void> = p => fa => filterOutput_(fa, p);

export const mapOutput: <O, O2>(
  f: (o: O) => O2,
) => (fa: Pull<O, void>) => Pull<O2, void> = f => fa => mapOutput_(fa, f);

export const flatMapOutput: <O, O2>(
  f: (o: O) => Pull<O2, void>,
) => (fa: Pull<O, void>) => Pull<O2, void> = f => fa => flatMapOutput_(fa, f);

export const uncons = <O>(
  fa: Pull<O, void>,
): Pull<never, [O[], Pull<O, void>] | undefined> => {
  switch (fa.tag) {
    case 'succeed':
      return pure(undefined);
    case 'fail':
      return fa;

    case 'suspend':
      return suspend(IO.map_(fa.thunk, uncons));

    case 'output':
      return pure([fa.head, suspend(fa.tail)]);
  }
};

export const unconsN: (
  n: number,
  allowFewer?: boolean,
) => <O>(fa: Pull<O, void>) => Pull<never, [O[], Pull<O, void>] | undefined> =
  (n, allowFewer = true) =>
  fa =>
    unconsN_(fa, n, allowFewer);

export const compile: <O, B>(
  init: B,
  combine: (b: B, o: O) => B,
) => (fa: Pull<O, void>) => IO.IO<B> = (init, combine) => fa =>
  compile_(fa, combine, init);

export const take_ = <O>(fa: Pull<O, void>, n: number): Pull<O, void> =>
  pipe(
    uncons(fa),
    flatMap(x => {
      if (!x || n < 0) return done;
      const [hd, tl] = x;

      if (hd.length > n) return output(hd.slice(0, n));
      if (hd.length === n) return output(hd);

      return pipe(
        output(hd),
        append(() => take_(tl, n - hd.length)),
      );
    }),
  );

export const drop_ = <O>(fa: Pull<O, void>, n: number): Pull<O, void> =>
  pipe(
    uncons(fa),
    flatMap(x => {
      if (!x) return done;
      const [hd, tl] = x;

      if (hd.length > n)
        return pipe(
          output(hd.slice(n)),
          append(() => tl),
        );

      if (hd.length === n) return tl;
      return drop_(tl, hd.length - n);
    }),
  );

export const filterOutput_ = <O>(
  fa: Pull<O, void>,
  p: (o: O) => boolean,
): Pull<O, void> => {
  switch (fa.tag) {
    case 'succeed':
    case 'fail':
      return fa;

    case 'suspend':
      return suspend(IO.map_(fa.thunk, filterOutput(p)));

    case 'output':
      try {
        return cons(fa.head.filter(p), IO.map_(fa.tail, filterOutput(p)));
      } catch (e) {
        return append_(throwError(e as Error), () =>
          filterOutput_(suspend(fa.tail), p),
        );
      }
  }
};

export const mapOutput_ = <O, O2>(
  fa: Pull<O, void>,
  f: (o: O) => O2,
): Pull<O2, void> => {
  switch (fa.tag) {
    case 'succeed':
    case 'fail':
      return fa;

    case 'suspend':
      return suspend(IO.map_(fa.thunk, mapOutput(f)));

    case 'output':
      try {
        return cons(fa.head.map(f), IO.map_(fa.tail, mapOutput(f)));
      } catch (e) {
        return append_(throwError(e as Error), () =>
          mapOutput_(suspend(fa.tail), f),
        );
      }
  }
};

export const flatMapOutput_ = <O, O2>(
  fa: Pull<O, void>,
  f: (o: O) => Pull<O2, void>,
): Pull<O2, void> => {
  switch (fa.tag) {
    case 'succeed':
    case 'fail':
      return fa;

    case 'suspend':
      return suspend(IO.map_(fa.thunk, flatMapOutput(f)));

    case 'output': {
      const go = (idx: number): Pull<O2, void> => {
        if (idx < fa.head.length) {
          try {
            return pipe(
              f(fa.head[idx]),
              append(() => go(idx + 1)),
            );
          } catch (e) {
            return throwError(e);
          }
        } else {
          return suspend(IO.map_(fa.tail, flatMapOutput(f)));
        }
      };
      return go(0);
    }
  }
};

export const unconsN_ = <O>(
  fa: Pull<O, void>,
  n: number,
  allowFewer: boolean = true,
): Pull<never, [O[], Pull<O, void>] | undefined> => {
  switch (fa.tag) {
    case 'succeed':
      return pure(undefined);
    case 'fail':
      return fa;

    case 'suspend':
      return suspend(IO.map_(fa.thunk, unconsN(n, allowFewer)));

    case 'output':
      if (fa.head.length < n)
        return pipe(
          suspend(IO.map_(fa.tail, unconsN(n - fa.head.length, allowFewer))),
          flatMap(x => {
            if (!x && allowFewer) return pure([fa.head, done]);
            if (!x) return pure(undefined);
            return pure([fa.head.concat(x[0]), x[1]]);
          }),
        );

      if (fa.head.length > n)
        return pure([fa.head.slice(0, n), cons(fa.head.slice(n), fa.tail)]);

      return pure([fa.head, suspend(fa.tail)]);
  }
};

export const compile_ = <O, B>(
  fa: Pull<O, void>,
  combine: (b: B, o: O) => B,
  init: B,
): IO.IO<B> => {
  switch (fa.tag) {
    case 'succeed':
      return IO.pure(init);

    case 'fail':
      return IO.throwError(fa.error);

    case 'suspend':
      return IO.flatMap_(fa.thunk, compile(init, combine));

    case 'output':
      return pipe(
        IO.defer(() => fa.head.reduce(combine, init)),
        IO.flatMap(z => pipe(fa.tail, IO.flatMap(compile(z, combine)))),
      );
  }
};
