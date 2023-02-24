// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind, pipe, throwError } from '@fp4ts/core';
import { FunctionK, MonadError, Either, Option, None, Some } from '@fp4ts/cats';
import { UniqueToken, ExitCase } from '@fp4ts/effect';

import * as PO from './operators';
import * as PC from './constructors';
import {
  Acquire,
  Action,
  Bind,
  CanceledScope,
  CloseScope,
  Eval,
  Fail,
  FailedScope,
  FlatMapOutput,
  InScope,
  Interrupted,
  Pull,
  Succeed,
  SucceedScope,
  Terminal,
  Translate,
  Uncons,
  view,
} from './algebra';
import { Chunk } from '../chunk';
import { CompositeFailure } from '../composite-failure';
import { assert } from 'console';
import { Scope } from '../internal';
import { Stream } from '../stream/algebra';

const P = { ...PO, ...PC };

export const stream = <F, O>(pull: Pull<F, O, void>): Stream<F, O> =>
  new Stream(scope(pull));

export const streamNoScope = <F, O>(pull: Pull<F, O, void>): Stream<F, O> =>
  new Stream(pull);

export const cons = <F, O>(
  c: Chunk<O>,
  p: Pull<F, O, void>,
): Pull<F, O, void> => (c.isEmpty ? p : P.flatMap_(P.output(c), () => p));

export const uncons: <F, O>(
  pull: Pull<F, O, void>,
) => Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> = pull =>
  new Uncons(pull);

export const uncons1: <F, O>(
  p: Pull<F, O, void>,
) => Pull<F, never, Option<[O, Pull<F, O, void>]>> = p =>
  pipe(
    uncons(p),
    P.flatMap(opt =>
      opt.fold(
        () => P.pure(None),
        ([hd, tl]) =>
          hd.size === 1
            ? P.pure(Some([hd['!!'](0), tl]))
            : P.pure(Some([hd['!!'](0), cons(hd.drop(1), tl)])),
      ),
    ),
  );

export const unconsN: (
  n: number,
) => <F, O>(
  p: Pull<F, O, void>,
) => Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> = n => p =>
  unconsN_(p, n);

export const unconsLimit: (
  limit: number,
) => <F, O>(
  p: Pull<F, O, void>,
) => Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> = limit => p =>
  unconsLimit_(p, limit);

export const last = <F, O>(p: Pull<F, O, void>): Pull<F, never, Option<O>> => {
  const go = (
    p: Pull<F, O, void>,
    prev: Option<O>,
  ): Pull<F, never, Option<O>> =>
    pipe(
      uncons(p),
      P.flatMap(opt =>
        opt.fold(
          () => P.pure(prev),
          ([hd, tl]) => go(tl, hd.lastOption),
        ),
      ),
    );
  return go(p, None);
};

export const take: (
  n: number,
) => <F, O>(p: Pull<F, O, void>) => Pull<F, O, Option<Pull<F, O, void>>> =
  n => p =>
    take_(p, n);

export const takeRight: (
  n: number,
) => <F, O>(p: Pull<F, O, void>) => Pull<F, never, Chunk<O>> = n => p =>
  takeRight_(p, n);

export const takeWhile: <O>(
  pred: (o: O) => boolean,
  takeFailure?: boolean,
) => <F>(c: Pull<F, O, void>) => Pull<F, O, Option<Pull<F, O, void>>> =
  (pred, takeFailure) => c =>
    takeWhile_(c, pred, takeFailure);

export const drop: (
  n: number,
) => <F, O>(p: Pull<F, O, void>) => Pull<F, never, Option<Pull<F, O, void>>> =
  n => p =>
    drop_(p, n);

export const dropWhile: <O>(
  pred: (o: O) => boolean,
  dropFailure?: boolean,
) => <F>(p: Pull<F, O, void>) => Pull<F, never, Option<Pull<F, O, void>>> =
  (pred, dropFailure = false) =>
  p =>
    dropWhile_(p, pred, dropFailure);

export const find: <O>(
  pred: (o: O) => boolean,
) => <F>(
  p: Pull<F, O, void>,
) => Pull<F, never, Option<[O, Pull<F, O, void>]>> = pred => p =>
  find_(p, pred);

export const mapOutput: <O, P>(
  f: (o: O) => P,
) => <F>(pull: Pull<F, O, void>) => Pull<F, P, void> = f => pull =>
  mapOutput_(pull, f);

export const mapOutputNoScope: <O, P>(
  f: (o: O) => P,
) => <F>(pull: Pull<F, O, void>) => Pull<F, P, void> = f => pull =>
  mapOutputNoScope_(pull, f);

export const mapFlatMapOutput: <F, O, P>(
  f: (o: O) => Pull<F, P, void>,
) => (pull: Pull<F, O, void>) => Pull<F, P, void> = f => pull =>
  flatMapOutput_(pull, f);

