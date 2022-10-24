// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow, id } from '@fp4ts/core';
import { Either, Left, Right, Some } from '@fp4ts/cats';
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
  AsyncContinueCanceledR,
  AsyncContinueCanceledWithFinalizerR,
  AsyncContinueFailedR,
  AsyncContinueSuccessfulR,
  AttemptK,
  AutoSuspendR,
  CancelationLoopK,
  Continuation,
  DoneR,
  ExecR,
  FlatMapK,
  HandleErrorWithK,
  MapK,
  MaxStackSize,
  OnCancelK,
  ResumeTag,
  RunOnK,
  SuspendR,
  TerminateK,
  UncancelableK,
  UnmaskK,
} from './internal/io-constants';
import { IORuntime } from './unsafe/io-runtime';
import { IOOutcome } from './io-outcome';
import { TracingEvent, RingBuffer, Tracing } from './tracing';

type Stack = unknown[];

export class IOFiber<A> extends Fiber<IOF, Error, A> {
  private outcome?: IOOutcome<A>;
  private canceled: boolean = false;
  private finalizing: boolean = false;
  private masks: number = 0;
  private suspended: boolean = false;

  private stack!: Stack;
  private conts!: Continuation[];
  private finalizers: IO<unknown>[] = [];

  private callbacks: ((oc: IOOutcome<unknown>) => void)[] = [];

