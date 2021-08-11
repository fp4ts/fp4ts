import { flow, pipe } from '../fp/core';
import * as E from '../fp/either';
import * as IO from './io';
import * as O from './outcome';
import * as F from './fiber';
import { Poll } from './poll';

import * as IOA from './algebra';
import { PlatformConfig } from './io-platform';
import { ExecutionContext } from './execution-context';

type Frame = (r: unknown) => unknown;
type Stack = Frame[];

export class IOFiber<A> implements F.Fiber<A> {
  private outcome?: O.Outcome<A>;
  private canceled: boolean = false;
  private finalizing: boolean = false;

  private masks: number = 0;
  private callbacks: ((oc: O.Outcome<A>) => void)[] = [];
  private stack: Stack = [];
  private finalizers: IO.IO<unknown>[] = [];

  private conts: IOA.Continuation[] = [];

  private resumeIO: IO.IO<unknown>;

  private static ID: number = 0;
  private readonly ID: number = ++IOFiber.ID;
  private readonly autoSuspendThreshold: number =
    PlatformConfig.AUTO_SUSPEND_THRESHOLD;

  public constructor(startIO: IO.IO<A>, private ec: ExecutionContext) {
    this.resumeIO = startIO;
  }

  public get join(): IO.IO<O.Outcome<A>> {
    return this._join;
  }

  public get cancel(): IO.IO<void> {
    return this._cancel;
  }

  private _join: IO.IO<O.Outcome<A>> = IO.async(cb =>
    IO.delay(() => {
      const listener: (oc: O.Outcome<A>) => void = flow(E.right, cb);
      const cancel = IO.delay(() => {
        this.callbacks = this.callbacks.filter(l => l !== listener);
      });

      this.onComplete(listener);
      return cancel;
    }),
  );

  private _cancel: IO.IO<void> = IO.uncancelable(() =>
    IO.defer(() => {
      this.canceled = true;

      return !this.masks
        ? IO.async<void>(cb => IO.delay(() => this.cancelAsync(cb)))
        : IO.map_(this.join, () => undefined);
    }),
  );

  public run(): void {
    this.runLoop(this.resumeIO);
  }

  public onComplete(cb: (oc: O.Outcome<A>) => void): void {
    this.outcome ? cb(this.outcome) : this.callbacks.push(cb);
  }

