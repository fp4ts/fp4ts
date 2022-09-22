// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, HKT, id, Kind, Lazy, lazyVal, TyK, TyVar } from '@fp4ts/core';
import {
  Either,
  FunctionK,
  Left,
  Monad,
  MonadThrow,
  Option,
  Right,
} from '@fp4ts/cats';
import { Free } from '@fp4ts/cats-free';
import {
  Poll,
  ExecutionContext,
  Cont,
  MonadCancelThrow,
  Sync,
  Async,
  Ref,
  Deferred,
  Fiber,
  Outcome,
} from '@fp4ts/effect';
import { Transactor } from '../transactor';
import { PreparedStatement } from './prepared-statement';
import { Fragment } from './fragment';

export class ConnectionIO<out A> {
  // -- Connection interface

  public static prepareStatement(
    fragment: Fragment,
  ): ConnectionIO<PreparedStatement> {
    return ConnectionIO.lift(new PrepareStatement(fragment));
  }

  public static beginTransaction(): ConnectionIO<void> {
    return ConnectionIO.lift(BeginTransaction);
  }

  public static commit(): ConnectionIO<void> {
    return ConnectionIO.lift(Commit);
  }

  public static rollback(): ConnectionIO<void> {
    return ConnectionIO.lift(Rollback);
  }

  public static close(): ConnectionIO<void> {
    return ConnectionIO.lift(Close);
  }

  public transact<F>(trx: Transactor<F>): Kind<F, [A]> {
    return trx.trans(this);
  }

  public foldMap<F>(
    F: Monad<F>,
  ): (nt: <A>(op: ConnectionOp<A>) => Kind<F, [A]>) => Kind<F, [A]> {
    return this.underlying.foldMap(F);
  }

  // -- Common operations

  public static pure<A>(a: A): ConnectionIO<A> {
    return new ConnectionIO(Free.pure(a));
  }

  public static get unit(): ConnectionIO<void> {
    return ConnectionIO.pure(undefined as void);
  }

  public static lift<A>(fa: ConnectionOp<A>): ConnectionIO<A> {
    return new ConnectionIO(Free.suspend(fa));
  }

  public static tailRecM<A, B>(
    s: A,
    f: (a: A) => ConnectionIO<Either<A, B>>,
  ): ConnectionIO<B> {
    return new ConnectionIO(
      Free.Monad<ConnectionOpF>().tailRecM_(s, a => f(a).underlying),
    );
  }

  public static throwError<A = never>(e: Error): ConnectionIO<A> {
    return ConnectionIO.lift(new ThrowError(e));
  }

  public static get monotonic(): ConnectionIO<number> {
    return ConnectionIO.lift(Monotonic);
  }
  public static get realTime(): ConnectionIO<number> {
    return ConnectionIO.lift(RealTime);
  }

  public static get canceled(): ConnectionIO<void> {
    return ConnectionIO.lift(Canceled);
  }

  public static delay<A>(thunk: () => A): ConnectionIO<A> {
    return ConnectionIO.lift(new Delay(thunk));
  }
  public static defer<A>(thunk: () => ConnectionIO<A>): ConnectionIO<A> {
    return ConnectionIO.delay(thunk).flatMap(id);
  }

  public static uncancelable<A>(
    thunk: (poll: Poll<ConnectionIOF>) => ConnectionIO<A>,
  ): ConnectionIO<A> {
    return ConnectionIO.lift(new Uncancelable(thunk));
  }

  public static capturePoll<F>(
    poll: Poll<F>,
  ): <A>(fa: ConnectionIO<A>) => ConnectionIO<A> {
    return fa => ConnectionIO.lift(new Poll1(poll, fa));
  }

  public static async<A>(
    k: (
      cb: (ea: Either<Error, A>) => void,
    ) => ConnectionIO<Option<ConnectionIO<void>>>,
  ): ConnectionIO<A> {
    return ConnectionIO.Async.async(k);
  }

