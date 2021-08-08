import { Either } from '../fp/either';
import { Fiber } from './fiber';
import { Outcome } from './outcome';
import { Poll } from './poll';

// -- IO Algebra

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class IO<A> {
  // @ts-ignore
  private readonly __void: void;
  public readonly stack = new Error();
}

export const Canceled = new (class Canceled extends IO<void> {
  public readonly tag = 'canceled';
})();
export type Canceled = typeof Canceled;

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

export type Cont<K, R> = (cb: (ea: Either<Error, K>) => void) => IO<R>;
export class Async<K, R> extends IO<R> {
  public readonly tag = 'async';
  public constructor(public readonly body: Cont<K, R>) {
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

export class Uncancelable<A> extends IO<A> {
  public readonly tag = 'uncancelable';
  public constructor(public readonly body: (p: Poll) => IO<A>) {
    super();
  }
}

export class RacePair<A, B> extends IO<
  Either<[Outcome<A>, Fiber<B>], [Fiber<B>, Outcome<B>]>
> {
  public readonly tag = 'racePair';
  public constructor(public readonly ioa: IO<A>, public readonly iob: IO<B>) {
    super();
  }
}

// Internal algebra produced by fiber execution

export class UnmaskRunLoop<A> extends IO<A> {
  public readonly tag = 'unmaskRunLoop';
  public constructor(public readonly ioa: IO<A>, public readonly id: number) {
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
  | Canceled
  | Delay<A>
  | Map<any, A>
  | FlatMap<any, A>
  | HandleErrorWith<A>
  | Async<any, A>
  | Fork<A>
  | OnCancel<A>
  | Uncancelable<A>
  | RacePair<unknown, unknown>
  | UnmaskRunLoop<A>
  | Suspend
  | IOEndFiber;

export const view = <A>(_: IO<A>): IOView<A> => _ as any;

export enum Continuation {
  MapK,
  FlatMapK,
  HandleErrorWithK,
  OnCancelK,
  UncancelableK,
  UnmaskK,
  CancelationLoopK,
}
