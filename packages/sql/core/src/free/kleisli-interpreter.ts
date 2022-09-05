// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, $, pipe } from '@fp4ts/core';
import { Either, FunctionK, Kleisli, KleisliF } from '@fp4ts/cats';
import {
  Async,
  Deferred,
  Fiber,
  MonadCancel,
  Ref,
  Outcome,
  ExecutionContext,
} from '@fp4ts/effect';

import {
  ConnectionIOF,
  ConnectionOpVisitor,
  Monotonic,
  RealTime,
  Delay,
  ThrowError,
  Canceled,
  Uncancelable,
  OnCancel,
  HandleErrorWith,
  Sleep,
  ReadExecutionContext,
  ExecuteOn,
  ConnectionCont,
  ConnectionRef,
  ConnectionDeferred,
  Fork,
  Never,
  Suspend,
  ConnectionIO,
  Poll1,
  JoinFiber,
  FiberResult,
  CancelFiber,
} from './connection-io';

export abstract class KleisliInterpreter<F, C> extends ConnectionOpVisitor<
  $<KleisliF, [F, C]>
> {
  public constructor(protected readonly F: Async<F>) {
    super();
  }

  protected get KF() {
    return Kleisli.Monad<F, C>(this.F);
  }

  public visitMonotonic(fa: Monotonic): Kleisli<F, C, number> {
    return Kleisli(() => this.F.monotonic);
  }
  public visitRealTime(fa: RealTime): Kleisli<F, C, number> {
    return Kleisli(() => this.F.realTime);
  }
  public visitDelay<A>(fa: Delay<A>): Kleisli<F, C, A> {
    return Kleisli(() => this.F.delay(fa.thunk));
  }
  public visitThrowError<A>(fa: ThrowError<A>): Kleisli<F, C, A> {
    return Kleisli(() => this.F.throwError(fa.error));
  }
  public visitCanceled(fa: Canceled): Kleisli<F, C, void> {
    return Kleisli(() => this.F.canceled);
  }
  public visitPoll<A>(fa: Poll1<A>): Kleisli<F, C, A> {
    return Kleisli(conn =>
      fa.poll(fa.self.foldMap(this.KF)(this.liftK())(conn)),
    );
  }
  public visitUncancelable<A>(fa: Uncancelable<A>): Kleisli<F, C, A> {
    return Kleisli(conn =>
      this.F.uncancelable(poll =>
        fa.self(ConnectionIO.capturePoll(poll)).foldMap(this.KF)(this.liftK())(
          conn,
        ),
      ),
    );
  }
  public visitOnCancel<A>(fa: OnCancel<A>): Kleisli<F, C, A> {
    return Kleisli(conn =>
      this.F.onCancel_(
        fa.self.foldMap(this.KF)(this.liftK())(conn),
        fa.fin.foldMap(this.KF)(this.liftK())(conn),
      ),
    );
  }
  public visitHandleErrorWith<A>(fa: HandleErrorWith<A>): Kleisli<F, C, A> {
    return Kleisli(conn =>
      this.F.handleErrorWith_(fa.self.foldMap(this.KF)(this.liftK())(conn), e =>
        fa.handle(e).foldMap(this.KF)(this.liftK())(conn),
      ),
    );
  }
  public visitSleep(fa: Sleep): Kleisli<F, C, void> {
    return Kleisli(() => this.F.sleep(fa.ms));
  }
  public visitReadExecutionContext(
    fa: ReadExecutionContext,
  ): Kleisli<F, C, ExecutionContext> {
    return Kleisli(() => this.F.readExecutionContext);
  }
  public visitExecuteOn<A>(fa: ExecuteOn<A>): Kleisli<F, C, A> {
    return Kleisli(conn =>
      this.F.executeOn_(fa.self.foldMap(this.KF)(this.liftK())(conn), fa.ec),
    );
  }
  public visitCont<K, R>(fa: ConnectionCont<K, R>): Kleisli<F, C, R> {
    return Kleisli(conn =>
      this.F.cont(
        <G>(G: MonadCancel<G, Error>) =>
          (
            k: (ea: Either<Error, K>) => void,
            get: Kind<G, [K]>,
            nt: FunctionK<F, G>,
          ): Kind<G, [R]> =>
            fa.body(G)(
              k,
              get,
              <A>(fa: ConnectionIO<A>): Kind<G, [A]> =>
                nt(fa.foldMap(this.KF)(this.liftK())(conn)),
            ),
      ),
    );
  }
  public visitRef<A>(
    fa: ConnectionRef<A>,
  ): Kleisli<F, C, Ref<ConnectionIOF, A>> {
    return Kleisli(() =>
      pipe(
        this.F.ref(fa.value),
        this.F.map(ref =>
          ref.mapK(<A>(fa: Kind<F, [A]>) =>
            ConnectionIO.lift(new FiberResult(fa as Kind<unknown, [A]>)),
          ),
        ),
      ),
    );
  }
  public visitDeferred<A>(
    fa: ConnectionDeferred<A>,
  ): Kleisli<F, C, Deferred<ConnectionIOF, A>> {
    return Kleisli(() =>
      pipe(
        this.F.deferred<A>(),
        this.F.map(ref =>
          ref.mapK(<A>(fa: Kind<F, [A]>) =>
            ConnectionIO.lift(new FiberResult(fa as Kind<unknown, [A]>)),
          ),
        ),
      ),
    );
  }
  public visitFork<A>(
    fa: Fork<A>,
  ): Kleisli<F, C, Fiber<ConnectionIOF, Error, A>> {
    return Kleisli(conn =>
      pipe(
        this.F.fork(fa.self.foldMap(this.KF)(this.liftK())(conn)),
        this.F.map(fib => new ConnectionIOFiber(fib)),
      ),
    );
  }
  public visitJoinFiber<A>(
    fa: JoinFiber<A>,
  ): Kleisli<F, C, Outcome<ConnectionIOF, Error, A>> {
    return Kleisli(() =>
      pipe(
        fa.fiber.join as Kind<F, [Outcome<F, Error, A>]>,
        this.F.map(oc =>
          oc.mapK(<A>(fa: Kind<F, [A]>) =>
            ConnectionIO.lift(new FiberResult(fa as Kind<unknown, [A]>)),
          ),
        ),
      ),
    );
  }
  public visitFiberResult<A>(fa: FiberResult<A>): Kleisli<F, C, A> {
    return Kleisli(() => fa.fa as Kind<F, [A]>);
  }
  public visitCancelFiber(fa: CancelFiber): Kleisli<F, C, void> {
    return Kleisli(() => fa.fiber.cancel as Kind<F, [void]>);
  }

  public visitNever(fa: Never): Kleisli<F, C, never> {
    return Kleisli(() => this.F.never);
  }
  public visitSuspend(fa: Suspend): Kleisli<F, C, void> {
    return Kleisli(() => this.F.suspend);
  }
}

class ConnectionIOFiber<F, A> extends Fiber<ConnectionIOF, Error, A> {
  public constructor(private readonly fiber: Fiber<F, Error, A>) {
    super();
  }

  public get join(): ConnectionIO<Outcome<ConnectionIOF, Error, A>> {
    return ConnectionIO.lift(
      new JoinFiber(this.fiber as Fiber<unknown, Error, A>),
    );
  }

  public get cancel(): ConnectionIO<void> {
    return ConnectionIO.lift(
      new CancelFiber(this.fiber as Fiber<unknown, Error, A>),
    );
  }
}