  public static async_<A>(
    k: (cb: (ea: Either<Error, A>) => void) => void,
  ): ConnectionIO<A> {
    return ConnectionIO.Async.async_(k);
  }

  public static fromPromise<A>(p: ConnectionIO<Promise<A>>): ConnectionIO<A> {
    return ConnectionIO.Async.fromPromise(p);
  }

  public static cont<K, R>(body: Cont<ConnectionIOF, K, R>): ConnectionIO<R> {
    return ConnectionIO.lift(new ConnectionCont(body));
  }

  public static sleep(ms: number): ConnectionIO<void> {
    return ConnectionIO.lift(new Sleep(ms));
  }

  public static ref<A>(a: A): ConnectionIO<Ref<ConnectionIOF, A>> {
    return ConnectionIO.lift(new ConnectionRef(a));
  }

  public static deferred<A>(): ConnectionIO<Deferred<ConnectionIOF, A>> {
    return ConnectionIO.lift(new ConnectionDeferred());
  }

  public static get readExecutionContext(): ConnectionIO<ExecutionContext> {
    return ConnectionIO.lift(ReadExecutionContext);
  }

  public static get never(): ConnectionIO<never> {
    return ConnectionIO.lift(Never);
  }

  public static get suspend(): ConnectionIO<void> {
    return ConnectionIO.lift(Suspend);
  }

  private constructor(private readonly underlying: Free<ConnectionOpF, A>) {}

  public map<B>(f: (a: A) => B): ConnectionIO<B> {
    return new ConnectionIO(this.underlying.map(f));
  }

  public map2<B>(
    that: ConnectionIO<B>,
  ): <C>(f: (a: A, b: B) => C) => ConnectionIO<C> {
    return ConnectionIO.Monad.map2_(this, that);
  }

  public flatMap<B>(f: (a: A) => ConnectionIO<B>): ConnectionIO<B> {
    return new ConnectionIO(this.underlying.flatMap(a => f(a).underlying));
  }

  public get attempt(): ConnectionIO<Either<Error, A>> {
    return this.map(Right<A, Error>).handleError(Left);
  }

  public handleError(h: (e: Error) => A): ConnectionIO<A> {
    return this.handleErrorWith(e => ConnectionIO.pure(h(e)));
  }

  public handleErrorWith(h: (e: Error) => ConnectionIO<A>): ConnectionIO<A> {
    return ConnectionIO.lift(new HandleErrorWith(this, h));
  }

  public onCancel(fin: ConnectionIO<void>): ConnectionIO<A> {
    return ConnectionIO.lift(new OnCancel(this, fin));
  }

  public bracket<B>(
    use: (a: A) => ConnectionIO<B>,
    release: (a: A) => ConnectionIO<void>,
  ): ConnectionIO<B> {
    return ConnectionIO.MonadCancelThrow.bracket_(this, use, release);
  }

  public finalize(
    finalizer: (oc: Outcome<ConnectionIOF, Error, A>) => ConnectionIO<void>,
  ): ConnectionIO<A> {
    return ConnectionIO.MonadCancelThrow.finalize_(this, finalizer);
  }

  public executeOn(ec: ExecutionContext): ConnectionIO<A> {
    return ConnectionIO.lift(new ExecuteOn(this, ec));
  }

  public get fork(): ConnectionIO<Fiber<ConnectionIOF, Error, A>> {
    return ConnectionIO.lift(new Fork(this));
  }

  // -- Instances

  public static get Monad(): Monad<ConnectionIOF> {
    return connectionIOMonad();
  }

  public static get MonadThrow(): MonadThrow<ConnectionIOF> {
    return connectionIOMonadThrow();
  }

  public static get MonadCancelThrow(): MonadCancelThrow<ConnectionIOF> {
    return connectionIOMonadCancelThrow();
  }

  public static get Sync(): Sync<ConnectionIOF> {
    return connectionIOSync();
  }