export const translate: <F, G>(
  nt: FunctionK<F, G>,
) => <O>(pull: Pull<F, O, void>) => Pull<G, O, void> = nt => pull =>
  translate_(pull, nt);

export const fold: <O, P>(
  z: P,
  f: (p: P, o: O) => P,
) => <F>(p: Pull<F, O, void>) => Pull<F, never, P> = (z, f) => p =>
  fold_(p, z, f);

export const scanChunks: <S>(
  s: S,
) => <O, O2>(
  f: (s: S, c: Chunk<O>) => [S, Chunk<O2>],
) => <F>(p: Pull<F, O, void>) => Pull<F, O2, S> = s => f => p =>
  scanChunks_(p, s, f);

export const scanChunksOpt: <S>(
  s: S,
) => <OO, O2>(
  f: (s: S) => Option<(c: Chunk<OO>) => [S, Chunk<O2>]>,
) => <F, O extends OO>(p: Pull<F, O, void>) => Pull<F, O2, S> = s => f => p =>
  scanChunksOpt_(p, s, f);

export const scope = <F, O>(pull: Pull<F, O, void>): Pull<F, O, void> =>
  new InScope(pull, false);

export const interruptScope = <F, O>(
  pull: Pull<F, O, void>,
): Pull<F, O, void> => new InScope(pull, true);

export const compile: <F>(
  F: MonadError<F, Error>,
) => <O, B>(
  init: B,
  initScope: Scope<F>,
  foldChunk: (b: B, c: Chunk<O>) => B,
) => (stream: Pull<F, O, void>) => Kind<F, [B]> =
  F => (init, initScope, foldChunk) => stream =>
    compile_(F)(stream, init, initScope, foldChunk);

// -- Point-ful operators

export const unconsN_ = <F, O>(
  p: Pull<F, O, void>,
  n: number,
  allowFewer: boolean = false,
): Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> => {
  const go = (
    p: Pull<F, O, void>,
    remainder: number,
    acc: Chunk<O>,
  ): Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> =>
    pipe(
      uncons(p),
      P.flatMap(opt =>
        opt.fold(
          () =>
            allowFewer && acc.nonEmpty
              ? P.pure(Some([acc, P.done()]))
              : P.pure(None),
          ([hd, tl]) => {
            if (hd.size < remainder)
              return go(tl, remainder - hd.size, acc['+++'](hd));
            else if (hd.size === remainder)
              return P.pure(Some([acc['+++'](hd), tl]));
            else {
              const [pref, suf] = hd.splitAt(remainder);
              return P.pure(Some([acc['+++'](pref), cons(suf, tl)]));
            }
          },
        ),
      ),
    );

  return n <= 0 ? P.pure(Some([Chunk.empty, p])) : go(p, n, Chunk.empty);
};

export const unconsLimit_ = <F, O>(
  p: Pull<F, O, void>,
  limit: number,
): Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> => {
  assert(limit > 0, 'Chunk limit must be a positive value');
  return pipe(
    uncons(p),
    P.flatMap(opt =>
      opt.fold(
        () => P.pure(None),
        ([hd, tl]) => {
          if (hd.size < limit) return P.pure(Some([hd, tl]));
          const [pfx, sfx] = hd.splitAt(limit);
          return P.pure(Some([pfx, cons(sfx, tl)]));
        },
      ),
    ),
  );
};

export const take_ = <F, O>(
  p: Pull<F, O, void>,
  n: number,
): Pull<F, O, Option<Pull<F, O, void>>> =>
  n <= 0
    ? P.pure(None)
    : pipe(
        p,
        uncons,
        P.flatMap(opt =>
          opt.fold(
            () => P.pure(None),
            ([hd, tl]) => {
              const m = hd.size;
              if (m < n)
                return P.flatMap_(P.output(hd), () => take_(tl, n - m));
              if (m === n) return P.map_(P.output(hd), () => Some(tl));
              const [hdx, tlx] = hd.splitAt(n);
              return P.map_(P.output(hdx), () => Some(cons(tlx, tl)));
            },
          ),
        ),
      );

export const takeRight_ = <F, O>(
  p: Pull<F, O, void>,
  n: number,
): Pull<F, never, Chunk<O>> => {
  const go = (p: Pull<F, O, void>, acc: Chunk<O>): Pull<F, never, Chunk<O>> =>
    pipe(
      unconsN_(p, n, true),
      P.flatMap(opt =>
        opt.fold(
          () => P.pure(acc),
          ([hd, tl]) => go(tl, acc.drop(hd.size)['+++'](hd)),
        ),
      ),
    );

  return n <= 0 ? P.pure(Chunk.empty) : go(p, Chunk.empty);
};

