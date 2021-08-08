import * as E from '../fp/either';
import * as IO from './io';
import * as O from './outcome';
import * as F from './fiber';
import { flow, pipe } from '../fp/core';
import { Poll } from './poll';

import * as IOA from './algebra';

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

  private static ID: number = 0;
  private readonly ID: number = ++IOFiber.ID;

  private startIO: IO.IO<unknown>;

  public constructor(startIO: IO.IO<A>) {
    this.startIO = startIO;
  }

  public join: IO.IO<O.Outcome<A>> = IO.async(cb =>
    IO.delay(() => {
      const listener: (oc: O.Outcome<A>) => void = flow(E.right, cb);
      const cancel = IO.delay(() => {
        this.callbacks = this.callbacks.filter(l => l !== listener);
      });

      this.onComplete(listener);
      return cancel;
    }),
  );

  public cancel: IO.IO<void> = IO.uncancelable(() =>
    IO.defer(() => {
      this.canceled = true;

      if (!this.masks) {
        return IO.async<void>(cb =>
          IO.delay(() => {
            this.cancelAsync(cb);
            return undefined;
          }),
        );
      } else {
        return IO.map_(this.join, () => undefined);
      }
    }),
  );

  public unsafeRunAsync(cb: (oc: O.Outcome<A>) => void): void {
    this.schedule(this, cb);
  }

  private runLoop(_cur: IO.IO<unknown>): void {
    while (true) {
      if (_cur === IOA.IOEndFiber) {
        return;
      }

      if (this.shouldFinalize()) {
        return this.cancelAsync();
      }

      const cur = IOA.view(_cur);
      switch (cur.tag) {
        case 'IOEndFiber':
        case 'suspend':
          this.startIO = _cur;
          return;

        case 'pure':
          _cur = this.succeeded(cur.value);
          continue;

        case 'fail':
          _cur = this.failed(cur.error);
          continue;

        case 'delay':
          try {
            _cur = IO.pure(cur.thunk());
            continue;
          } catch (e) {
            _cur = IO.throwError(e as Error);
            continue;
          }

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

        case 'fork': {
          const fiber = new IOFiber(cur.ioa);
          this.schedule(fiber);
          _cur = IO.pure(fiber);
          continue;
        }

        case 'onCancel':
          this.finalizers.push(cur.fin);
          this.conts.push(IOA.Continuation.OnCancelK);
          _cur = cur.ioa;
          continue;

        case 'canceled':
          this.startIO = _cur;
          this.canceled = true;
          if (!this.masks) {
            return this.cancelAsync();
          } else {
            _cur = IO.pure(undefined);
            continue;
          }

        case 'async': {
          const prevFinalizing = this.finalizing;

          const cb: (ea: E.Either<Error, unknown>) => void = ea => {
            // If we have not been canceled while suspended, or the task is
            // uncancelable, continue with the execution
            if (prevFinalizing === this.finalizing) {
              if (!this.shouldFinalize()) {
                const next = E.fold_(ea, IO.throwError, IO.pure);
                this.startIO = next;
                this.schedule(this);
              } else {
                // Otherwise, we've been canceled and we should cancel ourselves
                // asynchronously
                this.cancelAsync();
              }
            } else {
              // console.log('CANCELED BUT GOT HERE', this.ID, ea);
              // setImmediate(() => cb(ea));
            }
          };

          _cur = cur.body(cb);
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
          >(cb => {
            const r = IO.delay(() => {
              const fiberA = new IOFiber(ioa);
              const fiberB = new IOFiber(iob);

              this.schedule(fiberA, oc => cb(E.right(E.left([oc, fiberB]))));
              this.schedule(fiberB, oc => cb(E.right(E.right([fiberA, oc]))));

              const cancel = pipe(
                IO.Do,
                IO.bindTo('cancelA', () => pipe(fiberA.cancel, IO.fork)),
                IO.bindTo('cancelB', () => pipe(fiberB.cancel, IO.fork)),
                IO.bind(({ cancelA }) => cancelA.join),
                IO.bind(({ cancelB }) => cancelB.join),
                IO.map(() => undefined),
              );

              return IO.flatMap_(
                IO.delay(() => {}),
                () => cancel,
              );
            });
            return r;
          });

          _cur = next;
          continue;
        }
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
      setImmediate(() => this.runLoop(fin));
    } else {
      cb && cb(E.rightUnit);
      this.complete(O.canceled);
    }
  }

  private complete(oc: O.Outcome<A>): void {
    // console.log('COMPLETING', this.ID, oc); // , new Error().stack);
    this.join = IO.pure(oc);
    this.cancel = IO.unit;
    this.outcome = oc;

    try {
      this.callbacks.forEach(cb => cb(oc));
    } catch {
      console.log('SWALLOWING EXCEPTION');
    }

    this.stack = [];
    this.conts = [];
    this.callbacks = [];
    this.finalizers = [];
    this.masks = 0;
    this.startIO = IOA.IOEndFiber;
  }

  private onComplete(cb: (oc: O.Outcome<A>) => void): void {
    this.outcome ? cb(this.outcome) : this.callbacks.push(cb);
  }

  private schedule<A>(f: IOFiber<A>, cb?: (ea: O.Outcome<A>) => void): void {
    cb && f.callbacks.push(cb);
    setImmediate(() => f.runLoop(f.startIO));
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
