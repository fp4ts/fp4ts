import { AnyK, id, Kind, pipe } from '@cats4ts/core';
import { None, Option, Some } from '@cats4ts/cats-core/lib/data';

import * as PO from './operators';
import * as PC from './constructors';
import {
  Action,
  Bind,
  Fail,
  FlatMapOutput,
  Pull,
  Succeed,
  Terminal,
  Translate,
  Uncons,
  view,
} from './algebra';
import { Chunk } from '../chunk';
import { FunctionK, MonadError } from '@cats4ts/cats-core';

const P = { ...PO, ...PC };

export const uncons: <F extends AnyK, O>(
  pull: Pull<F, O, void>,
) => Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> = pull =>
  new Uncons(pull);

export const mapOutput: <O, P>(
  f: (o: O) => P,
) => <F extends AnyK>(pull: Pull<F, O, void>) => Pull<F, P, void> = f => pull =>
  mapOutput_(pull, f);

export const mapFlatMapOutput: <F extends AnyK, O, P>(
  f: (o: O) => Pull<F, P, void>,
) => (pull: Pull<F, O, void>) => Pull<F, P, void> = f => pull =>
  flatMapOutput_(pull, f);

export const translate: <F extends AnyK, G extends AnyK>(
  nt: FunctionK<F, G>,
) => <O>(pull: Pull<F, O, void>) => Pull<G, O, void> = nt => pull =>
  translate_(pull, nt);

export const compile: <F extends AnyK>(
  F: MonadError<F, Error>,
) => <O, B>(
  init: B,
  foldChunk: (b: B, c: Chunk<O>) => B,
) => (stream: Pull<F, O, void>) => Kind<F, [B]> =
  F => (init, foldChunk) => stream =>
    compile_(F)(stream, init, foldChunk);

// -- Point-ful operators

export const mapOutput_ = <F extends AnyK, O, P>(
  pull: Pull<F, O, void>,
  f: (o: O) => P,
): Pull<F, P, void> => {
  const go = (p: Pull<F, O, void>): Pull<F, P, void> =>
    pipe(
      p,
      uncons,
      P.flatMap(opt =>
        opt.fold(
          () => P.unit,
          ([hd, tl]) => P.flatMap_(P.output(hd.map(f)), () => go(tl)),
        ),
      ),
    );

  return go(pull);
};

export const flatMapOutput_ = <F extends AnyK, O, P>(
  pull: Pull<F, O, void>,
  f: (o: O) => Pull<F, P, void>,
): Pull<F, P, void> => new FlatMapOutput(pull, f);

export const translate_ = <F extends AnyK, G extends AnyK, O>(
  pull: Pull<F, O, void>,
  nt: FunctionK<F, G>,
): Pull<G, O, void> => new Translate(pull, nt);