  private runLoop(_cur: IO.IO<unknown>): void {
    let nextAutoSuspend = this.autoSuspendThreshold;

    while (true) {
      if (_cur === IOA.IOEndFiber) {
        return;
      } else if (this.shouldFinalize()) {
        return this.cancelAsync();
      } else if (nextAutoSuspend-- <= 0) {
        this.resumeIO = _cur;
        return this.schedule(this, this.ec);
      }

      const cur = IOA.view(_cur);
      switch (cur.tag) {
        case 'pure':
          _cur = this.succeeded(cur.value);
          continue;

        case 'fail':
          _cur = this.failed(cur.error);
          continue;

        case 'delay':
          try {
            _cur = IO.pure(cur.thunk());
          } catch (e) {
            _cur = IO.throwError(e as Error);
          }
          continue;

        case 'map':
          this.stack.push(cur.f);
          this.conts.push(IOA.Continuation.MapK);
          _cur = cur.ioe;
          continue;

        case 'flatMap':
          this.stack.push(cur.f);
          this.conts.push(IOA.Continuation.FlatMapK);
          _cur = cur.ioe;
          continue;

        case 'handleErrorWith':
          this.stack.push(cur.f as (u: unknown) => unknown);
          this.conts.push(IOA.Continuation.HandleErrorWithK);
          _cur = cur.ioa;
          continue;

        case 'currentTimeMillis':
          _cur = IO.pure(this.ec.currentTimeMillis());
          continue;

        case 'fork': {
          const fiber = new IOFiber(cur.ioa, this.ec);
          this.schedule(fiber, this.ec);
          _cur = IO.pure(fiber);
          continue;
        }

        case 'onCancel':
          this.finalizers.push(cur.fin);
          this.conts.push(IOA.Continuation.OnCancelK);
          _cur = cur.ioa;
          continue;

        case 'canceled':
          this.canceled = true;
          _cur = IO.pure(undefined);
          continue;

        case 'async': {
          const prevFinalizing = this.finalizing;

          const cb: (ea: E.Either<Error, unknown>) => void = ea =>
            this.resume(() => {
              // If we have not been canceled while suspended, or the task is
              // uncancelable, continue with the execution
              if (prevFinalizing === this.finalizing) {
                if (!this.shouldFinalize()) {
                  const next = E.fold_(ea, IO.throwError, IO.pure);
                  this.resumeIO = next;
                  this.schedule(this, this.ec);
                } else {
                  // Otherwise, we've been canceled and we should cancel
                  // ourselves asynchronously
                  this.cancelAsync();
                }
              }
              // We were canceled while suspended, so just drop the callback
              // result
            });

          const next = IO.uncancelable<A>(poll =>
            pipe(
              cur.body(cb),
              IO.flatMap(fin =>
                fin ? IO.onCancel_(poll(IOA.Suspend), fin) : poll(IOA.Suspend),
              ),
            ),
          );

          _cur = next;
          continue;
        }

        case 'uncancelable': {
          this.masks += 1;
          const id = this.masks;

          const poll: Poll = iob => new IOA.UnmaskRunLoop(iob, id);

          this.conts.push(IOA.Continuation.UncancelableK);
          _cur = cur.body(poll);
          continue;
        }

        case 'unmaskRunLoop':
          if (this.masks === cur.id) {
            this.masks -= 1;
            this.conts.push(IOA.Continuation.UnmaskK);
          }
          _cur = cur.ioa;
          continue;

        case 'racePair': {
          const { ioa, iob } = cur;

          const next = IO.async<
            E.Either<
              [O.Outcome<unknown>, IOFiber<unknown>],
              [IOFiber<unknown>, O.Outcome<unknown>]
            >
          >(cb =>
            IO.delay(() => {
              const fiberA = new IOFiber(ioa, this.ec);
              const fiberB = new IOFiber(iob, this.ec);

              fiberA.onComplete(oc => cb(E.right(E.left([oc, fiberB]))));
              fiberB.onComplete(oc => cb(E.right(E.right([fiberA, oc]))));

              this.ec.executeFiber(fiberA);
              this.ec.executeFiber(fiberB);

              const cancel = pipe(
                IO.Do,
                IO.bindTo('cancelA', () => pipe(fiberA.cancel, IO.fork)),
                IO.bindTo('cancelB', () => pipe(fiberB.cancel, IO.fork)),
                IO.bind(({ cancelA }) => cancelA.join),
                IO.bind(({ cancelB }) => cancelB.join),
                IO.map(() => undefined),
              );

              return cancel;
            }),
          );

          _cur = next;
          continue;
        }

        case 'sleep': {
          const ms = cur.ms;
          _cur = IO.async<void>(resume =>
            IO.delay(() => {
              const cancel = this.ec.sleep(ms, () => resume(E.rightUnit));
              return IO.delay(cancel);
            }),
          );
          continue;
        }

        case 'suspend':
          this.resumeIO = _cur;
          return;

        case 'IOEndFiber':
          throw new Error('Uncaught end fiber');
      }
    }
  }

  private cancelAsync(cb?: (ea: E.Either<Error, void>) => void): void {
    this.finalizing = true;

    if (this.finalizers.length) {
      this.conts = [IOA.Continuation.CancelationLoopK];
      this.stack = cb ? [cb as (u: unknown) => unknown] : [];

      // do not allow further cancelations
      this.masks += 1;
      const fin = this.finalizers.pop()!;
      this.runLoop(fin);
    } else {
      cb && cb(E.rightUnit);
      this.complete(O.canceled);
    }
  }