export const takeWhile_ = <F, O>(
  p: Pull<F, O, void>,
  pred: (o: O) => boolean,
  takeFailure: boolean = false,
): Pull<F, O, Option<Pull<F, O, void>>> =>
  pipe(
    uncons(p),
    P.flatMap(opt =>
      opt.fold(
        () => P.pure(None),
        ([hd, tl]) =>
          hd
            .findIndex(x => !pred(x))
            .fold(
              () =>
                pipe(
                  P.output<F, O>(hd),
                  P.flatMap(() => takeWhile_(tl, pred, takeFailure)),
                ),
              idx => {
                const toTake = takeFailure ? idx + 1 : idx;
                const [pfx, sfx] = hd.splitAt(toTake);
                return P.flatMap_(P.output(pfx), () =>
                  P.pure(Some(cons(sfx, tl))),
                );
              },
            ),
      ),
    ),
  );

export const drop_ = <F, O>(
  p: Pull<F, O, void>,
  n: number,
): Pull<F, never, Option<Pull<F, O, void>>> =>
  n <= 0
    ? P.pure(Some(p))
    : pipe(
        p,
        uncons,
        P.flatMap(opt =>
          opt.fold(
            () => P.pure(None),
            ([hd, tl]) => {
              const m = hd.size;
              if (m < n) return drop_(tl, n - m);
              if (m === n) return P.pure(Some(tl));
              return P.pure(Some(cons(hd.drop(n), tl)));
            },
          ),
        ),
      );

export const dropWhile_ = <F, O>(
  p: Pull<F, O, void>,
  pred: (o: O) => boolean,
  dropFailure: boolean = false,
): Pull<F, never, Option<Pull<F, O, void>>> =>
  pipe(
    uncons(p),
    P.flatMap(opt =>
      opt.fold(
        () => P.pure(None),
        ([hd, tl]) =>
          hd
            .findIndex(o => !pred(o))
            .fold(
              () => dropWhile_(tl, pred),
              idx => {
                const toDrop = dropFailure ? idx + 1 : idx;
                return P.pure(Some(cons(hd.drop(toDrop), tl)));
              },
            ),
      ),
    ),
  );

export const find_ = <F, O>(
  p: Pull<F, O, void>,
  pred: (o: O) => boolean,
): Pull<F, never, Option<[O, Pull<F, O, void>]>> =>
  pipe(
    uncons(p),
    P.flatMap(opt =>
      opt.fold(
        () => P.pure(None),
        ([hd, tl]) =>
          hd.findIndex(pred).fold(
            () => find_(tl, pred),
            idx => {
              const rem = hd.drop(idx + 1);
              return P.pure(Some([hd['!!'](idx), cons(rem, tl)]));
            },
          ),
      ),
    ),
  );

export const mapOutput_ = <F, O, P>(
  pull: Pull<F, O, void>,
  f: (o: O) => P,
): Pull<F, P, void> => interruptScope(mapOutputNoScope_(pull, f));

export const mapOutputNoScope_ = <F, O, P>(
  pull: Pull<F, O, void>,
  f: (o: O) => P,
): Pull<F, P, void> => {
  const go = (p: Pull<F, O, void>): Pull<F, P, void> =>
    pipe(
      uncons(p),
      P.flatMap(opt =>
        opt.fold(
          () => P.unit,
          ([hd, tl]) => P.flatMap_(P.output(hd.map(f)), () => go(tl)),
        ),
      ),
    );

  return go(pull);
};

export const flatMapOutput_ = <F, O, P>(
  pull: Pull<F, O, void>,
  f: (o: O) => Pull<F, P, void>,
): Pull<F, P, void> => new FlatMapOutput(pull, f);

export const fold_ = <F, O, P>(
  p: Pull<F, O, void>,
  z: P,
  f: (p: P, o: O) => P,
): Pull<F, never, P> =>
  pipe(
    uncons(p),
    P.flatMap(opt =>
      opt.fold(
        () => P.pure(z),
        ([hd, tl]) => {
          const acc = hd.foldLeft(z, f);
          return fold_(tl, acc, f);
        },
      ),
    ),
  );

export const scanChunks_ = <F, O, O2, S>(
  p: Pull<F, O, void>,
  s: S,
  f: (s: S, c: Chunk<O>) => [S, Chunk<O2>],
): Pull<F, O2, S> => scanChunksOpt_(p, s, s => Some(c => f(s, c)));

export const scanChunksOpt_ = <F, O, O2, S>(
  p: Pull<F, O, void>,
  s: S,
  f: (s: S) => Option<(c: Chunk<O>) => [S, Chunk<O2>]>,
): Pull<F, O2, S> => {
  const go = (p: Pull<F, O, void>, acc: S): Pull<F, O2, S> =>
    f(acc).fold(
      () => P.pure(acc),
      g =>
        pipe(
          uncons(p),
          P.flatMap(opt =>
            opt.fold(
              () => P.pure(acc),
              ([hd, tl]) => {
                const [s, c] = g(hd);
                return pipe(
                  P.output<F, O2>(c),
                  P.flatMap(() => go(tl, s)),
                );
              },
            ),
          ),
        ),
    );

  return go(p, s);
};