export const compile_ =
  <F extends AnyK>(F: MonadError<F, Error>) =>
  <O, B>(
    stream: Pull<F, O, void>,
    init: B,
    foldChunk: (b: B, c: Chunk<O>) => B,
  ): Kind<F, [B]> => {
    type Cont<Y, G extends AnyK, X> = (t: Terminal<Y>) => Pull<G, X, void>;

    interface Run<G extends AnyK, X, End> {
      done(): End;
      fail(e: Error): End;
      out(hd: Chunk<X>, tl: Pull<G, X, void>): End;
    }

    type CallRun<G extends AnyK, X, End> = (r: Run<G, X, End>) => End;

    class BuildRun<G extends AnyK, X, End>
      implements Run<G, X, Kind<F, [CallRun<G, X, Kind<G, [End]>>]>>
    {
      fail = (e: Error) => F.throwError(e);
      done = () => F.pure((r: Run<G, X, Kind<F, [End]>>) => r.done());
      out = (hd: Chunk<X>, tl: Pull<G, X, void>) =>
        F.pure((r: Run<G, X, Kind<F, [End]>>) => r.out(hd, tl));
    }

    type ViewL<G extends AnyK, X> = Action<G, X, unknown> | Terminal<unknown>;

    let cont: Cont<unknown, AnyK, never>;

    const viewL = <G extends AnyK, X>(free: Pull<G, X, void>): ViewL<G, X> => {
      const v = view(free);
      switch (v.tag) {
        case 'succeed':
        case 'fail':
          return v;

        case 'translate':
        case 'output':
        case 'flatMapOutput':
        case 'uncons':
        case 'eval':
          cont = id;
          return v;

        case 'bind': {
          const step = view(v.step);
          switch (step.tag) {
            case 'succeed':
            case 'fail':
              return viewL(v.cont(step));

            case 'translate':
            case 'output':
            case 'flatMapOutput':
            case 'uncons':
            case 'eval':
              cont = v.cont;
              return step;

            case 'bind':
              return viewL(
                new Bind(step.step, r => new Bind(step.cont(r), v.cont)),
              );
          }
        }
      }
    };

    const go = <G extends AnyK, X, End>(
      translation: FunctionK<G, F>,
      runner: Run<G, X, Kind<F, [End]>>,
      stream: Pull<G, X, void>,
    ): Kind<F, [End]> => {
      class TranslateRun<H extends AnyK> implements Run<H, X, Kind<F, [End]>> {
        public constructor(
          private readonly fk: FunctionK<H, G>,
          private readonly cont: Cont<void, G, X>,
        ) {}

        done = () => go(translation, runner, this.cont(P.unit));

        fail = (e: Error) => go(translation, runner, this.cont(new Fail(e)));

        out = (hd: Chunk<X>, tl: Pull<H, X, void>) =>
          runner.out(hd, new Bind(new Translate(tl, this.fk), this.cont));
      }

      abstract class StepRun<Y, S> implements Run<G, Y, Kind<F, [End]>> {
        public constructor(protected readonly cont: Cont<Option<S>, G, X>) {}

        done = () => go(translation, runner, this.cont(new Succeed(None)));

        fail = (e: Error) => go(translation, runner, this.cont(new Fail(e)));

        abstract out(hd: Chunk<Y>, tl: Pull<G, Y, void>): Kind<F, [End]>;
      }

      class UnconsRun<Y> extends StepRun<Y, [Chunk<Y>, Pull<G, Y, void>]> {
        override out = (hd: Chunk<Y>, tl: Pull<G, Y, void>): Kind<F, [End]> =>
          go(translation, runner, this.cont(new Succeed(Some([hd, tl]))));
      }

      class FlatMapRun<Y> implements Run<G, Y, Kind<F, [End]>> {
        public constructor(
          private readonly cont: Cont<void, G, X>,
          private readonly fun: (t: Y) => Pull<G, X, void>,
        ) {}

        private unconsed = (
          hd: Chunk<Y>,
          tl: Pull<G, Y, void>,
        ): Pull<G, X, void> => {
          const go = (idx: number): Pull<G, X, void> => {
            if (idx === hd.size) return flatMapOutput_(tl, this.fun);
            try {
              return new Bind(this.fun(hd['!!'](idx)), t => {
                switch (t.tag) {
                  case 'succeed':
                    return go(idx + 1);
                  case 'fail':
                    return t;
                }
              });
            } catch (error) {
              return new Fail(error as Error);
            }
          };

          return go(0);
        };

        done = () => go(translation, runner, this.cont(P.unit));

        fail = (e: Error) => go(translation, runner, this.cont(new Fail(e)));

        out = (hd: Chunk<Y>, tl: Pull<G, Y, void>) =>
          go(translation, runner, new Bind(this.unconsed(hd, tl), this.cont));
      }

      const v = viewL(stream);
      switch (v.tag) {
        case 'translate': {
          const composed: FunctionK<AnyK, F> = a => translation(v.nt(a));
          const runner: Run<AnyK, X, Kind<F, [End]>> = new TranslateRun(
            v.nt,
            cont,
          );
          return go(composed, runner, v.self);
        }

        case 'output':
          return runner.out(v.values, cont(P.unit));

        case 'flatMapOutput':
          return F.flatMap_(F.unit, () =>
            go(translation, new FlatMapRun(cont, v.fun), v.self),
          );

        case 'uncons': {
          const u = v;
          const c = cont;
          return pipe(
            F.unit,
            F.flatMap(() =>
              go<G, X, CallRun<G, X, Kind<F, [End]>>>(
                translation,
                new BuildRun<G, unknown, End>(),
                u.self,
              ),
            ),
            F.attempt,
            F.flatMap(ea =>
              ea.fold(
                e => go(translation, runner, c(new Fail(e))),
                f => f(new UnconsRun(c)),
              ),
            ),
          );
        }

        case 'eval':
          return pipe(
            translation(v.value),
            F.attempt,
            F.flatMap(ea =>
              ea.fold(
                e => go(translation, runner, cont(new Fail(e))),
                r => go(translation, runner, cont(new Succeed(r))),
              ),
            ),
          );

        case 'succeed':
          return runner.done();

        case 'fail':
          return runner.fail(v.error);
      }
    };

    const initFk: FunctionK<F, F> = id;

    class OuterRun implements Run<F, O, Kind<F, [B]>> {
      public constructor(private readonly acc: B) {}

      done = (): Kind<F, [B]> => F.pure(this.acc);

      fail = (e: Error) => F.throwError(e);

      out = (hd: Chunk<O>, tl: Pull<F, O, void>): Kind<F, [B]> => {
        try {
          return go<F, O, B>(initFk, new OuterRun(foldChunk(this.acc, hd)), tl);
        } catch (error) {
          // Fix
          return F.throwError(error as Error);
        }
      };
    }

    return go(initFk, new OuterRun(init), stream);
  };