  private complete(oc: O.Outcome<A>): void {
    this._join = IO.pure(oc);
    this._cancel = IO.unit;
    this.outcome = oc;

    try {
      this.callbacks.forEach(cb => cb(oc));
    } catch (e) {
      console.log('SWALLOWING EXCEPTION', e);
    }

    this.stack = [];
    this.conts = [];
    this.callbacks = [];
    this.finalizers = [];
    this.masks = 0;
    this.resumeIO = IOA.IOEndFiber;
  }

  private schedule(f: IOFiber<unknown>, ec: ExecutionContext): void {
    ec.executeFiber(f);
  }

  private resume(cont: () => void): void {
    this.ec.executeAsync(cont);
  }

  private shouldFinalize(): boolean {
    return this.canceled && !this.masks;
  }

  // -- Continuations

  private succeeded(r: unknown): IO.IO<unknown> {
    while (true) {
      const nextCont = this.conts.pop();
      switch (nextCont) {
        case undefined:
          return this.terminateSuccessK(r);

        case IOA.Continuation.MapK:
          try {
            const f = this.stack.pop()!;
            r = f(r);
            continue;
          } catch (e) {
            return this.failed(e as Error);
          }

        case IOA.Continuation.FlatMapK:
          return this.flatMapK(r);

        case IOA.Continuation.HandleErrorWithK:
          this.stack.pop(); // Skip over error handlers
          continue;

        case IOA.Continuation.OnCancelK:
          this.onCancelK();
          continue;

        case IOA.Continuation.UncancelableK:
          this.uncancelableK();
          continue;

        case IOA.Continuation.UnmaskK:
          this.unmaskK();
          continue;

        case IOA.Continuation.CancelationLoopK:
          return this.cancelationLoopSuccessK();
      }
    }
  }

  private failed(e: Error): IO.IO<unknown> {
    while (true) {
      const nextCont = this.conts.pop();
      switch (nextCont) {
        case undefined:
          return this.terminateFailureK(e);

        case IOA.Continuation.MapK:
        case IOA.Continuation.FlatMapK:
          this.stack.pop(); // skip over success transformers
          continue;

        case IOA.Continuation.HandleErrorWithK:
          try {
            const f = this.stack.pop()! as (e: Error) => IO.IO<unknown>;
            return f(e);
          } catch (e2) {
            e = e2;
            continue;
          }

        case IOA.Continuation.OnCancelK:
          this.onCancelK();
          continue;

        case IOA.Continuation.UncancelableK:
          this.uncancelableK();
          continue;

        case IOA.Continuation.UnmaskK:
          this.unmaskK();
          continue;

        case IOA.Continuation.CancelationLoopK:
          return this.cancelationLoopFailureK();
      }
    }
  }

  private terminateSuccessK(r: unknown): IO.IO<unknown> {
    this.complete(O.success(r));
    return IOA.IOEndFiber;
  }

  private terminateFailureK(e: Error): IO.IO<unknown> {
    this.complete(O.failure(e));
    return IOA.IOEndFiber;
  }

  private flatMapK(r: unknown): IO.IO<unknown> {
    const f = this.stack.pop()! as (u: unknown) => IO.IO<unknown>;
    try {
      return f(r);
    } catch (e) {
      return this.failed(e);
    }
  }

  private onCancelK(): void {
    this.finalizers.pop();
  }

  private uncancelableK(): void {
    this.masks -= 1;
  }

  private unmaskK(): void {
    this.masks += 1;
  }

  private cancelationLoopSuccessK(): IO.IO<unknown> {
    const fin = this.finalizers.pop();
    if (fin) {
      this.conts.push(IOA.Continuation.CancelationLoopK);
      return fin;
    }

    const cb = this.stack.pop() as
      | ((ea: E.Either<Error, void>) => void)
      | undefined;
    cb && cb(E.rightUnit);

    this.complete(O.canceled);

    return IOA.IOEndFiber;
  }

  private cancelationLoopFailureK(): IO.IO<unknown> {
    return this.cancelationLoopSuccessK();
  }
}
