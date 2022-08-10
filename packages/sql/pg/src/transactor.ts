// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Chain,
  Either,
  FunctionK,
  Kleisli,
  KleisliF,
  None,
  Option,
  Some,
} from '@fp4ts/cats';
import { $, Kind, pipe } from '@fp4ts/core';
import {
  Async,
  Deferred,
  ExecutionContext,
  Fiber,
  MonadCancel,
  Outcome,
  Ref,
} from '@fp4ts/effect';

import {
  ConnectionIOF,
  PreparedStatement,
  ResultSet,
  StreamedResultSet,
  Transactor,
  TransactorAux,
} from '@fp4ts/sql-free';
import {
  ConnectionOpVisitor,
  PrepareStatement,
  BeginTransaction,
  Commit,
  Rollback,
  Close,
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
  ConnectionOp,
} from '@fp4ts/sql-free/lib/connection-io';
import { Chunk } from '@fp4ts/stream';

import {
  Client as PgClient,
  ClientBase as PgClientBase,
  QueryArrayConfig,
  QueryArrayResult,
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from 'pg';
import PgCursor from 'pg-cursor';

export class PgConnection {
  private readonly __void!: void;

  public constructor(public readonly client: PgClient) {}
}

class PgResultSet extends ResultSet {
  public constructor(private readonly result: QueryResult) {
    super();
  }

  public getRows<A>(): ConnectionIO<A[]> {
    return ConnectionIO.pure(this.result.rows);
  }
}

class PgStreamedResultSet extends StreamedResultSet {
  public constructor(protected readonly cursor: PgCursor) {
    super();
  }

  public getNextChunk<A>(chunkSize: number): ConnectionIO<Option<Chunk<A>>> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() => this.cursor.read(chunkSize)),
    ).map(xs => (xs.length === 0 ? None : Some(Chunk.fromArray(xs))));
  }

  public close(): ConnectionIO<void> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() => this.cursor.close()),
    );
  }
}

class PgPreparedStatement extends PreparedStatement {
  public constructor(
    public readonly sql: string,
    public readonly params: Chain<unknown>,
    private readonly underlying: PgClientBase,
  ) {
    super();
  }

  public query(): ConnectionIO<ResultSet> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() =>
        this.underlying.query(this.sql, this.params.toArray),
      ),
    ).map(result => new PgResultSet(result) as ResultSet);
  }

  public queryStream(): ConnectionIO<StreamedResultSet> {
    return ConnectionIO.delay(() =>
      this.underlying.query(new PgCursor(this.sql, this.params.toArray)),
    ).map(cursor => new PgStreamedResultSet(cursor) as StreamedResultSet);
  }

  public update(): ConnectionIO<number> {
    return null as any;
  }

  public close(): ConnectionIO<void> {
    return ConnectionIO.unit;
  }
}

export class PgConnectionOpVisitor<F> extends ConnectionOpVisitor<
  $<KleisliF, [F, PgConnection]>
