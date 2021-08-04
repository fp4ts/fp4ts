import * as E from '../fp/either';
import * as IO from './io';
import * as O from './outcome';
import * as F from './fiber';
import { flow, pipe } from '../fp/core';
import { Poll } from './poll';

type Frame = (ea: E.Either<Error, unknown>) => IO.IO<unknown>;
type Stack = Frame[];

function _unsafeRun<A>(f: () => IO.IO<A>): IO.IO<A> {
  try {
    return f();
  } catch (e) {
    return IO.throwError(e as Error);
  }
}

export class IOFiber<A> implements F.Fiber<A> {
  private outcome?: O.Outcome<A>;
  private canceled: boolean = false;

  private masks: number = 0;
  private callbacks: ((oc: O.Outcome<A>) => void)[] = [];
  private stack: Stack = [];
  private finalizers: IO.IO<unknown>[] = [];

  private static ID: number = 0;
  private readonly ID: number = ++IOFiber.ID;

  public constructor(private startIO: IO.IO<A>) {}

  public join: IO.IO<O.Outcome<A>> = IO.async(cb =>
    IO.delay(() => this.onComplete(flow(E.right, cb))),
  );

  public cancel: IO.IO<void> = IO.uncancelable(() =>
    IO.defer(() => {
      this.canceled = true;

      return !this.masks && !this.outcome
        ? IO.async<unknown>(cb => IO.delay(() => this.cancelAsync(cb)))
        : IO.map_(this.join, () => undefined);
    }),
  );

  public unsafeRunAsync(cb: (oc: O.Outcome<A>) => void): void {
    this.schedule(this, cb);
  }

  private runLoop(_cur0: IO.IO<A>): void {
    let _cur = _cur0;

    const continueOutcome = (oc: O.Outcome<unknown>): IO.IO<unknown> => {
      // Check if we've got another stack frame to continue with
      const nextFrame = this.stack.pop();
      if (nextFrame) {
        return _unsafeRun(() => nextFrame(O.toEither(oc)));
      }

      // If we're on top of the stack, check if we've been canceled
      if (!this.canceled) {
        // Complete and end the fiber with the outcome
        this.complete(oc as O.Outcome<A>);
        return IO.IOEndFiber;
      }

      // If we're canceled, check if we've got another finalizer to continue
      // with and return it if we do
      const fin = this.finalizers.pop();
      if (fin) {
        return fin;
      }

      // If we've exhausted the finalizes, complete and end the fiber with
      // canceled outcome
      this.complete(O.canceled);
      return IO.IOEndFiber;
    };

    while (true) {
      const cur = IO.view(_cur);
      switch (cur.tag) {
        case 'IOEndFiber':
        case 'suspend':
          this.startIO = _cur;
          return;

        case 'pure': {
          const oc = O.success(cur.value);
          _cur = continueOutcome(oc);
          continue;
        }

        case 'fail': {
          const oc = O.failure(cur.error);
          _cur = continueOutcome(oc);
          continue;
        }

        case 'delay':
          _cur = _unsafeRun(() => IO.pure(cur.thunk()));
          continue;

        case 'bind':
          this.stack.push(cur.cont);
          _cur = cur.ioa;
          continue;

        case 'fork': {
          const fiber = new IOFiber(cur.ioa);
          _cur = IO.pure(fiber);
          this.schedule(fiber);
          continue;
        }

        case 'onCancel':
          this.finalizers.push(cur.fin);
          _cur = cur.ioa;
          continue;

        case 'async': {
          const prevCanceled = this.canceled;

          const cb: (ea: E.Either<Error, unknown>) => void = ea => {
            setImmediate(() => {
              // If we have not been canceled while suspended, or the task is
              // uncancelable, continue with the execution
              if (prevCanceled === this.canceled || this.masks) {
                const next = E.fold_(ea, IO.throwError, IO.pure);
                this.startIO = next;
                return this.schedule(this);
              } else {
                // Otherwise, we've been canceled and we should cancel ourselves
                // asynchronously
                return this.cancelAsync();
              }
            });
          };

          _cur = cur.body(cb);
          continue;
        }

        case 'uncancelable': {
          this.masks += 1;
          const prevMasks = this.masks;

          const poll: Poll = iob =>
            IO.defer(() => {
              if (this.masks === prevMasks) {
                this.stack.push(ea => {
                  this.masks -= 1;
                  return E.fold_(ea, IO.throwError, IO.pure);
                });
              }
              return iob;
            });

          _cur = cur.body(poll);
          continue;
        }

        case 'racePair': {
          const { ioa, iob } = cur;

          const next = IO.async<
            E.Either<
              [O.Outcome<unknown>, IOFiber<unknown>],
              [IOFiber<unknown>, O.Outcome<unknown>]
            >
          >(cb =>
            IO.delay(() => {
              const fiberA = new IOFiber(ioa);
              const fiberB = new IOFiber(iob);

              this.schedule(fiberA, oc => cb(E.right(E.left([oc, fiberB]))));
              this.schedule(fiberB, oc => cb(E.right(E.right([fiberA, oc]))));

              const cancel = pipe(
                IO.Do,
                IO.bindTo('cancelA', () => pipe(fiberA, F.cancel, IO.fork)),
                IO.bindTo('cancelB', () => pipe(fiberA, F.cancel, IO.fork)),
                IO.bind(({ cancelA }) => cancelA.join),
                IO.bind(({ cancelB }) => cancelB.join),
              );

              return cancel;
            }),
          );

          _cur = next;
          continue;
        }
      }
    }
  }

  private cancelAsync(cb?: (ea: E.Either<Error, void>) => void): void {
    if (this.finalizers.length) {
      this.stack = cb ? [() => IO.delay(() => cb(E.rightUnit))] : [];

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
    this.join = IO.pure(oc);
    this.cancel = IO.unit;
    this.outcome = oc;
    this.callbacks.forEach(cb => cb(oc));

    this.callbacks = [];
    this.stack = [];
    this.finalizers = [];
  }

  private onComplete(cb: (oc: O.Outcome<A>) => void): void {
    this.outcome ? cb(this.outcome) : this.callbacks.push(cb);
  }

  private schedule<A>(f: IOFiber<A>, cb?: (ea: O.Outcome<A>) => void): void {
    cb && f.callbacks.push(cb);
    setImmediate(() => f.runLoop(f.startIO));
  }
}