export const translate_ = <F, G, O>(
  pull: Pull<F, O, void>,
  nt: FunctionK<F, G>,
): Pull<G, O, void> => new Translate(pull, nt);

// -- Compilation

export const compile_ =
  <F>(F: MonadError<F, Error>) =>
  <O, B>(
    stream: Pull<F, O, void>,
    init: B,
    initScope: Scope<F>,
    foldChunk: (b: B, c: Chunk<O>) => B,
    extendLastTopLevelScope: boolean = false,
  ): Kind<F, [B]> => {
    type ViewL<G, X> = Action<G, X, unknown> | Terminal<unknown>;

    let cont: Cont<unknown, any, never>;

    function viewL<G, X>(free0: Pull<G, X, void>): ViewL<G, X> {
      let free: Pull<G, X, void> = free0;
      while (true) {
        const v = view(free);
        switch (v.tag) {
          case 'succeed':
          case 'fail':
          case 'interrupted':
            return v;

          case 'bind': {
            const step = view(v.step);
            switch (step.tag) {
              case 'succeed':
              case 'fail':
              case 'interrupted':
                free = v.cont(step);
                continue;

              case 'bind':
                free = new Bind<G, X, any, void>(
                  step.step,
                  r => new Bind(step.cont(r), v.cont),
                );
                continue;

              // case 'translate':
              // case 'output':
              // case 'flatMapOutput':
              // case 'uncons':
              // case 'eval':
              // case 'acquire':
              // case 'interruptWhen':
              // case 'inScope':
              // case 'getScope':
              // case 'succeedScope':
              // case 'canceledScope':
              // case 'failedScope':
              default:
                cont = v.cont as Cont<unknown, any, never>;
                return step;
            }
          }

          // case 'translate':
          // case 'output':
          // case 'flatMapOutput':
          // case 'uncons':
          // case 'eval':
          // case 'acquire':
          // case 'interruptWhen':
          // case 'succeedScope':
          // case 'canceledScope':
          // case 'failedScope':
          // case 'inScope':
          default:
            cont = id;
            return v as ViewL<G, X>;
        }
      }
    }

    function interruptGuard<G, X, End>(
      scope: Scope<F>,
      ctx: GoContext<F, G, X, End>,
      view: Cont<never, G, X>,
      next: () => Kind<F, [End]>,
    ): Kind<F, [End]> {
      return F.flatMap_(scope.isInterrupted, optOc =>
        optOc.fold(
          () => next(),
          oc => {
            const result = oc.fold(
              () => new Interrupted(scope.id, None),
              e => new Fail(e),
              scopeId => new Interrupted(scopeId, None),
            );
            return ctx.go(
              scope,
              ctx.extendedTopLevelScope,
              ctx.translation,
              ctx.runner,
              view(result),
            );
          },
        ),
      );
    }

    function interruptBoundary<G, X>(
      pull: Pull<G, X, void>,
      inter: Interrupted,
    ): Pull<G, X, void> {
      const view = viewL(pull);
      switch (view.tag) {
        case 'succeedScope':
        case 'canceledScope':
        case 'failedScope': {
          const cl: Pull<G, X, void> = new CanceledScope(view.scopeId, inter);
          return new Bind<G, X, void, void>(cl, cont);
        }

        case 'interrupted':
          throw new Error('Impossible state');

        case 'succeed':
          return inter;

        case 'fail': {
          const mixed = CompositeFailure.fromArray([
            ...inter.deferredError.toArray,
            view.error,
          ]).getOrElse(() => view.error);
          return new Fail(mixed);
        }

        // case 'translate':
        // case 'output':
        // case 'flatMapOutput':
        // case 'uncons':
        // case 'eval':
        // case 'acquire':
        // case 'interruptWhen':
        // case 'getScope':
        // case 'inScope':
        default:
          return cont(inter);
      }
    }

    function go<G, X, End>(
      scope: Scope<F>,
      extendedTopLevelScope: Option<Scope<F>>,
      translation: FunctionK<G, F>,
      runner: Run<F, G, X, Kind<F, [End]>>,
      stream: Pull<G, X, void>,
    ): Kind<F, [End]> {
      const ctx: GoContext<F, G, X, End> = {
        F,
        go,
        scope,
        extendedTopLevelScope,
        extendLastTopLevelScope,
        translation,
        runner,
        interruptBoundary,
        interruptGuard,
      };

      const v = viewL(stream);
      switch (v.tag) {
        case 'translate': {
          const composed: FunctionK<unknown, F> = a => translation(v.nt(a));
          const runner: Run<F, unknown, X, Kind<F, [End]>> = new TranslateRun(
            ctx,
            v.nt,
            cont,
          );
          return go(scope, extendedTopLevelScope, composed, runner, v.self);
        }

        case 'output':
          return interruptGuard(scope, ctx, cont, () =>
            runner.out(v.values, scope, cont(P.unit)),
          );

        case 'flatMapOutput':
          return F.flatMap_(F.unit, () =>
            go(
              scope,
              extendedTopLevelScope,
              translation,
              new FlatMapRun(ctx, cont, v.fun),
              v.self,
            ),
          );

        case 'uncons':
          return goUncons(v, cont, ctx);

        case 'eval':
          return goEval(v, cont, ctx);

        case 'acquire':
          return goAcquire(v, cont, ctx);

        case 'interruptWhen':
          return goInterruptWhen(translation(v.haltOnSignal), cont, ctx);

        case 'inScope':
          return goInScope(v.self, v.useInterruption, cont, ctx);

        case 'getScope':
          return go(
            scope,
            extendedTopLevelScope,
            translation,
            runner,
            cont(new Succeed(scope)),
          );

        case 'succeedScope':
        case 'canceledScope':
        case 'failedScope':
          return goCloseScope(v, cont, ctx);

        case 'succeed':
          return runner.done(scope);

        case 'fail':
          return runner.fail(v.error);

        case 'interrupted':
          return runner.interrupted(v);
      }
    }

    const initFk: FunctionK<F, F> = id;

    class OuterRun implements Run<F, F, O, Kind<F, [B]>> {
      public constructor(private acc: B) {}

      done(): Kind<F, [B]> {
        return F.pure(this.acc);
      }

      fail(e: Error) {
        return F.throwError(e);
      }

      interrupted(inter: Interrupted) {
        return inter.deferredError.fold(() => F.pure(this.acc), F.throwError);
      }

      out(
        hd: Chunk<O>,
        outScope: Scope<F>,
        tl: Pull<F, O, void>,
      ): Kind<F, [B]> {
        try {
          this.acc = foldChunk(this.acc, hd);
          return go<F, O, B>(outScope, None, initFk, this, tl);
        } catch (error) {
          const tv = viewL(tl);
          switch (tv.tag) {
            case 'succeed':
              return F.throwError(error as Error);
            case 'fail':
              return F.throwError(
                CompositeFailure.from(tv.error, error as Error),
              );
            case 'interrupted':
              return F.throwError(
                tv.deferredError.fold(
                  () => error as Error,
                  e2 => CompositeFailure.from(e2, error as Error),
                ),
              );

            // case 'translate':
            // case 'output':
            // case 'flatMapOutput':
            // case 'uncons':
            // case 'eval':
            // case 'acquire':
            // case 'interruptWhen':
            // case 'getScope':
            // case 'succeedScope':
            // case 'canceledScope':
            // case 'failedScope':
            // case 'inScope':
            default:
              return go<F, O, B>(
                outScope,
                None,
                initFk,
                this,
                cont(new Fail(error as Error)),
              );
          }
        }
      }
    }

    return go(initScope, None, initFk, new OuterRun(init), stream);
  };