> {
  public constructor(private readonly F: Async<F>) {
    super();
  }

  private get KF() {
    return Kleisli.Monad<F, PgConnection>(this.F);
  }

  private rawQuery(sql: string): Kleisli<F, PgConnection, void> {
    return Kleisli(conn =>
      pipe(
        this.F.delay(() => conn.client.query(sql)),
        this.F.fromPromise,
        this.F.void,
      ),
    );
  }

  public visitPrepareStatement(
    fa: PrepareStatement,
  ): Kleisli<F, PgConnection, PreparedStatement> {
    return Kleisli(conn =>
      this.F.pure(new PgPreparedStatement(fa.sql, fa.params, conn.client)),
    );
  }
  public visitBeginTransaction(
    fa: BeginTransaction,
  ): Kleisli<F, PgConnection, void> {
    return this.rawQuery('BEGIN TRANSACTION');
  }
  public visitCommit(fa: Commit): Kleisli<F, PgConnection, void> {
    return this.rawQuery('COMMIT');
  }
  public visitRollback(fa: Rollback): Kleisli<F, PgConnection, void> {
    return this.rawQuery('ROLLBACK');
  }
  public visitClose(fa: Close): Kleisli<F, PgConnection, void> {
    return Kleisli(conn =>
      this.F.fromPromise(this.F.delay(() => conn.client.end())),
    );
  }
  public visitMonotonic(fa: Monotonic): Kleisli<F, PgConnection, number> {
    return Kleisli(() => this.F.monotonic);
  }
  public visitRealTime(fa: RealTime): Kleisli<F, PgConnection, number> {
    return Kleisli(() => this.F.realTime);
  }
  public visitDelay<A>(fa: Delay<A>): Kleisli<F, PgConnection, A> {
    return Kleisli(() => this.F.delay(fa.thunk));
  }
  public visitThrowError<A>(fa: ThrowError<A>): Kleisli<F, PgConnection, A> {
    return Kleisli(() => this.F.throwError(fa.error));
  }
  public visitCanceled(fa: Canceled): Kleisli<F, PgConnection, void> {
    return Kleisli(() => this.F.canceled);
  }
  public visitPoll<A>(fa: Poll1<A>): Kleisli<F, PgConnection, A> {
    return Kleisli(conn =>
      fa.poll(fa.self.foldMap(this.KF)(this.liftK()).run(conn)),
    );
  }
  public visitUncancelable<A>(
    fa: Uncancelable<A>,
  ): Kleisli<F, PgConnection, A> {
    return Kleisli(conn =>
      this.F.uncancelable(poll =>
        fa
          .self(ConnectionIO.capturePoll(poll))
          .foldMap(this.KF)(this.liftK())
          .run(conn),
      ),
    );
  }
  public visitOnCancel<A>(fa: OnCancel<A>): Kleisli<F, PgConnection, A> {
    return Kleisli(conn =>
      this.F.onCancel_(
        fa.self.foldMap(this.KF)(this.liftK()).run(conn),
        fa.fin.foldMap(this.KF)(this.liftK()).run(conn),
      ),
    );
  }
  public visitHandleErrorWith<A>(
    fa: HandleErrorWith<A>,
  ): Kleisli<F, PgConnection, A> {
    return Kleisli(conn =>
      this.F.handleErrorWith_(
        fa.self.foldMap(this.KF)(this.liftK()).run(conn),
        e => fa.handle(e).foldMap(this.KF)(this.liftK()).run(conn),
      ),
    );
  }
  public visitSleep(fa: Sleep): Kleisli<F, PgConnection, void> {
    return Kleisli(() => this.F.sleep(fa.ms));
  }
  public visitReadExecutionContext(
    fa: ReadExecutionContext,
  ): Kleisli<F, PgConnection, ExecutionContext> {
    return Kleisli(() => this.F.readExecutionContext);
  }
  public visitExecuteOn<A>(fa: ExecuteOn<A>): Kleisli<F, PgConnection, A> {
    return Kleisli(conn =>
      this.F.executeOn_(
        fa.self.foldMap(this.KF)(this.liftK()).run(conn),
        fa.ec,
      ),
    );
  }
  public visitCont<K, R>(
    fa: ConnectionCont<K, R>,
  ): Kleisli<F, PgConnection, R> {
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
                nt(fa.foldMap(this.KF)(this.liftK()).run(conn)),
            ),
      ),
    );
  }
  public visitRef<A>(
    fa: ConnectionRef<A>,
  ): Kleisli<F, PgConnection, Ref<ConnectionIOF, A>> {
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
  ): Kleisli<F, PgConnection, Deferred<ConnectionIOF, A>> {
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
  ): Kleisli<F, PgConnection, Fiber<ConnectionIOF, Error, A>> {
    return Kleisli(conn =>
      pipe(
        this.F.fork(fa.self.foldMap(this.KF)(this.liftK()).run(conn)),
        this.F.map(
          fib =>
            new (class extends Fiber<ConnectionIOF, Error, A> {
              public get join(): ConnectionIO<
                Outcome<ConnectionIOF, Error, A>
              > {
                return ConnectionIO.lift(
                  new JoinFiber(fib as Fiber<unknown, Error, A>),
                );
              }

              public get cancel(): ConnectionIO<void> {
                return ConnectionIO.lift(
                  new CancelFiber(fib as Fiber<unknown, Error, A>),
                );
              }
            })(),
        ),
      ),
    );
  }
  public visitJoinFiber<A>(
    fa: JoinFiber<A>,
  ): Kleisli<F, PgConnection, Outcome<ConnectionIOF, Error, A>> {
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
  public visitFiberResult<A>(fa: FiberResult<A>): Kleisli<F, PgConnection, A> {
    return Kleisli(() => fa.fa as Kind<F, [A]>);
  }
  public visitCancelFiber(fa: CancelFiber): Kleisli<F, PgConnection, void> {
    return Kleisli(() => fa.fiber.cancel as Kind<F, [void]>);
  }

  public visitNever(fa: Never): Kleisli<F, PgConnection, never> {
    return Kleisli(() => this.F.never);
  }
  public visitSuspend(fa: Suspend): Kleisli<F, PgConnection, void> {
    return Kleisli(() => this.F.suspend);
  }
}