  public static get Async(): Async<ConnectionIOF> {
    return connectionIOAsync();
  }
}

export abstract class ConnectionOp<in out A> {
  readonly _A!: (a: A) => A;

  public abstract visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [A]>;
}

export abstract class ConnectionOpVisitor<F> {
  public visit<A>(fa: ConnectionOp<A>): Kind<F, [A]> {
    return fa.visit(this);
  }
  public liftK(): FunctionK<ConnectionOpF, F> {
    return fa => this.visit(fa);
  }

  public abstract visitPrepareStatement(
    fa: PrepareStatement,
  ): Kind<F, [PreparedStatement]>;
  public abstract visitBeginTransaction(fa: BeginTransaction): Kind<F, [void]>;
  public abstract visitCommit(fa: Commit): Kind<F, [void]>;
  public abstract visitRollback(fa: Rollback): Kind<F, [void]>;
  public abstract visitClose(fa: Close): Kind<F, [void]>;
  public abstract visitMonotonic(fa: Monotonic): Kind<F, [number]>;
  public abstract visitRealTime(fa: RealTime): Kind<F, [number]>;
  public abstract visitDelay<A>(fa: Delay<A>): Kind<F, [A]>;
  public abstract visitThrowError<A>(fa: ThrowError<A>): Kind<F, [A]>;
  public abstract visitCanceled(fa: Canceled): Kind<F, [void]>;
  public abstract visitUncancelable<A>(fa: Uncancelable<A>): Kind<F, [A]>;
  public abstract visitPoll<A>(fa: Poll1<A>): Kind<F, [A]>;
  public abstract visitOnCancel<A>(fa: OnCancel<A>): Kind<F, [A]>;
  public abstract visitHandleErrorWith<A>(fa: HandleErrorWith<A>): Kind<F, [A]>;
  public abstract visitSleep(fa: Sleep): Kind<F, [void]>;
  public abstract visitReadExecutionContext(
    fa: ReadExecutionContext,
  ): Kind<F, [ExecutionContext]>;
  public abstract visitExecuteOn<A>(fa: ExecuteOn<A>): Kind<F, [A]>;
  public abstract visitCont<K, R>(fa: ConnectionCont<K, R>): Kind<F, [R]>;
  public abstract visitRef<A>(
    fa: ConnectionRef<A>,
  ): Kind<F, [Ref<ConnectionIOF, A>]>;
  public abstract visitDeferred<A>(
    fa: ConnectionDeferred<A>,
  ): Kind<F, [Deferred<ConnectionIOF, A>]>;
  public abstract visitFork<A>(
    fa: Fork<A>,
  ): Kind<F, [Fiber<ConnectionIOF, Error, A>]>;
  public abstract visitJoinFiber<A>(
    fa: JoinFiber<A>,
  ): Kind<F, [Outcome<ConnectionIOF, Error, A>]>;
  public abstract visitFiberResult<A>(fa: FiberResult<A>): Kind<F, [A]>;
  public abstract visitCancelFiber(fa: CancelFiber): Kind<F, [void]>;
  public abstract visitNever(fa: Never): Kind<F, [never]>;
  public abstract visitSuspend(fa: Suspend): Kind<F, [void]>;
}

export class PrepareStatement extends ConnectionOp<PreparedStatement> {
  public constructor(public readonly fragment: Fragment) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [PreparedStatement]> {
    return v.visitPrepareStatement(this);
  }
}

export const BeginTransaction =
  new (class BeginTransaction extends ConnectionOp<void> {
    public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [void]> {
      return v.visitBeginTransaction(this);
    }
  })();
export type BeginTransaction = typeof BeginTransaction;

export const Commit = new (class Commit extends ConnectionOp<void> {
  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [void]> {
    return v.visitCommit(this);
  }
})();
export type Commit = typeof Commit;

export const Rollback = new (class Rollback extends ConnectionOp<void> {
  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [void]> {
    return v.visitRollback(this);
  }
})();
export type Rollback = typeof Rollback;