type Cont<Y, G, X> = (t: Terminal<Y>) => Pull<G, X, void>;

interface Run<F, G, X, End> {
  done(scope: Scope<F>): End;
  fail(e: Error): End;
  out(hd: Chunk<X>, scope: Scope<F>, tl: Pull<G, X, void>): End;
  interrupted(inter: Interrupted): End;
}

type CallRun<F, G, X, End> = (r: Run<F, G, X, End>) => End;

interface GoContext<F, G, X, End> {
  readonly F: MonadError<F, Error>;
  readonly scope: Scope<F>;
  readonly extendedTopLevelScope: Option<Scope<F>>;
  readonly extendLastTopLevelScope: boolean;
  readonly translation: FunctionK<G, F>;
  readonly runner: Run<F, G, X, Kind<F, [End]>>;

  readonly go: <G, X, End>(
    scope: Scope<F>,
    extendedTopLevelScope: Option<Scope<F>>,
    translation: FunctionK<G, F>,
    runner: Run<F, G, X, Kind<F, [End]>>,
    stream: Pull<G, X, void>,
  ) => Kind<F, [End]>;
  interruptGuard<G, X, End>(
    scope: Scope<F>,
    ctx: GoContext<F, G, X, End>,
    view: Cont<never, G, X>,
    next: () => Kind<F, [End]>,
  ): Kind<F, [End]>;
  interruptBoundary<G, X>(
    pull: Pull<G, X, void>,
    inter: Interrupted,
  ): Pull<G, X, void>;
}

