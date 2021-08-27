import { flow, pipe } from '../fp/core';
import * as E from '../fp/either';

import { IO } from './io';
import { ExecutionContext } from './execution-context';

import * as O from './kernel/outcome';
import * as F from './kernel/fiber';
import { Poll } from './kernel/poll';

import * as IOA from './io/algebra';
import { IORuntime } from './unsafe/io-runtime';

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

  private finalizers: IO<unknown>[] = [];
  private callbacks: ((oc: O.Outcome<A>) => void)[] = [];

  private resumeIO: IO<unknown>;
  private currentEC: ExecutionContext;

  private readonly autoSuspendThreshold: number;

  private readonly runtime: IORuntime;

  public constructor(
    startIO: IO<A>,
    startEC: ExecutionContext,
    runtime: IORuntime,
  ) {
    this.resumeIO = startIO;
    this.currentEC = startEC;
    this.cxts.push(startEC);
    this.runtime = runtime;

    this.autoSuspendThreshold = this.runtime.config.autoSuspendThreshold;
  }

  public get join(): IO<O.Outcome<A>> {
    return this._join;
  }

  public joinWith = <B>(onCancel: IO<B>): IO<A | B> =>
    this.join.flatMap(
      O.fold<A, IO<A | B>>(() => onCancel, IO.throwError, IO.pure),
    );

  public get joinWithNever(): IO<A> {
    return this.joinWith(IO.never);
  }

  public get cancel(): IO<void> {
    return this._cancel;
  }

  public run(): void {
    const cur = this.resumeIO;
    this.resumeIO = null as any;
    this.runLoop(cur);
  }

  public onComplete(cb: (oc: O.Outcome<A>) => void): void {
    this.outcome ? cb(this.outcome) : this.callbacks.push(cb);
  }

  private runLoop(_cur: IO<unknown>): void {
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

        case 'defer':
          try {
            _cur = cur.thunk();
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
          const fiber = new IOFiber(cur.ioa, this.currentEC, this.runtime);
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
            // Drop the callback if we have been completed while suspended
            if (this.outcome != null) return;

            // Ensure to insert an async boundary to break execution from
            // other fibers
            this.resume(() => {
              // If we have not been canceled while suspended, or the task is
              // uncancelable, continue with the execution
              if (prevFinalizing === this.finalizing) {
                if (!this.shouldFinalize()) {
                  const next = E.fold_(ea, IO.throwError, IO.pure);
                  this.resumeIO = next;
                  return this.schedule(this, this.currentEC);
                } else {
                  // Otherwise, we've been canceled and we should cancel
                  // ourselves asynchronously
                  return this.cancelAsync();
                }
              }
              // We were canceled while suspended, so just drop the callback
              // result
            });
          };

          const next = IO.uncancelable<A>(poll =>
            cur.body(cb).flatMap(fin =>
              // Ensure to attach the finalizer if returned
              fin ? poll(IOA.Suspend).onCancel(fin) : poll(IOA.Suspend),
            ),
          );

          _cur = next;
          continue;
        }

        case 'uncancelable': {
          this.masks += 1;
          const id = this.masks;

          const poll: Poll = iob => new IOA.UnmaskRunLoop(iob, id, this);

          this.conts.push(IOA.Continuation.UncancelableK);
          _cur = cur.body(poll);
          continue;
        }

        case 'unmaskRunLoop':
          // Prevent nested invocations from unmasking the loop more that once
          // and unmasking different fibers
          if (this.masks === cur.id && this === cur.fiber) {
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
            IO(() => {
              const fiberA = new IOFiber(ioa, this.currentEC, this.runtime);
              const fiberB = new IOFiber(iob, this.currentEC, this.runtime);

              fiberA.onComplete(oc => cb(E.right(E.left([oc, fiberB]))));
              fiberB.onComplete(oc => cb(E.right(E.right([fiberA, oc]))));

              this.schedule(fiberA, this.currentEC);
              this.schedule(fiberB, this.currentEC);

              const cancel = pipe(
                IO.Do,
                IO.bindTo('cancelA', fiberA.cancel.fork),
                IO.bindTo('cancelB', fiberB.cancel.fork),
                IO.bind(({ cancelA }) => cancelA.join),
                IO.bind(({ cancelB }) => cancelB.join),
              ).void;

              return cancel;
            }),
          );

          _cur = next;
          continue;
        }

        case 'sleep': {
          const ms = cur.ms;
          const next = IO.async<void>(resume =>
            IO(() => {
              const cancel = this.currentEC.sleep(ms, () =>
                resume(E.rightUnit),
              );
              return IO(cancel);
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

  private _join: IO<O.Outcome<A>> = IO.async(cb =>
    IO(() => {
      const listener: (oc: O.Outcome<A>) => void = flow(E.right, cb);
      const cancel = IO(() => {
        this.callbacks = this.callbacks.filter(l => l !== listener);
      });

      this.onComplete(listener);
      return cancel;
    }),
  );

  private _cancel: IO<void> = IO.uncancelable(() =>
    IO.defer(() => {
      this.canceled = true;

      return this.isUnmasked()
        ? IO.async<void>(cb => IO(() => this.cancelAsync(cb)))
        : this.join.void;
    }),
  );

  private cancelAsync(cb?: (ea: E.Either<Error, void>) => void): void {
    this.finalizing = true;

    if (this.finalizers.length) {
      this.conts = [IOA.Continuation.CancelationLoopK];
      this.stack = cb ? [cb as (u: unknown) => unknown] : [];

      // do not allow further cancelations
      this.masks += 1;
      this.runLoop(this.finalizers.pop()!);
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
    return this.canceled && this.isUnmasked();
  }

  private isUnmasked(): boolean {
    return !this.masks;
  }

  // -- Continuations

  private succeeded(r: unknown): IO<unknown> {
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

  private failed(e: Error): IO<unknown> {
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
            const f = this.stack.pop()! as (e: Error) => IO<unknown>;
            return f(e);
          } catch (e2) {
            e = e2 as Error;
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

  private terminateSuccessK(r: unknown): IO<unknown> {
    if (this.canceled) {
      this.complete(O.canceled);
    } else {
      this.complete(O.success(r));
    }
    return IOA.IOEndFiber;
  }

  private terminateFailureK(e: Error): IO<unknown> {
    this.currentEC.reportFailure(e);
    if (this.canceled) {
      this.complete(O.canceled);
    } else {
      this.complete(O.failure(e));
    }
    return IOA.IOEndFiber;
  }

  private flatMapK(r: unknown): IO<unknown> {
    const f = this.stack.pop()! as (u: unknown) => IO<unknown>;
    try {
      return f(r);
    } catch (e) {
      return this.failed(e as Error);
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

  private runOnK(): IO<unknown> {
    const prevEC = this.cxts.pop()!;
    this.currentEC = prevEC;
    this.schedule(this, prevEC);
    return IOA.IOEndFiber;
  }

  private cancelationLoopSuccessK(): IO<unknown> {
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

  private cancelationLoopFailureK(e: Error): IO<unknown> {
    this.currentEC.reportFailure(e);
    return this.cancelationLoopSuccessK();
  }
}
