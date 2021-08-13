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

  private stack: Stack = [];
  private conts: IOA.Continuation[] = [];
  private cxts: ExecutionContext[] = [];

  private finalizers: IO.IO<unknown>[] = [];
  private callbacks: ((oc: O.Outcome<A>) => void)[] = [];

  private resumeIO: IO.IO<unknown>;
  private currentEC: ExecutionContext;

  private readonly autoSuspendThreshold: number =
    PlatformConfig.AUTO_SUSPEND_THRESHOLD;

  public constructor(startIO: IO.IO<A>, startEC: ExecutionContext) {
    this.resumeIO = startIO;
    this.currentEC = startEC;
    this.cxts.push(startEC);
  }

  public get join(): IO.IO<O.Outcome<A>> {
    return this._join;
  }

  public get cancel(): IO.IO<void> {
    return this._cancel;
  }

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
        // Possible race condition with resumeIO overwrite when auto suspend
        // and async callback completion?
        this.resumeIO = _cur;
        return this.schedule(this, this.currentEC);
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

        case 'attempt':
          this.conts.push(IOA.Continuation.AttemptK);
          _cur = cur.ioa;
          continue;

        case 'currentTimeMillis':
          _cur = IO.pure(this.currentEC.currentTimeMillis());
          continue;

        case 'readEC':
          _cur = IO.pure(this.currentEC);
          continue;

        case 'fork': {
          const fiber = new IOFiber(cur.ioa, this.currentEC);
          this.schedule(fiber, this.currentEC);
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
          let receivedResult = false;

          const cb: (ea: E.Either<Error, unknown>) => void = ea => {
            if (receivedResult) return;
            receivedResult = true;

            // Ensure to insert an async boundary to break execution from
            // other fibers
            this.resume(() => {
              // If we have not been canceled while suspended, or the task is
              // uncancelable, continue with the execution
              if (prevFinalizing === this.finalizing) {
                if (!this.shouldFinalize()) {
                  const next = E.fold_(ea, IO.throwError, IO.pure);
                  this.resumeIO = next;
                  this.schedule(this, this.currentEC);
                } else {
                  // Otherwise, we've been canceled and we should cancel
                  // ourselves asynchronously
                  this.cancelAsync();
                }
              }
              // We were canceled while suspended, so just drop the callback
              // result
            });
          };

          const next = IO.uncancelable<A>(poll =>
            pipe(
              cur.body(cb),
              IO.flatMap(fin =>
                // Ensure to attach the finalizer if returned
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
          // Prevent nested invocations from unmasking the loop more that once
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
              const fiberA = new IOFiber(ioa, this.currentEC);
              const fiberB = new IOFiber(iob, this.currentEC);

              fiberA.onComplete(oc => cb(E.right(E.left([oc, fiberB]))));
              fiberB.onComplete(oc => cb(E.right(E.right([fiberA, oc]))));

              this.schedule(fiberA, this.currentEC);
              this.schedule(fiberB, this.currentEC);

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
          const next = IO.async<void>(resume =>
            IO.delay(() => {
              const cancel = this.currentEC.sleep(ms, () =>
                resume(E.rightUnit),
              );
              return IO.delay(cancel);
            }),
          );

          _cur = next;
          continue;
        }

        case 'executeOn': {
          const ec = cur.ec;

          if (ec === this.currentEC) {
            // If we're already on the target execution context,
            // skip the re-scheduling and just continue
            _cur = cur.ioa;
            continue;
          }

          this.resumeIO = cur.ioa;
          this.currentEC = ec;
          this.cxts.push(ec);
          this.conts.push(IOA.Continuation.RunOnK);
          this.schedule(this, ec);

          _cur = IOA.Suspend;
          continue;
        }

        case 'suspend':
          return;

        case 'IOEndFiber':
          throw new Error('Uncaught end of fiber');
      }
    }
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

      return this.isUnmasked()
        ? IO.async<void>(cb => IO.delay(() => this.cancelAsync(cb)))
        : IO.map_(this.join, () => undefined);
    }),
  );

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
      this.currentEC.reportFailure(e as Error);
    }

    this.cxts = [];
    this.stack = [];
    this.conts = [];
    this.callbacks = [];
    this.finalizers = [];
    this.masks = 0;
    this.currentEC = undefined as any;
    this.resumeIO = IOA.IOEndFiber;
  }

  private schedule(f: IOFiber<unknown>, ec: ExecutionContext): void {
    ec.executeAsync(() => f.run());
  }

  private resume(cont: () => void): void {
    this.currentEC.executeAsync(cont);
  }

  private shouldFinalize(): boolean {
    return this.canceled && !this.masks;
  }

  private isUnmasked(): boolean {
    return !this.masks;
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
            // return this.failed(e as Error);
            return IO.throwError(e as Error);
          }

        case IOA.Continuation.FlatMapK:
          return this.flatMapK(r);

        case IOA.Continuation.HandleErrorWithK:
          this.stack.pop(); // Skip over error handlers
          continue;

        case IOA.Continuation.AttemptK:
          r = E.right(r);
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

        case IOA.Continuation.RunOnK:
          return this.runOnK();

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

        case IOA.Continuation.AttemptK:
          // return this.succeeded(E.left(e));
          return IO.pure(E.left(e)); // lack of tco

        case IOA.Continuation.OnCancelK:
          this.onCancelK();
          continue;

        case IOA.Continuation.UncancelableK:
          this.uncancelableK();
          continue;

        case IOA.Continuation.UnmaskK:
          this.unmaskK();
          continue;

        case IOA.Continuation.RunOnK:
          return this.runOnK();

        case IOA.Continuation.CancelationLoopK:
          return this.cancelationLoopFailureK(e);
      }
    }
  }

  private terminateSuccessK(r: unknown): IO.IO<unknown> {
    this.complete(O.success(r));
    return IOA.IOEndFiber;
  }

  private terminateFailureK(e: Error): IO.IO<unknown> {
    this.currentEC.reportFailure(e);
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

  private runOnK(): IO.IO<unknown> {
    const prevEC = this.cxts.pop()!;
    this.currentEC = prevEC;
    this.schedule(this, prevEC);
    return IOA.IOEndFiber;
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

  private cancelationLoopFailureK(e: Error): IO.IO<unknown> {
    this.currentEC.reportFailure(e);
    return this.cancelationLoopSuccessK();
  }
}