class BuildRun<F, G, X, End>
  implements Run<F, G, X, Kind<F, [CallRun<F, G, X, Kind<F, [End]>>]>>
{
  public constructor(public readonly ctx: GoContext<F, G, X, End>) {}

  fail(e: Error) {
    return this.ctx.F.throwError(e);
  }
  done(scope: Scope<F>) {
    return this.ctx.F.pure((r: Run<F, G, X, Kind<F, [End]>>) => r.done(scope));
  }
  out(hd: Chunk<X>, scope: Scope<F>, tl: Pull<G, X, void>) {
    return this.ctx.F.pure((r: Run<F, G, X, Kind<F, [End]>>) =>
      r.out(hd, scope, tl),
    );
  }
  interrupted(i: Interrupted) {
    return this.ctx.F.pure((r: Run<F, G, X, Kind<F, [End]>>) =>
      r.interrupted(i),
    );
  }
}

class TranslateRun<F, H, G, X, End> implements Run<F, H, X, Kind<F, [End]>> {
  public constructor(
    private readonly ctx: GoContext<F, G, X, End>,
    private readonly fk: FunctionK<H, G>,
    private readonly cont: Cont<void, G, X>,
  ) {}

  done(scope: Scope<F>) {
    return this.ctx.go(
      scope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      this.cont(P.unit),
    );
  }

  fail(e: Error) {
    return this.ctx.runner.fail(e);
  }

  interrupted(inter: Interrupted) {
    return this.ctx.go(
      this.ctx.scope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      this.cont(inter),
    );
  }

  out(hd: Chunk<X>, scope: Scope<F>, tl: Pull<H, X, void>) {
    return this.ctx.runner.out(
      hd,
      scope,
      new Bind(new Translate(tl, this.fk), this.cont),
    );
  }
}

class ContRunner<F, G, X, End> implements Run<F, G, X, Kind<F, [End]>> {
  public constructor(
    private readonly ctx: GoContext<F, G, X, End>,
    private readonly cont: Cont<void, G, X>,
  ) {}

  done(doneScope: Scope<F>) {
    return this.ctx.go(
      doneScope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      this.cont(P.unit),
    );
  }

  fail(e: Error) {
    return this.ctx.go(
      this.ctx.scope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      this.cont(new Fail(e)),
    );
  }

  interrupted(inter: Interrupted) {
    return this.ctx.go(
      this.ctx.scope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      this.cont(inter),
    );
  }

  out(hd: Chunk<X>, scope: Scope<F>, tail: Pull<G, X, void>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let cur: Run<F, G, X, Kind<F, [End]>> = this;
    let acc: Pull<G, X, void> = tail;

    while (cur instanceof ContRunner) {
      acc = new Bind(acc, cur.cont);
      cur = cur.ctx.runner;
    }
    return cur.out(hd, scope, acc);
  }
}

abstract class StepRun<F, Y, S, G, X, End>
  implements Run<F, G, Y, Kind<F, [End]>>
{
  public constructor(
    protected readonly ctx: GoContext<F, G, X, End>,
    protected readonly cont: Cont<Option<S>, G, X>,
  ) {}

  done(doneScope: Scope<F>) {
    return this.ctx.interruptGuard(doneScope, this.ctx, this.cont, () =>
      this.ctx.go(
        doneScope,
        this.ctx.extendedTopLevelScope,
        this.ctx.translation,
        this.ctx.runner,
        this.cont(new Succeed(None)),
      ),
    );
  }

  fail(e: Error) {
    return this.ctx.go(
      this.ctx.scope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      this.cont(new Fail(e)),
    );
  }

  interrupted(inter: Interrupted) {
    return this.ctx.go(
      this.ctx.scope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      this.cont(inter),
    );
  }

  abstract out(
    hd: Chunk<Y>,
    scope: Scope<F>,
    tl: Pull<G, Y, void>,
  ): Kind<F, [End]>;
}

class UnconsRun<F, Y, G, X, End> extends StepRun<
  F,
  Y,
  [Chunk<Y>, Pull<G, Y, void>],
  G,
  X,
  End
> {
  override out(
    hd: Chunk<Y>,
    outScope: Scope<F>,
    tl: Pull<G, Y, void>,
  ): Kind<F, [End]> {
    return this.ctx.interruptGuard(outScope, this.ctx, this.cont, () =>
      this.ctx.go(
        outScope,
        this.ctx.extendedTopLevelScope,
        this.ctx.translation,
        this.ctx.runner,
        this.cont(new Succeed(Some([hd, tl]))),
      ),
    );
  }
}

class FlatMapRun<F, Y, G, X, End> implements Run<F, G, Y, Kind<F, [End]>> {
  public constructor(
    private readonly ctx: GoContext<F, G, X, End>,
    private readonly cont: Cont<void, G, X>,
    private readonly fun: (t: Y) => Pull<G, X, void>,
  ) {}

