// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow, id } from '@fp4ts/core';
import { Either, Left, Monad, Right, Some } from '@fp4ts/cats';
import { ExecutionContext, Fiber, Poll } from '@fp4ts/effect-kernel';

import {
  IO,
  IOContGet,
  IOF,
  IOView,
  IOEndFiber,
  UnmaskRunLoop,
  ContState,
  ContStatePhase,
} from './io';

import {
  AttemptK,
  CancelationLoopK,
  Continuation,
  FlatMapK,
  HandleErrorWithK,
  MapK,
  OnCancelK,
  RunOnK,
  UncancelableK,
  UnmaskK,
} from './internal/io-constants';
import { IORuntime } from './unsafe/io-runtime';
import { IOOutcome } from './io-outcome';
import { TracingEvent, RingBuffer, Tracing } from './tracing';

type Frame = (r: unknown) => unknown;
type Stack = Frame[];

type ContResult =
  | { tag: 'success'; value: unknown }
  | { tag: 'failure'; error: Error };

export class IOFiber<A> extends Fiber<IOF, Error, A> {
  private outcome?: IOOutcome<A>;
  private canceled: boolean = false;
  private finalizing: boolean = false;
  private masks: number = 0;

  private stack: Stack = [];
  private conts: Continuation[] = [];
  private cxts: ExecutionContext[] = [];

  private finalizers: IO<unknown>[] = [];
  private callbacks: ((oc: IOOutcome<A>) => void)[] = [];

  private resumeIO: IO<unknown>;
  private currentEC: ExecutionContext;

  private readonly autoSuspendThreshold: number;

  private readonly runtime: IORuntime;

  private trace: RingBuffer;

  public constructor(
    startIO: IO<A>,
    startEC: ExecutionContext,
    runtime: IORuntime,
  ) {
    super();
    this.resumeIO = startIO;
    this.currentEC = startEC;
    this.cxts.push(startEC);
    this.runtime = runtime;

    this.autoSuspendThreshold = this.runtime.config.autoSuspendThreshold;
    this.trace = new RingBuffer(this.runtime.config.traceBufferSize);
  }

  public get join(): IO<IOOutcome<A>> {
    return this._join;
  }

  public override joinWithNever(): IO<A> {
    return super.joinWithNever(IO.Spawn);
  }

  public get cancel(): IO<void> {
    return this._cancel;
  }

  public run(): void {
    const cur = this.resumeIO;
    this.resumeIO = null as any;
    this.runLoop(cur);
  }

  public onComplete(cb: (oc: IOOutcome<A>) => void): void {
    this.outcome ? cb(this.outcome) : this.callbacks.push(cb);
  }