export const Close = new (class Close extends ConnectionOp<void> {
  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [void]> {
    return v.visitClose(this);
  }
})();
export type Close = typeof Close;

export const Monotonic = new (class Monotonic extends ConnectionOp<number> {
  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [number]> {
    return v.visitMonotonic(this);
  }
})();
export type Monotonic = ConnectionOp<number>;

export const RealTime = new (class RealTime extends ConnectionOp<number> {
  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [number]> {
    return v.visitRealTime(this);
  }
})();
export type RealTime = ConnectionOp<number>;

export class Delay<A> extends ConnectionOp<A> {
  public constructor(public readonly thunk: () => A) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [A]> {
    return v.visitDelay(this);
  }
}

export class ThrowError<A> extends ConnectionOp<A> {
  public constructor(public readonly error: Error) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [A]> {
    return v.visitThrowError(this);
  }
}

export const Canceled = new (class Canceled extends ConnectionOp<void> {
  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [void]> {
    return v.visitCanceled(this);
  }
})();
export type Canceled = ConnectionOp<void>;

export class Uncancelable<A> extends ConnectionOp<A> {
  public constructor(
    public readonly self: (poll: Poll<ConnectionIOF>) => ConnectionIO<A>,
  ) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [A]> {
    return v.visitUncancelable(this);
  }
}

export class Poll1<A> extends ConnectionOp<A> {
  public constructor(
    public readonly poll: Poll<any>,
    public readonly self: ConnectionIO<A>,
  ) {
    super();
  }
  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [A]> {
    return v.visitPoll(this);
  }
}

export class OnCancel<A> extends ConnectionOp<A> {
  public constructor(
    public readonly self: ConnectionIO<A>,
    public readonly fin: ConnectionIO<void>,
  ) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [A]> {
    return v.visitOnCancel(this);
  }
}

export class HandleErrorWith<A> extends ConnectionOp<A> {
  public constructor(
    public readonly self: ConnectionIO<A>,
    public readonly handle: (e: Error) => ConnectionIO<A>,
  ) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [A]> {
    return v.visitHandleErrorWith(this);
  }
}

export class Sleep extends ConnectionOp<void> {
  public constructor(public readonly ms: number) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [void]> {
    return v.visitSleep(this);
  }
}

export const ReadExecutionContext =
  new (class ReadExecutionContext extends ConnectionOp<ExecutionContext> {
    public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [ExecutionContext]> {
      return v.visitReadExecutionContext(this);
    }
  })();
export type ReadExecutionContext = ConnectionOp<ExecutionContext>;

export class ExecuteOn<A> extends ConnectionOp<A> {
  public constructor(
    public readonly self: ConnectionIO<A>,
    public readonly ec: ExecutionContext,
  ) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [A]> {
    return v.visitExecuteOn(this);
  }
}

export class ConnectionCont<K, R> extends ConnectionOp<R> {
  public constructor(public readonly body: Cont<ConnectionIOF, K, R>) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [R]> {
    return v.visitCont(this);
  }
}

export class ConnectionRef<A> extends ConnectionOp<Ref<ConnectionIOF, A>> {
  public constructor(public readonly value: A) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [Ref<ConnectionIOF, A>]> {
    return v.visitRef(this);
  }
}
export class ConnectionDeferred<A> extends ConnectionOp<
  Deferred<ConnectionIOF, A>
> {
  public visit<F>(
    v: ConnectionOpVisitor<F>,
  ): Kind<F, [Deferred<ConnectionIOF, A>]> {
    return v.visitDeferred(this);
  }
}

export class Fork<A> extends ConnectionOp<Fiber<ConnectionIOF, Error, A>> {
  public constructor(public readonly self: ConnectionIO<A>) {
    super();
  }

  public visit<F>(
    v: ConnectionOpVisitor<F>,
  ): Kind<F, [Fiber<ConnectionIOF, Error, A>]> {
    return v.visitFork(this);
  }
}

