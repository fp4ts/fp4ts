import * as E from '../fp/either';
import * as IO from './io';
import { Fiber } from './fiber';

type Frame = (ea: E.Either<Error, unknown>) => IO.IO<unknown>;
type Stack = Frame[];

export class IOFiber<A> implements Fiber<A> {
  private readonly state: IOFiberState<A>;

  public constructor(io: IO.IO<A>) {
    this.state = new IOFiberState(io);
  }

  public join(): IO.IO<A> {
    return IO.async(cb => IO.defer(() => this.state.onComplete(ea => cb(ea))));
  }

  public cancel(): IO.IO<void> {
    throw new Error('Unimplemented');
  }

  public unsafeRunAsync(cb: (ea: E.Either<Error, A>) => void): void {
    this.state.onComplete(cb);

    const runLoop = () => {
      while (true) {
        if (this.state.outcome) {
          const o = this.state.outcome;
          this.state.outcome = undefined;
          const next = this.state.stack.pop();
          if (!next) return this.state.complete(o as E.Either<Error, A>);

          try {
            this.state.cur = next(o);
            continue;
          } catch (e) {
            this.state.cur = IO.throwError(e as Error);
            continue;
          }
        }

        const cur = IO.view(this.state.cur);
        switch (cur.tag) {
          case 'pure': {
            this.state.outcome = E.right(cur.value);
            continue;
          }

          case 'fail': {
            this.state.outcome = E.left(cur.error);
            continue;
          }

          case 'defer': {
            try {
              const x = cur.thunk();
              this.state.cur = IO.pure(x);
              continue;
            } catch (e) {
              this.state.cur = IO.throwError(e);
              continue;
            }
          }

          case 'suspend': {
            try {
              this.state.cur = cur.thunk();
              continue;
            } catch (e) {
              this.state.cur = IO.throwError(e);
              continue;
            }
          }

          case 'bind': {
            this.state.stack.push(cur.cont);
            this.state.cur = cur.ioa;
            continue;
          }

          case 'async': {
            const next = cur;
            setImmediate(() => {
              next.body(outcome => {
                this.state.outcome = outcome;
                runLoop();
              });
            });
            return;
          }

          case 'fork': {
            const fiber = new IOFiber(cur.ioa);
            this.state.cur = IO.pure(fiber);
            setImmediate(() => {
              fiber.unsafeRunAsync(E.fold(console.log, () => undefined));
            });
            continue;
          }
        }
      }
    };
    runLoop();
  }
}

class IOFiberState<A> {
  public cur: IO.IO<unknown>;
  public outcome: E.Either<Error, unknown> | undefined;
  public finalOutcome: E.Either<Error, A> | undefined;
  public readonly stack: Stack = [];
  public readonly callbacks: ((ea: E.Either<Error, A>) => void)[] = [];

  public constructor(io: IO.IO<A>) {
    this.cur = io;
  }

  public onComplete(cb: (ea: E.Either<Error, A>) => void): void {
    this.finalOutcome ? cb(this.finalOutcome) : this.callbacks.push(cb);
  }

  public complete(ea: E.Either<Error, A>): void {
    this.finalOutcome = ea;
    this.callbacks.forEach(cb => cb(ea));
  }
}