  private runLoop(_cur: IO<unknown>): void {
    let nextAutoSuspend = this.autoSuspendThreshold;

    while (true) {
      if (_cur === IOEndFiber) {
        return;
      } else if (this.shouldFinalize()) {
        return this.cancelAsync();
      } else if (nextAutoSuspend-- <= 0) {
        // Possible race condition with resumeIO overwrite when auto suspend
        // and async callback completion?
        this.resumeIO = _cur;
        return this.schedule(this, this.currentEC);
      }

      const cur = _cur as IOView<unknown>;
      switch (cur.tag) {
        // Pure
        case 0:
          this.pushTracingEvent(cur.event);
          _cur = this.succeeded(cur.value);
          continue;

        // Fail
        case 1:
          _cur = this.failed(cur.error);
          continue;

        // Delay
        case 2:
          try {
            this.pushTracingEvent(cur.event);
            _cur = IO.pure(cur.thunk());
          } catch (e) {
            _cur = IO.throwError(e as Error);
          }
          continue;

        // Defer
        case 3:
          try {
            this.pushTracingEvent(cur.event);
            _cur = cur.thunk();
          } catch (e) {
            _cur = IO.throwError(e as Error);
          }
          continue;

        // Realtime
        case 4:
          _cur = IO.pure(this.currentEC.currentTimeMicros());
          continue;

        // Monotonic
        case 5:
          _cur = IO.pure(this.currentEC.currentTimeMillis());
          continue;

        // ReadEC
        case 6:
          _cur = IO.pure(this.currentEC);
          continue;

        // Map
        case 7:
          this.stack.push(cur.f);
          this.conts.push(MapK);
          this.pushTracingEvent(cur.event);
          _cur = cur.ioe;
          continue;

        // FlatMap
        case 8:
          this.stack.push(cur.f);
          this.conts.push(FlatMapK);
          this.pushTracingEvent(cur.event);
          _cur = cur.ioe;
          continue;

        // HandleErrorWith
        case 9:
          this.stack.push(cur.f as (u: unknown) => unknown);
          this.conts.push(HandleErrorWithK);
          this.pushTracingEvent(cur.event);
          _cur = cur.ioa;
          continue;

        // Attempt
        case 10:
          this.conts.push(AttemptK);
          _cur = cur.ioa;
          continue;

        // Fork
        case 11: {
          const fiber = new IOFiber(cur.ioa, this.currentEC, this.runtime);
          this.schedule(fiber, this.currentEC);
          _cur = IO.pure(fiber);
          continue;
        }

        case 12:
          this.finalizers.push(cur.fin);
          this.conts.push(OnCancelK);
          _cur = cur.ioa;
          continue;

        case 13:
          this.canceled = true;
          _cur = IO.pure(undefined);
          continue;

        case 14: {
          const body = cur.body;
          this.pushTracingEvent(cur.event);

          const state = new ContState(this.finalizing);

          const cb = (ea: Either<Error, unknown>): void => {
            const resume = () => {
              // If we have not been canceled while suspended, or the task is
              // uncancelable, continue with the execution
              if (state.wasFinalizing === this.finalizing) {
                if (!this.shouldFinalize()) {
                  const next = ea.fold(IO.throwError, IO.pure);
                  this.resumeIO = next;
                  return this.schedule(this, this.currentEC);
                } else {
                  // Otherwise, we've been canceled and we should cancel
                  // ourselves asynchronously
                  return this.cancelAsync();
                }
                // We were canceled while suspended, so just drop the callback
                // result
              }
            };

            const wasInPhase = state.phase;
            state.result = ea;
            state.phase = ContStatePhase.Result;
            if (wasInPhase === ContStatePhase.Waiting) {
              resume();
            }
          };

          const get: IO<unknown> = new IOContGet(state);

          const next = body(IO.MonadCancel)(cb, get, id);

          _cur = next;
          continue;
        }

        case 15: {
          const state = cur.state;

          const fin = IO(() => {
            if (state.phase === ContStatePhase.Waiting)
              state.phase = ContStatePhase.Initial;
          });

          this.finalizers.push(fin);
          this.conts.push(OnCancelK);

          if (state.phase === ContStatePhase.Initial) {
            state.phase = ContStatePhase.Waiting;

            state.wasFinalizing = this.finalizing;

            if (this.shouldFinalize()) {
              this.cancelAsync();
            }
          } else {
            const loop = () => {
              if (state.phase !== ContStatePhase.Result)
                return this.resume(loop);

              if (!this.shouldFinalize()) {
                const result = state.result!;
                const next = result.fold(IO.throwError, IO.pure);
                this.resumeIO = next;
                this.schedule(this, this.currentEC);
              } else if (this.outcome == null) {
                this.cancelAsync();
              }
            };
            loop();
          }
          return;
        }

        case 16: {
          this.pushTracingEvent(cur.event);

          this.masks += 1;
          const id = this.masks;

          const poll: Poll<IOF> = iob => new UnmaskRunLoop(iob, id, this);

          this.conts.push(UncancelableK);
          _cur = cur.body(poll);
          continue;
        }

        case 17:
          // Prevent nested invocations from unmasking the loop more that once
          // and unmasking different fibers
          if (this.masks === cur.id && this === cur.fiber) {
            this.masks -= 1;
            this.conts.push(UnmaskK);
          }
          _cur = cur.ioa;
          continue;

        case 18: {
          const { ioa, iob } = cur;

          const next = IO.async<
            Either<
              [IOOutcome<unknown>, IOFiber<unknown>],
              [IOFiber<unknown>, IOOutcome<unknown>]
            >
          >(cb =>
            IO(() => {
              const fiberA = new IOFiber(ioa, this.currentEC, this.runtime);
              const fiberB = new IOFiber(iob, this.currentEC, this.runtime);

              fiberA.onComplete(oc => cb(Right(Left([oc, fiberB]))));
              fiberB.onComplete(oc => cb(Right(Right([fiberA, oc]))));

              this.schedule(fiberA, this.currentEC);
              this.schedule(fiberB, this.currentEC);

              const cancel = Monad.Do(IO.Monad)(function* (_) {
                const cancelA = yield* _(fiberA.cancel.fork);
                const cancelB = yield* _(fiberB.cancel.fork);
                yield* _(cancelA.join);
                yield* _(cancelB.join);
              }).void;

              return Some(cancel);
            }),
          );

          _cur = next;
          continue;
        }

        case 19: {
          const ms = cur.ms;
          const next = IO.async<void>(resume =>
            IO(() => {
              const cancel = this.currentEC.sleep(ms, () =>
                resume(Either.rightUnit),
              );
              return Some(IO(cancel));
            }),
          );

          _cur = next;
          continue;
        }

        case 20: {
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
          this.conts.push(RunOnK);
          this.schedule(this, ec);

          return;
        }

        case 21:
          this.resumeIO = IO.pure(undefined);
          this.schedule(this, this.currentEC);
          return;

        case 22:
          throw new Error('Uncaught end of fiber');
      }
    }
  }

  private _join: IO<IOOutcome<A>> = IO.async(cb =>
    IO(() => {
      const listener: (oc: IOOutcome<A>) => void = flow(Right, cb);
      const cancel = IO(() => {
        this.callbacks = this.callbacks.filter(l => l !== listener);
      });

      this.onComplete(listener);
      return Some(cancel);
    }),
  );