  private unconsed(hd: Chunk<Y>, tl: Pull<G, Y, void>): Pull<G, X, void> {
    const go = (idx: number): Pull<G, X, void> => {
      if (idx === hd.size) return flatMapOutput_(tl, this.fun);
      try {
        return new Bind<G, X, void, void>(this.fun(hd['!!'](idx)), t => {
          switch (t.tag) {
            case 'succeed':
              return go(idx + 1);
            case 'fail':
              return t;
            case 'interrupted':
              return flatMapOutput_(
                this.ctx.interruptBoundary(tl, t),
                this.fun,
              );
          }
        });
      } catch (error) {
        return new Fail(error as Error);
      }
    };

    return go(0);
  }

  done(scope: Scope<F>) {
    return this.ctx.interruptGuard(scope, this.ctx, this.cont, () =>
      this.ctx.go(
        scope,
        this.ctx.extendedTopLevelScope,
        this.ctx.translation,
        this.ctx.runner,
        this.cont(P.unit),
      ),
    );
  }

  fail(e: Error) {
    return this.ctx.go(
      this.ctx.scope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      this.cont(new Fail(e)),
    );
  }

  interrupted(inter: Interrupted) {
    return this.ctx.go(
      this.ctx.scope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      this.cont(inter),
    );
  }

  out(hd: Chunk<Y>, outScope: Scope<F>, tl: Pull<G, Y, void>) {
    return this.ctx.go(
      outScope,
      this.ctx.extendedTopLevelScope,
      this.ctx.translation,
      this.ctx.runner,
      new Bind(this.unconsed(hd, tl), this.cont),
    );
  }
}

function goUncons<F, G, X, End>(
  un: Uncons<G, X>,
  cont: Cont<Option<[Chunk<X>, Pull<G, X, void>]>, G, X>,
  ctx: GoContext<F, G, X, End>,
): Kind<F, [End]> {
  const { F } = ctx;
  return pipe(
    F.unit,
    F.flatMap(() =>
      ctx.go<G, X, CallRun<F, G, X, Kind<F, [End]>>>(
        ctx.scope,
        ctx.extendedTopLevelScope,
        ctx.translation,
        new BuildRun<F, G, unknown, End>(ctx),
        un.self,
      ),
    ),
    F.attempt,
    F.flatMap(ea =>
      ea.fold(
        e =>
          ctx.go(
            ctx.scope,
            ctx.extendedTopLevelScope,
            ctx.translation,
            ctx.runner,
            cont(new Fail(e)),
          ),
        f => f(new UnconsRun(ctx, cont)),
      ),
    ),
  );
}

function goEval<F, G, Y, X, End>(
  ev: Eval<G, Y>,
  cont: Cont<Y, G, X>,
  ctx: GoContext<F, G, X, End>,
): Kind<F, [End]> {
  return pipe(
    ctx.scope.interruptibleEval(ctx.translation(ev.value)),
    ctx.F.flatMap(eitherOutcome => {
      const result = eitherOutcome.fold(
        oc =>
          oc.fold(
            () => new Interrupted(ctx.scope.id, None),
            e => new Fail(e),
            scopeId => new Interrupted(scopeId, None),
          ),
        r => new Succeed(r),
      );

      return ctx.go(
        ctx.scope,
        ctx.extendedTopLevelScope,
        ctx.translation,
        ctx.runner,
        cont(result),
      );
    }),
  );
}

function goAcquire<F, G, X, R, End>(
  acquire: Acquire<G, R>,
  cont: Cont<R, G, X>,
  ctx: GoContext<F, G, X, End>,
): Kind<F, [End]> {
  const onScope = ctx.scope.acquireResource<R>(
    poll =>
      acquire.cancelable
        ? poll(ctx.translation(acquire.resource))
        : ctx.translation(acquire.resource),
    (resource, ec) => ctx.translation(acquire.release(resource, ec)),
  );

  const cont_ = ctx.F.flatMap_(onScope, oc => {
    const result = oc.fold(
      () => new Interrupted(ctx.scope.id, None),
      e => new Fail(e),
      ea =>
        ea.fold(
          scopeId => new Interrupted(scopeId, None),
          result => new Succeed(result),
        ),
    );
    return ctx.go(
      ctx.scope,
      ctx.extendedTopLevelScope,
      ctx.translation,
      ctx.runner,
      cont(result),
    );
  });

  return ctx.interruptGuard(ctx.scope, ctx, cont, () => cont_);
}

function goInterruptWhen<F, G, X, End>(
  haltOnSignal: Kind<F, [Either<Error, void>]>,
  cont: Cont<void, G, X>,
  ctx: GoContext<F, G, X, End>,
): Kind<F, [End]> {
  const onScope = ctx.scope.acquireResource(
    () => ctx.scope.interruptWhen(haltOnSignal),
    f => f.cancel,
  );

  const cont_ = ctx.F.flatMap_(onScope, outcome => {
    const result = outcome.fold(
      () => new Interrupted(ctx.scope.id, None),
      e => new Fail(e),
      ea =>
        ea.fold(
          scopeId => new Interrupted(scopeId, None),
          () => new Succeed(undefined as void),
        ),
    );

    return ctx.go(
      ctx.scope,
      ctx.extendedTopLevelScope,
      ctx.translation,
      ctx.runner,
      cont(result),
    );
  });

  return ctx.interruptGuard(ctx.scope, ctx, cont, () => cont_);
}

