import { Either } from '../../fp/either';
import { ExecutionContext } from '../execution-context';

import { Fiber } from '../kernel/fiber';

import { Outcome } from '../kernel/outcome';
import { Poll } from '../kernel/poll';

// -- IO Algebra

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class IO<A> {
  // @ts-ignore
  private readonly __void: void;
}

export class Pure<A> extends IO<A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Fail extends IO<never> {
  public readonly tag = 'fail';
  public constructor(readonly error: Error) {
    super();
  }
}

export class Delay<A> extends IO<A> {
  public readonly tag = 'delay';
  public constructor(public readonly thunk: () => A) {
    super();
  }
}

export class Defer<A> extends IO<A> {
  public readonly tag = 'defer';
  public constructor(public readonly thunk: () => IO<A>) {
    super();
  }
}

export class Map<E, A> extends IO<A> {
  public readonly tag = 'map';
  public constructor(
    public readonly ioe: IO<E>,
    public readonly f: (e: E) => A,
  ) {
    super();
  }
}
export class FlatMap<E, A> extends IO<A> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly ioe: IO<E>,
    public readonly f: (a: E) => IO<A>,
  ) {
    super();
  }
}
export class HandleErrorWith<A> extends IO<A> {
  public readonly tag = 'handleErrorWith';
  public constructor(
    public readonly ioa: IO<A>,
    public readonly f: (e: Error) => IO<A>,
  ) {
    super();
  }
}

export class Attempt<A> extends IO<Either<Error, A>> {
  public readonly tag = 'attempt';
  public constructor(public readonly ioa: IO<A>) {
    super();
  }
}

export const CurrentTimeMillis =
  new (class CurrentTimeMillis extends IO<number> {
    public readonly tag = 'currentTimeMillis';
  })();
export type CurrentTimeMillis = typeof CurrentTimeMillis;

export const ReadEC = new (class ReadEC extends IO<ExecutionContext> {
  public readonly tag = 'readEC';
})();
export type ReadEC = typeof ReadEC;

export class Async<A> extends IO<A> {
  public readonly tag = 'async';
  public constructor(
    public readonly body: (
      cb: (ea: Either<Error, A>) => void,
    ) => IO<IO<void> | undefined | void>,
  ) {
    super();
  }
}

export class Fork<A> extends IO<Fiber<A>> {
  public readonly tag = 'fork';
  public constructor(public readonly ioa: IO<A>) {
    super();
  }
}

export class OnCancel<A> extends IO<A> {
  public readonly tag = 'onCancel';
  public constructor(
    public readonly ioa: IO<A>,
    public readonly fin: IO<void>,
  ) {
    super();
  }
}

export const Canceled = new (class Canceled extends IO<void> {
  public readonly tag = 'canceled';
})();
export type Canceled = typeof Canceled;

export class Uncancelable<A> extends IO<A> {
  public readonly tag = 'uncancelable';
  public constructor(public readonly body: (p: Poll) => IO<A>) {
    super();
  }
}

export class RacePair<A, B> extends IO<
  Either<[Outcome<A>, Fiber<B>], [Fiber<A>, Outcome<B>]>
> {
  public readonly tag = 'racePair';
  public constructor(public readonly ioa: IO<A>, public readonly iob: IO<B>) {
    super();
  }
}

export class Sleep extends IO<void> {
  public readonly tag = 'sleep';
  public constructor(public readonly ms: number) {
    super();
  }
}

export class ExecuteOn<A> extends IO<A> {
  public readonly tag = 'executeOn';
  public constructor(
    public readonly ioa: IO<A>,
    public readonly ec: ExecutionContext,
  ) {
    super();
  }
}

// -- Internal algebra produced by fiber execution

export class UnmaskRunLoop<A> extends IO<A> {
  public readonly tag = 'unmaskRunLoop';
  public constructor(
    public readonly ioa: IO<A>,
    public readonly id: number,
    public readonly fiber: Fiber<unknown>,
  ) {
    super();
  }
}

export const Suspend = new (class Suspend extends IO<never> {
  public readonly tag = 'suspend';
})();
export type Suspend = typeof Suspend;

export const IOEndFiber = new (class IOEnd extends IO<never> {
  public readonly tag = 'IOEndFiber';
})();
export type IOEndFiber = typeof IOEndFiber;

export type IOView<A> =
  | Pure<A>
  | Fail
  | Delay<A>
  | Defer<A>
  | Map<any, A>
  | FlatMap<any, A>
  | HandleErrorWith<A>
  | Attempt<Either<Error, A>>
  | CurrentTimeMillis
  | ReadEC
  | Async<A>
  | Fork<A>
  | Canceled
  | OnCancel<A>
  | Uncancelable<A>
  | RacePair<unknown, unknown>
  | Sleep
  | UnmaskRunLoop<A>
  | ExecuteOn<A>
  | Suspend
  | IOEndFiber;

export const view = <A>(_: IO<A>): IOView<A> => _ as any;

export enum Resumption {
  ExecR,
  AsyncContinueSuccessR,
  AsyncContinueFailureR,
  RunOnR,
  DoneR,
}

export enum Continuation {
  MapK,
  FlatMapK,
  HandleErrorWithK,
  AttemptK,
  OnCancelK,
  UncancelableK,
  UnmaskK,
  RunOnK,
  CancelationLoopK,
}
