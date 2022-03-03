// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '@fp4ts/cats';
import { ExecutionContext, Poll, Cont } from '@fp4ts/effect-kernel';

import { IOF } from './io';
import { IOFiber } from '../io-fiber';
import { IOOutcome } from '../io-outcome';
import { TracingEvent } from '../tracing';

// -- IO Algebra

export abstract class IO<A> {
  readonly __void!: void;
  readonly _A!: () => A;
}

export class Pure<A> extends IO<A> {
  public readonly tag = 0; // 'pure';
  public constructor(
    public readonly value: A,
    public readonly event?: TracingEvent,
  ) {
    super();
  }

  public override toString(): string {
    return `[Pure value: ${this.value}]`;
  }
}

export class Fail extends IO<never> {
  public readonly tag = 1; // 'fail';
  public constructor(readonly error: Error) {
    super();
  }

  public override toString(): string {
    return `[Fail error: ${this.error}]`;
  }
}

export class Delay<A> extends IO<A> {
  public readonly tag = 2;
  public constructor(
    public readonly thunk: () => A,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

export class Defer<A> extends IO<A> {
  public readonly tag = 3;
  public constructor(
    public readonly thunk: () => IO<A>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

export const CurrentTimeMicros =
  new (class CurrentTimeMicros extends IO<number> {
    public readonly tag = 4;
  })();
export type CurrentTimeMicros = typeof CurrentTimeMicros;

export const CurrentTimeMillis =
  new (class CurrentTimeMillis extends IO<number> {
    public readonly tag = 5;
  })();
export type CurrentTimeMillis = typeof CurrentTimeMillis;

export const ReadEC = new (class ReadEC extends IO<ExecutionContext> {
  public readonly tag = 6;
})();
export type ReadEC = typeof ReadEC;

export class Map<E, A> extends IO<A> {
  public readonly tag = 7;
  public constructor(
    public readonly ioe: IO<E>,
    public readonly f: (e: E) => A,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}
export class FlatMap<E, A> extends IO<A> {
  public readonly tag = 8;
  public constructor(
    public readonly ioe: IO<E>,
    public readonly f: (a: E) => IO<A>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}
export class HandleErrorWith<A> extends IO<A> {
  public readonly tag = 9;
  public constructor(
    public readonly ioa: IO<A>,
    public readonly f: (e: Error) => IO<A>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

export class Attempt<A> extends IO<Either<Error, A>> {
  public readonly tag = 10;
  public constructor(public readonly ioa: IO<A>) {
    super();
  }
}

export class Fork<A> extends IO<IOFiber<A>> {
  public readonly tag = 11;
  public constructor(public readonly ioa: IO<A>) {
    super();
  }
}

export class OnCancel<A> extends IO<A> {
  public readonly tag = 12;
  public constructor(
    public readonly ioa: IO<A>,
    public readonly fin: IO<void>,
  ) {
    super();
  }
}

export const Canceled = new (class Canceled extends IO<void> {
  public readonly tag = 13;
})();
export type Canceled = typeof Canceled;

export class Uncancelable<A> extends IO<A> {
  public readonly tag = 16;
  public constructor(
    public readonly body: (p: Poll<IOF>) => IO<A>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

export class RacePair<A, B> extends IO<
  Either<[IOOutcome<A>, IOFiber<B>], [IOFiber<A>, IOOutcome<B>]>
> {
  public readonly tag = 18;
  public constructor(public readonly ioa: IO<A>, public readonly iob: IO<B>) {
    super();
  }
}

export class Sleep extends IO<void> {
  public readonly tag = 19;
  public constructor(public readonly ms: number) {
    super();
  }
}

export class ExecuteOn<A> extends IO<A> {
  public readonly tag = 20;
  public constructor(
    public readonly ioa: IO<A>,
    public readonly ec: ExecutionContext,
  ) {
    super();
  }
}

export const Suspend = new (class Suspend extends IO<void> {
  public readonly tag = 21;
})();
export type Suspend = typeof Suspend;

// -- Internal algebra produced by fiber execution

export class UnmaskRunLoop<A> extends IO<A> {
  public readonly tag = 17;
  public constructor(
    public readonly ioa: IO<A>,
    public readonly id: number,
    public readonly fiber: IOFiber<unknown>,
  ) {
    super();
  }
}

export class IOCont<K, R> extends IO<R> {
  public readonly tag = 14;
  public constructor(
    public readonly body: Cont<IOF, K, R>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

export class IOContGet<A> extends IO<A> {
  public readonly tag = 15;
  public constructor(public readonly state: ContState) {
    super();
  }
}

export const IOEndFiber = new (class IOEnd extends IO<never> {
  public readonly tag = 22;
})();
export type IOEndFiber = typeof IOEndFiber;

export type IOView<A> =
  | Pure<A>
  | Fail
  | Delay<A>
  | Defer<A>
  | Suspend
  | Map<any, A>
  | FlatMap<any, A>
  | HandleErrorWith<A>
  | Attempt<Either<Error, A>>
  | CurrentTimeMicros
  | CurrentTimeMillis
  | ReadEC
  | IOCont<any, A>
  | IOContGet<A>
  | Fork<A>
  | Canceled
  | OnCancel<A>
  | Uncancelable<A>
  | RacePair<unknown, unknown>
  | Sleep
  | UnmaskRunLoop<A>
  | ExecuteOn<A>
  | IOEndFiber;

export const view = <A>(_: IO<A>): IOView<A> => _ as any;

export enum Resumption {
  ExecR,
  AsyncContinueSuccessR,
  AsyncContinueFailureR,
  RunOnR,
  DoneR,
}

export const MapK = 0;
export const FlatMapK = 1;
export const HandleErrorWithK = 2;
export const AttemptK = 3;
export const OnCancelK = 4;
export const UncancelableK = 5;
export const UnmaskK = 6;
export const RunOnK = 7;
export const CancelationLoopK = 8;
export type Continuation =
  | typeof MapK
  | typeof FlatMapK
  | typeof HandleErrorWithK
  | typeof AttemptK
  | typeof OnCancelK
  | typeof UncancelableK
  | typeof UnmaskK
  | typeof RunOnK
  | typeof CancelationLoopK;

export enum ContStatePhase {
  Initial,
  Waiting,
  Result,
}

export class ContState {
  public constructor(
    public wasFinalizing: boolean,
    public phase: ContStatePhase = ContStatePhase.Initial,
    public result?: Either<Error, unknown>,
  ) {}
}