export class JoinFiber<A> extends ConnectionOp<
  Outcome<ConnectionIOF, Error, A>
> {
  public constructor(public readonly fiber: Fiber<unknown, Error, unknown>) {
    super();
  }

  public visit<F>(
    v: ConnectionOpVisitor<F>,
  ): Kind<F, [Outcome<ConnectionIOF, Error, A>]> {
    return v.visitJoinFiber(this);
  }
}

export class FiberResult<A> extends ConnectionOp<A> {
  public constructor(public readonly fa: Kind<unknown, [A]>) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [A]> {
    return v.visitFiberResult(this);
  }
}

export class CancelFiber extends ConnectionOp<void> {
  public constructor(public readonly fiber: Fiber<unknown, Error, unknown>) {
    super();
  }

  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [void]> {
    return v.visitCancelFiber(this);
  }
}

export const Never = new (class Never extends ConnectionOp<never> {
  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [never]> {
    return v.visitNever(this);
  }
})();
export type Never = typeof Never;

export const Suspend = new (class Suspend extends ConnectionOp<void> {
  public visit<F>(v: ConnectionOpVisitor<F>): Kind<F, [void]> {
    return v.visitSuspend(this);
  }
})();
export type Suspend = typeof Suspend;

// -- Instances

const connectionIOMonad: Lazy<Monad<ConnectionIOF>> = lazyVal(() =>
  Monad.of<ConnectionIOF>({
    pure: ConnectionIO.pure,
    map_: (fa, f) => fa.map(f),
    flatMap_: (fa, f) => fa.flatMap(f),
    tailRecM_: ConnectionIO.tailRecM,
  }),
);

const connectionIOMonadThrow: Lazy<MonadThrow<ConnectionIOF>> = lazyVal(() =>
  MonadThrow.of<ConnectionIOF>({
    ...connectionIOMonad(),
    throwError: ConnectionIO.throwError,
    handleErrorWith_: (fa, h) => fa.handleErrorWith(h),
  }),
);

const connectionIOMonadCancelThrow: Lazy<MonadCancelThrow<ConnectionIOF>> =
  lazyVal(() =>
    MonadCancelThrow.of<ConnectionIOF>({
      ...connectionIOMonadThrow(),
      canceled: ConnectionIO.canceled,
      uncancelable: ConnectionIO.uncancelable,
      onCancel_: (fa, f) => fa.onCancel(f),
    }),
  );

const connectionIOSync: Lazy<Sync<ConnectionIOF>> = lazyVal(() =>
  Sync.of({
    ...connectionIOMonadCancelThrow(),
    monotonic: ConnectionIO.monotonic,
    realTime: ConnectionIO.realTime,
    delay: ConnectionIO.delay,
    applicative: connectionIOMonad(),
  }),
);

const connectionIOAsync: Lazy<Async<ConnectionIOF>> = lazyVal(() =>
  Async.of<ConnectionIOF>({
    ...connectionIOSync(),
    cont: ConnectionIO.cont,
    executeOn_: (fa, ec) => fa.executeOn(ec),
    sleep: ConnectionIO.sleep,
    ref: ConnectionIO.ref,
    deferred: ConnectionIO.deferred,
    fork: fa => fa.fork,
    never: ConnectionIO.never,
    suspend: ConnectionIO.suspend,
    readExecutionContext: ConnectionIO.readExecutionContext,
  }),
);

// -- HKT

export interface ConnectionIO<A> extends HKT<ConnectionIOF, [A]> {}

export interface ConnectionIOF extends TyK<[unknown]> {
  [$type]: ConnectionIO<TyVar<this, 0>>;
}

export interface ConnectionOp<A> extends HKT<ConnectionOpF, [A]> {}

export interface ConnectionOpF extends TyK<[unknown]> {
  [$type]: ConnectionOp<TyVar<this, 0>>;
}