  private _cancel: IO<void> = IO.uncancelable(() =>
    IO.defer(() => {
      this.canceled = true;

      return this.isUnmasked()
        ? IO.async_(cb => this.cancelAsync(cb))
        : this.join.void;
    }),
  );

  private cancelAsync(cb?: (ea: Either<Error, void>) => void): void {
    this.finalizing = true;

    if (this.finalizers.length) {
      this.conts = [CancelationLoopK];
      this.stack = cb ? [cb as (u: unknown) => unknown] : [];

      // do not allow further cancelations
      this.masks += 1;
      this.runLoop(this.finalizers.pop()!);
    } else {
      cb && cb(Either.rightUnit);
      this.complete(IOOutcome.canceled());
    }
  }

  private complete(oc: IOOutcome<A>): void {
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
    this.trace.invalidate();
    this.currentEC = undefined as any;
    this.resumeIO = IOEndFiber;
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

  private pushTracingEvent(e?: TracingEvent): void {
    e && this.trace.push(e);
  }

  // -- Continuations

  private succeeded(r: unknown): IO<unknown> {
    return this.continue({ tag: 'success', value: r });
  }

  private failed(e: Error): IO<unknown> {
    return this.continue({ tag: 'failure', error: e });
  }

  private continue(cr: ContResult): IO<unknown> {
    loop: while (true) {
      if (cr.tag === 'success') {
        let r = cr.value;

        while (true) {
          const nextCont = this.conts.pop();
          if (nextCont === undefined) return this.terminateSuccessK(r);
          switch (nextCont) {
            case 0:
              try {
                const f = this.stack.pop()!;
                r = f(r);
                continue;
              } catch (e) {
                cr = { tag: 'failure', error: e as Error };
                continue loop;
              }

            case 1:
              return this.flatMapK(r);

            case 2:
              this.stack.pop(); // Skip over error handlers
              continue;

            case 3:
              r = Right(r);
              continue;

            case 4:
              this.onCancelK();
              continue;

            case 5:
              this.uncancelableK();
              continue;

            case 6:
              this.unmaskK();
              continue;

            case 7:
              return this.executeOnSuccessK(r);

            case 8:
              return this.cancelationLoopSuccessK();
          }
        }
      } else {
        let e = cr.error;
        Tracing.augmentError(e, this.trace.toArray);

        while (true) {
          const nextCont = this.conts.pop();
          if (nextCont === undefined) return this.terminateFailureK(e);
          switch (nextCont) {
            case 0:
            case 1:
              this.stack.pop(); // skip over success transformers
              continue;

            case 2:
              try {
                const f = this.stack.pop()! as (e: Error) => IO<unknown>;
                return f(e);
              } catch (e2) {
                e = e2 as Error;
                Tracing.augmentError(e, this.trace.toArray);
                continue;
              }

            case 3:
              cr = { tag: 'success', value: Left(e) };
              continue loop;

            case 4:
              this.onCancelK();
              continue;

            case 5:
              this.uncancelableK();
              continue;

            case 6:
              this.unmaskK();
              continue;

            case 7:
              return this.executeOnFailureK(e);

            case 8:
              return this.cancelationLoopFailureK(e);
          }
        }
      }
    }
  }

  private terminateSuccessK(r: unknown): IO<unknown> {
    if (this.canceled) {
      this.complete(IOOutcome.canceled());
    } else {
      this.complete(IOOutcome.success(IO.pure(r as A)));
    }
    return IOEndFiber;
  }

  private terminateFailureK(e: Error): IO<unknown> {
    this.currentEC.reportFailure(e);
    if (this.canceled) {
      this.complete(IOOutcome.canceled());
    } else {
      this.complete(IOOutcome.failure(e));
    }
    return IOEndFiber;
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

  private executeOnSuccessK(r: unknown): IO<unknown> {
    const prevEC = this.cxts.pop()!;
    this.currentEC = prevEC;
    this.resumeIO = IO.pure(r);
    this.schedule(this, prevEC);
    return IOEndFiber;
  }

  private executeOnFailureK(e: Error): IO<unknown> {
    const prevEC = this.cxts.pop()!;
    this.currentEC = prevEC;
    this.resumeIO = IO.throwError(e);
    this.schedule(this, prevEC);
    return IOEndFiber;
  }

  private cancelationLoopSuccessK(): IO<unknown> {
    const fin = this.finalizers.pop();
    if (fin) {
      this.conts.push(CancelationLoopK);
      return fin;
    }

    const cb = this.stack.pop() as
      | ((ea: Either<Error, void>) => void)
      | undefined;
    cb && cb(Either.rightUnit);

    this.complete(IOOutcome.canceled());

    return IOEndFiber;
  }

  private cancelationLoopFailureK(e: Error): IO<unknown> {
    this.currentEC.reportFailure(e);
    return this.cancelationLoopSuccessK();
  }
}