  private resumeTag: ResumeTag = ExecR;
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
    switch (this.resumeTag) {
      case 0:
        return this.execR();
      case 1:
        return this.asyncContinueSuccessfulR();
      case 2:
        return this.asyncContinueFailedR();
      case 3:
        return this.asyncContinueCanceledR();
      case 4:
        return this.asyncContinueCanceledWithFinalizerR();
      case 5:
        return this.suspendR();
      case 6:
        return this.autoSuspendR();
      case 7:
        return undefined;
    }
  }

  public onComplete<B>(this: IOFiber<B>, cb: (oc: IOOutcome<A>) => void): void {
    this.outcome
      ? cb(this.outcome as IOOutcome<any>)
      : this.callbacks.push(cb as (oc: IOOutcome<unknown>) => void);
  }

  private runLoop(_cur: IO<unknown>, nextAutoSuspend: number): void {
    while (true) {
      if ((_cur as any) === IOEndFiber) {
        return;
      } else if (this.shouldFinalize()) {
        _cur = this.prepareForCancelation(undefined);
        continue;
      } else if (nextAutoSuspend-- <= 0) {
        this.resumeIO = _cur;
        this.resumeTag = AutoSuspendR;
        this.schedule(this, this.currentEC);
        return;
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
            _cur = this.succeeded(cur.thunk());
          } catch (e) {
            _cur = this.failed(e as Error);
          }
          continue;

        // Realtime
        case 3:
          _cur = this.succeeded(this.currentEC.currentTimeMicros());
          continue;

        // Monotonic
        case 4:
          _cur = this.succeeded(this.currentEC.currentTimeMillis());
          continue;

        // ReadEC
        case 5:
          _cur = this.succeeded(this.currentEC);
          continue;

        // Defer
        case 6:
          try {
            this.pushTracingEvent(cur.event);
            _cur = cur.thunk();
          } catch (e) {
            _cur = this.failed(e as Error);
          }
          continue;

        // Map
        case 7: {
          this.pushTracingEvent(cur.event);

          const ioe = cur.ioe as IOView<unknown>;
          const f = cur.f;

          const next = (u: unknown): IO<unknown> => {
            nextAutoSuspend--;
            try {
              return this.succeeded(f(u));
            } catch (e) {
              return this.failed(e as Error);
            }
          };

          switch (ioe.tag) {
            // Pure
            case 0:
              _cur = next(ioe.value);
              continue;

            // Fail
            case 1:
              _cur = this.failed(ioe.error);
              continue;

            // Delay
            case 2:
              nextAutoSuspend--;
              this.pushTracingEvent(ioe.event);
              try {
                _cur = this.succeeded(f(ioe.thunk()));
                continue;
              } catch (e) {
                _cur = this.failed(e as Error);
                continue;
              }

            // Realtime
            case 3:
              _cur = next(this.currentEC.currentTimeMicros());
              continue;

            // Monotonic
            case 4:
              _cur = next(this.currentEC.currentTimeMillis());
              continue;

            // ReadEC
            case 5:
              _cur = next(this.currentEC);
              continue;

            default:
              this.stack.push(f);
              this.conts.push(MapK);
              _cur = ioe;
              continue;
          }
        }

        // FlatMap
        case 8: {
          this.pushTracingEvent(cur.event);

          const ioe = cur.ioe as IOView<unknown>;
          const f = cur.f;

          const next = (u: unknown): IO<unknown> => {
            nextAutoSuspend--;
            try {
              return f(u);
            } catch (e) {
              return this.failed(e as Error);
            }
          };

          switch (ioe.tag) {
            // Pure
            case 0:
              _cur = next(ioe.value);
              continue;

            // Fail
            case 1:
              _cur = this.failed(ioe.error);
              continue;

            // Delay
            case 2:
              nextAutoSuspend--;
              this.pushTracingEvent(ioe.event);
              try {
                _cur = f(ioe.thunk());
                continue;
              } catch (e) {
                _cur = this.failed(e as Error);
                continue;
              }

            // Realtime
            case 3:
              _cur = next(this.currentEC.currentTimeMicros());
              continue;

            // Monotonic
            case 4:
              _cur = next(this.currentEC.currentTimeMillis());
              continue;

            // ReadEC
            case 5:
              _cur = next(this.currentEC);
              continue;

            default:
              this.stack.push(f);
              this.conts.push(FlatMapK);
              _cur = ioe;
              continue;
          }
        }

        // Attempt
        case 9: {
          const ioa = cur.ioa as IOView<unknown>;

          switch (ioa.tag) {
            // Pure
            case 0:
              nextAutoSuspend--;
              _cur = this.succeeded(Right(ioa.value));
              continue;

            // Fail
            case 1: {
              nextAutoSuspend--;
              const e = ioa.error;
              Tracing.augmentError(e, this.trace.toArray);
              _cur = this.succeeded(Left(e));
              continue;
            }

            // Delay
            case 2:
              nextAutoSuspend--;
              this.pushTracingEvent(ioa.event);
              try {
                _cur = this.succeeded(Right(ioa.thunk()));
                continue;
              } catch (e) {
                Tracing.augmentError(e as Error, this.trace.toArray);
                _cur = this.succeeded(Left(e));
                continue;
              }

            // Realtime
            case 3:
              nextAutoSuspend--;
              _cur = this.succeeded(Right(this.currentEC.currentTimeMicros()));
              continue;

            // Monotonic
            case 4:
              nextAutoSuspend--;
              _cur = this.succeeded(Right(this.currentEC.currentTimeMillis()));
              continue;

            // ReadEC
            case 5:
              nextAutoSuspend--;
              _cur = this.succeeded(Right(this.currentEC));
              continue;

            default:
              this.conts.push(AttemptK);
              _cur = ioa;
              continue;
          }
        }

        // HandleErrorWith
        case 10:
          this.stack.push(cur.f as (u: unknown) => unknown);
          this.conts.push(HandleErrorWithK);
          this.pushTracingEvent(cur.event);
          _cur = cur.ioa;
          continue;

        // Fork
        case 11: {
          const fiber = new IOFiber(cur.ioa, this.currentEC, this.runtime);
          this.schedule(fiber, this.currentEC);
          _cur = this.succeeded(fiber);
          continue;
        }

        case 12:
          this.finalizers.push(cur.fin);
          this.conts.push(OnCancelK);
          _cur = cur.ioa;
          continue;

        case 13:
          this.canceled = true;
          if (this.isUnmasked()) {
            _cur = this.prepareForCancelation(undefined);
          } else {
            _cur = this.succeeded(undefined);
          }
          continue;

        case 14: {
          const body = cur.body;
          this.pushTracingEvent(cur.event);

          const state = new ContState(this.finalizing);

          const cb = (ea: Either<Error, unknown>): void => {
            const loop = () => {
              // Try to take the ownership of the runloop
              if (this.resume()) {
                // Are we still in the same finalization stage?
                if (state.wasFinalizing === this.finalizing) {
                  // Were we canceled while suspended?
                  if (!this.shouldFinalize()) {
                    // We have not been canceled while suspended. Schedule
                    // fiber to continue execution with the result.
                    if (ea.isRight) {
                      this.stack.push(ea.get);
                      this.resumeTag = AsyncContinueSuccessfulR;
                    } else {
                      this.stack.push(ea.getLeft);
                      this.resumeTag = AsyncContinueFailedR;
                    }
                  } else {
                    // We were canceled while suspended
                    this.resumeTag = AsyncContinueCanceledR;
                  }
                  return this.schedule(this, this.currentEC);
                } else {
                  // We were canceled while suspended, then our finalizer
                  // suspended We should not own the runloop
                  this.suspend();
                }
              } else if (
                this.finalizing === state.wasFinalizing &&
                !this.shouldFinalize() &&
                this.outcome == null
              ) {
                // We're not canceled or completed, and we're in the same
                // finalization stage, wait on suspended for `get` to release
                // the runloop
                this.currentEC.executeAsync(loop);
              }

              // We're canceled, or completed, or in the process of finalizing
              // we were not before. Just drop the callback and let `cancel` or
              // `get` to pick up the runloop
            };

            const wasInPhase = state.phase;
            state.result = ea;
            state.phase = ContStatePhase.Result;
            if (wasInPhase === ContStatePhase.Waiting) {
              loop();
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

          switch (state.phase) {
            // We're in the initial stage, which means we've arrived here before
            // the async callback. We capture the current finalization stage and
            // wait for the callback to resume the execution while we suspend
            case ContStatePhase.Initial:
              state.phase = ContStatePhase.Waiting;
              state.wasFinalizing = this.finalizing;
              this.suspend();
              return;

            // This is an impossible state. We set our state to `Waiting` only
            // in case we've arrived here in which case we suspend
            case ContStatePhase.Waiting:
              throw new Error('Illegal state');

            // The callback finished before we got here, so we just use the
            // result and continue the execution without suspending
            case ContStatePhase.Result: {
              const result = state.result!;
              _cur = result.isRight
                ? this.succeeded(result.get)
                : this.failed(result.getLeft);
              continue;
            }
          }
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
          const ioa = cur.ioa;
          const iob = cur.iob;

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

              const cancel = IO.Monad.do(function* (_) {
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
          const next = IO.async<void>(cb =>
            IO(() => {
              const cancel = this.currentEC.sleep(ms, () =>
                cb(Either.rightUnit),
              );
              return Some(IO(cancel));
            }),
          );

          _cur = next;
          continue;
        }

        case 20: {
          const ec = cur.ec;
          const currentEC = this.currentEC;

          if (ec === currentEC) {
            // If we're already on the target execution context,
            // skip the re-scheduling and just continue
            _cur = cur.ioa;
            continue;
          }

          this.resumeIO = cur.ioa;
          this.resumeTag = AutoSuspendR;
          this.currentEC = ec;
          this.stack.push(currentEC);
          this.conts.push(RunOnK);
          this.schedule(this, ec);
          return;
        }

        case 21:
          // this.resumeIO = IO.pure(undefined);
          this.resumeTag = SuspendR;
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

  private _cancel: IO<void> = IO.uncancelable(() => {
    this.canceled = true;

    // Try to take the ownership of the runloop
    if (this.resume()) {
      // Are we masked?
      if (this.isUnmasked()) {
        // We've got ownership of the runloop and we are unmasked. We can run
        // finalizers'
        return IO.async_(cb => {
          this.stack.push(cb);
          this.resumeTag = AsyncContinueCanceledWithFinalizerR;
          // this.schedule(this, this.currentEC);
          this.run(); // Can we make the above work??
        });
      } else {
        // We took ownership of the runloop, but we are masked. Suspend to let
        // the current IO to finish and cancel itself
        this.suspend();
        return this.join.void;
      }
    } else {
      // The runloop is owned by other invocation. Let it run the finalizers
      // and just await the result
      return this.join.void;
    }
  });

  private prepareForCancelation(
    cb: ((ea: Either<Error, void>) => void) | undefined,
  ): IO<unknown> {
    if (this.finalizers.length) {
      // Ensure we start the finalizing only once
      if (!this.finalizing) {
        this.finalizing = true;

        this.conts = [CancelationLoopK];
        this.stack = cb ? [cb as (u: unknown) => unknown] : [];

        // do not allow further cancelations
        this.masks += 1;
      }
      return this.finalizers.pop()!;
    } else {
      cb && cb(Either.rightUnit);
      this.complete(IOOutcome.canceled());
      return IOEndFiber;
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

    this.stack = [];
    this.conts = [];
    this.callbacks = [];
    this.finalizers = [];
    this.masks = 0;
    this.suspended = false;
    this.trace.invalidate();
    this.currentEC = undefined as any;
    this.resumeTag = DoneR;
    this.resumeIO = null as any;
  }

  private schedule(f: IOFiber<any>, ec: ExecutionContext): void {
    ec.executeAsync(() => f.run());
  }

  private resume(): boolean {
    if (this.suspended) {
      this.suspended = false;
      return true;
    } else {
      return false;
    }
  }
  private suspend(): void {
    this.suspended = true;
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

  // -- Resumptions

  private execR(): void {
    if (this.canceled) {
      this.complete(IOOutcome.canceled());
    } else {
      this.conts = [TerminateK];
      this.stack = [];
      this.finalizers = [];

      const cur = this.resumeIO;
      this.resumeIO = null as any;
      this.runLoop(cur, this.autoSuspendThreshold);
    }
  }

  private asyncContinueSuccessfulR() {
    const a = this.stack.pop()!;
    this.runLoop(this.succeeded(a), this.autoSuspendThreshold);
  }

  private asyncContinueFailedR() {
    const e = this.stack.pop() as Error;
    this.runLoop(this.failed(e), this.autoSuspendThreshold);
  }

  private asyncContinueCanceledR() {
    const fin = this.prepareForCancelation(undefined);
    this.runLoop(fin, this.autoSuspendThreshold);
  }

  private asyncContinueCanceledWithFinalizerR() {
    const cb = this.stack.pop() as (ea: Either<Error, unknown>) => void;
    const fin = this.prepareForCancelation(cb);
    this.runLoop(fin, this.autoSuspendThreshold);
  }

  private suspendR() {
    this.runLoop(this.succeeded(undefined), this.autoSuspendThreshold);
  }

  private autoSuspendR() {
    const cur = this.resumeIO;
    this.resumeIO = null as any;
    this.runLoop(cur, this.autoSuspendThreshold);
  }

  // -- Continuations

  private succeeded(r: unknown): IO<unknown> {
    return this.continue('success', r);
  }

  private failed(e: Error): IO<unknown> {
    return this.continue('failure', e);
  }

  private continue(tag: 'success' | 'failure', value: unknown): IO<unknown> {
    let depth = 0;
    loop: while (true) {
      if (tag === 'success') {
        let r = value;

        while (true) {
          depth++;
          const nextCont = this.conts.pop()!;
          switch (nextCont) {
            // MapK
            case 0:
              if (depth <= MaxStackSize) {
                try {
                  const f = this.stack.pop()! as (u: unknown) => unknown;
                  r = f(r);
                  depth++;
                  continue;
                } catch (e) {
                  tag = 'failure';
                  value = e;
                  depth++;
                  continue loop;
                }
              } else {
                try {
                  const f = this.stack.pop()! as (u: unknown) => unknown;
                  return IO.pure(f(r));
                } catch (e) {
                  return IO.throwError(e as Error);
                }
              }

            // FlatMapK
            case 1:
              try {
                const f = this.stack.pop()! as (u: unknown) => IO<unknown>;
                return f(r);
              } catch (e) {
                tag = 'failure';
                value = e;
                depth++;
                continue loop;
              }

            // HandleErrorWithK
            case 2:
              this.stack.pop(); // Skip over error handlers
              continue;

            // AttemptK
            case 3:
              r = Right(r);
              depth++;
              continue;

            // CancelK
            case 4:
              this.finalizers.pop();
              depth++;
              continue;

            // UncancelableK
            case 5:
              this.masks -= 1;
              depth++;
              continue;

            // UnmaskK
            case 6:
              this.masks += 1;
              depth++;
              continue;

            case 7:
              return this.executeOnSuccessK(r);

            case 8:
              return this.cancelationLoopSuccessK();

            case 9:
              return this.terminateSuccessK(r);
          }
        }
      } else {
        let e = value as Error;
        Tracing.augmentError(e, this.trace.toArray);

        while (true) {
          const nextCont = this.conts.pop()!;
          switch (nextCont) {
            case 0: // MapK
            case 1: // FlatMapK
              this.stack.pop(); // skip over success transformers
              continue;

            // HandleErrorWithK
            case 2:
              try {
                const f = this.stack.pop()! as (e: Error) => IO<unknown>;
                return f(e);
              } catch (e2) {
                e = e2 as Error;
                Tracing.augmentError(e, this.trace.toArray);
                depth++;
                continue;
              }

            // AttemptK
            case 3:
              tag = 'success';
              value = Left(e);
              depth++;
              continue loop;

            // OnCancelK
            case 4:
              this.finalizers.pop();
              depth++;
              continue;

            // UncancelableK
            case 5:
              this.masks -= 1;
              depth++;
              continue;

            // UnmaskK
            case 6:
              this.masks += 1;
              depth++;
              continue;

            case 7:
              return this.executeOnFailureK(e);

            case 8:
              return this.cancelationLoopFailureK(e);

            case 9:
              return this.terminateFailureK(e);
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

  private executeOnSuccessK(r: unknown): IO<unknown> {
    const prevEC = this.stack.pop()! as ExecutionContext;
    this.currentEC = prevEC;
    if (!this.shouldFinalize()) {
      this.stack.push(r);
      this.resumeTag = AsyncContinueSuccessfulR;
      this.schedule(this, prevEC);
      return IOEndFiber;
    } else {
      return this.prepareForCancelation(undefined);
    }
  }

  private executeOnFailureK(e: Error): IO<unknown> {
    const prevEC = this.stack.pop()! as ExecutionContext;
    this.currentEC = prevEC;
    if (!this.shouldFinalize()) {
      this.stack.push(e);
      this.resumeTag = AsyncContinueFailedR;
      this.schedule(this, prevEC);
      return IOEndFiber;
    } else {
      return this.prepareForCancelation(undefined);
    }
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
