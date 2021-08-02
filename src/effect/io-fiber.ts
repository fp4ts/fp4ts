import * as E from '../fp/either';
import * as IO from './io';
import * as O from './outcome';
import { Fiber } from './fiber';
import { flow, pipe } from '../fp/core';

type Frame = (ea: E.Either<Error, unknown>) => IO.IO<unknown>;
type Stack = Frame[];

function _unsafeRun<A>(f: () => IO.IO<A>): IO.IO<A> {
  try {
    return f();
  } catch (e) {
    return IO.throwError(e as Error);
  }
}

export class IOFiber<A> implements Fiber<A> {
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

      const view = IO.view(this.startIO);

      return !this.masks && view.tag !== 'IOEndFiber'
        ? IO.async<unknown>(cb =>
            IO.delay(() => this.cancelAsync(flow(O.toEither, cb))),
          )
        : IO.map_(this.join, () => undefined);
    }),
  );

  public unsafeRunAsync(cb: (oc: O.Outcome<A>) => void): void {
    this.callbacks.push(cb);
    this.runLoop(this.startIO);
  }

  private runLoop(_cur0: IO.IO<A>): void {
    let _cur = _cur0;

    while (true) {
      const cur = IO.view(_cur);
      // console.log(cur);
      switch (cur.tag) {
        case 'IOEndFiber':
        case 'suspend':
          this.startIO = _cur;
          return;

        case 'pure':
          _cur = this.processNextOutcome(O.success(cur.value));
          continue;

        case 'fail':
          _cur = this.processNextOutcome(O.failure(cur.error));
          continue;

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

        case 'async': {
          const cb: (ea: E.Either<Error, unknown>) => void = ea => {
            const oc = O.fromEither(ea);
            if (!this.canceled) {
              setImmediate(() => this.runLoop(this.processNextOutcome(oc)));
            } else if (!this.masks) {
              this.cancelAsync();
            } else {
              setImmediate(() => cb(ea));
            }
          };
          _cur = cur.body(cb);
          continue;
        }

        case 'onCancel':
          this.finalizers.push(cur.fin);
          _cur = cur.ioa;
          continue;

        // case 'canceled': {
        //   const view = IO.view(this.startIO);
        //   if (!this.masks && view.tag !== 'IOEndFiber') {
        //     this.cancelAsync();
        //   }
        //   _cur = IO.pure(undefined);
        //   continue;
        // }

        case 'uncancelable': {
          this.masks += 1;

          const poll: <B>(iob: IO.IO<B>) => IO.IO<B> = iob =>
            IO.defer(() => {
              this.masks -= 1;
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
                IO.bindTo('cancelA', () => IO.fork(fiberA.cancel)),
                IO.bindTo('cancelB', () => IO.fork(fiberB.cancel)),
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

  private processNextOutcome(oc: O.Outcome<unknown>): IO.IO<unknown> {
    const nextCont = this.stack.pop();
    if (nextCont) {
      return _unsafeRun(() => nextCont(O.toEither(oc)));
    }

    if (this.canceled && !this.masks) {
      this.cancelAsync();
      return IO.IOEndFiber;
    } else {
      this.complete(oc as O.Outcome<A>);
      return IO.IOEndFiber;
    }
  }

  private cancelAsync(cb?: (oc: O.Outcome<unknown>) => void): void {
    if (cb) {
      this.callbacks.push(cb);
    }

    // do not allow further cancelations
    this.masks += 1;
    const fin = this.finalizers.pop();
    return fin ? this.runLoop(fin) : this.complete(O.canceled);
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

  private schedule<A>(
    f: IOFiber<A>,
    cb: (ea: O.Outcome<A>) => void = () => undefined,
  ): void {
    setImmediate(() => f.unsafeRunAsync(cb));
  }
}