function goInScope<F, G, X, End>(
  pull: Pull<G, X, void>,
  useInterruption: boolean,
  cont: Cont<void, G, X>,
  ctx: GoContext<F, G, X, End>,
): Kind<F, [End]> {
  const { F } = ctx;
  const endScope = (
    scopeId: UniqueToken,
    result: Terminal<void>,
  ): Pull<G, X, void> => {
    switch (result.tag) {
      case 'succeed':
        return new SucceedScope(scopeId);
      case 'fail':
        return new FailedScope(scopeId, result.error);
      case 'interrupted':
        return new CanceledScope(scopeId, result);
    }
  };

  const maybeCloseExtendScope: Kind<F, [Option<Scope<F>>]> =
    ctx.scope.isRoot && ctx.extendedTopLevelScope.nonEmpty
      ? ctx.extendedTopLevelScope.fold(
          () =>
            throwError(
              new Error(
                'Impossible, we just checked that the option is not empty',
              ),
            ),
          scope =>
            F.map_(F.rethrow(scope.close(ExitCase.Succeeded)), () => None),
        )
      : F.pure(ctx.extendedTopLevelScope);

  const tail = F.flatMap_(maybeCloseExtendScope, newExtendedScope =>
    pipe(
      ctx.scope.open(useInterruption),
      F.rethrow,
      F.flatMap(childScope => {
        const bb = new Bind<G, X, void, void>(pull, r =>
          endScope(childScope.id, r),
        );
        return ctx.go(
          childScope,
          newExtendedScope,
          ctx.translation,
          new ContRunner(ctx, cont),
          bb,
        );
      }),
    ),
  );

  return ctx.interruptGuard(ctx.scope, ctx, cont, () => tail);
}

function goCloseScope<F, G, X, End>(
  close: CloseScope,
  cont: Cont<void, G, X>,
  ctx: GoContext<F, G, X, End>,
): Kind<F, [End]> {
  const { F } = ctx;
  const addError = (error: Error, res: Terminal<void>): Terminal<void> => {
    switch (res.tag) {
      case 'succeed':
        return new Fail(error);
      case 'fail':
        return new Fail(CompositeFailure.from(error, res.error));
      case 'interrupted':
        throw new Error('Impossible state');
    }
  };

  const cont_ = (res: Terminal<void>): Pull<G, X, void> =>
    close.exitCase.fold(
      () => cont(res),
      error => cont(addError(error, res)),
      () => cont(res),
    );

  const closeTerminal = (
    r: Either<Error, void>,
    ancestor: Scope<F>,
  ): Terminal<void> =>
    close.interruption.fold(
      () =>
        r.fold(
          e => new Fail(e),
          rr => new Succeed(rr),
        ),
      ({ context, deferredError }) => {
        const err1 = () =>
          CompositeFailure.fromArray([
            ...r.swapped.toArray,
            ...deferredError.toArray,
          ]);

        return ancestor.descendsFrom(context)
          ? new Interrupted(context, err1())
          : err1().fold(
              () => P.unit,
              error => new Fail(error),
            );
      },
    );

  return ctx.F.flatMap_(ctx.scope.findInLineage(close.scopeId), optToClose =>
    optToClose.fold(
      () => {
        const result = close.interruption.getOrElse(() => P.unit);
        return ctx.go<G, X, End>(
          ctx.scope,
          ctx.extendedTopLevelScope,
          ctx.translation,
          ctx.runner,
          cont_(result),
        );
      },
      toClose => {
        if (toClose.isRoot)
          // impossible
          return ctx.go<G, X, End>(
            ctx.scope,
            ctx.extendedTopLevelScope,
            ctx.translation,
            ctx.runner,
            cont_(P.unit),
          );

        if (ctx.extendLastTopLevelScope && toClose.level === 1)
          return pipe(
            ctx.extendedTopLevelScope.fold(
              () => F.unit,
              s => s.close(ExitCase.Succeeded),
            ),
            F.productR(toClose.openAncestor),
            F.flatMap(ancestor =>
              ctx.go(
                ancestor,
                Some(toClose),
                ctx.translation,
                ctx.runner,
                cont_(P.unit),
              ),
            ),
          );

        return F.do(function* (_) {
          const r = yield* _(toClose.close(close.exitCase));
          const ancestor = yield* _(toClose.openAncestor);
          const res = closeTerminal(r, ancestor);
          return yield* _(
            ctx.go(
              ancestor,
              ctx.extendedTopLevelScope,
              ctx.translation,
              ctx.runner,
              cont_(res),
            ),
          );
        });
      },
    ),
  );
}
