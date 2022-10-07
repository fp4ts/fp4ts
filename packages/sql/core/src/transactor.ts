// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { FunctionK, Kleisli, KleisliF } from '@fp4ts/cats';
import { Async, Resource } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream';
import { ConnectionIO, ConnectionIOF, ConnectionOpF } from './free';

export class Strategy {
  public static get default(): Strategy {
    return new Strategy(
      ConnectionIO.beginTransaction(),
      ConnectionIO.commit(),
      ConnectionIO.rollback(),
      ConnectionIO.unit,
    );
  }
  public static get unit(): Strategy {
    return new Strategy(
      ConnectionIO.unit,
      ConnectionIO.unit,
      ConnectionIO.unit,
      ConnectionIO.unit,
    );
  }

  private constructor(
    public readonly before: ConnectionIO<void>,
    public readonly after: ConnectionIO<void>,
    public readonly onError: ConnectionIO<void>,
    public readonly always: ConnectionIO<void>,
  ) {}

  public get resource(): Resource<ConnectionIOF, void> {
    const F = ConnectionIO.Async;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Resource.Monad<ConnectionIOF>().do(function* (_) {
      yield* _(Resource.make(F)(F.unit, () => self.always));
      yield* _(
        Resource.make(F)(self.before, (_, ec) =>
          ec.fold(
            () => self.onError,
            () => self.onError,
            () => self.after,
          ),
        ),
      );
    });
  }

  public copy({
    before = this.before,
    after = this.after,
    onError = this.onError,
    always = this.always,
  }: Partial<StrategyProps> = {}): Strategy {
    return new Strategy(before, after, onError, always);
  }
}

type Interpreter<F, C> = FunctionK<ConnectionOpF, $<KleisliF, [F, C]>>;

export class TransactorAux<F, K, C> {
  public constructor(
    public readonly F: Async<F>,
    public readonly kernel: K,
    public readonly strategy: Strategy,
    public readonly interpret: Interpreter<F, C>,
    private readonly connect: (kernel: K) => Resource<F, C>,
  ) {}

  public modifyStrategy(f: (s: Strategy) => Strategy): TransactorAux<F, K, C> {
    return new TransactorAux(
      this.F,
      this.kernel,
      f(this.strategy),
      this.interpret,
      this.connect,
    );
  }

  private get KF() {
    return Kleisli.Monad<F, C>(this.F);
  }

  private run(conn: C): FunctionK<ConnectionIOF, F> {
    return <A>(fa: ConnectionIO<A>): Kind<F, [A]> =>
      fa.foldMap(this.KF)(this.interpret)(conn);
  }

  public rawTrans<A>(fa: ConnectionIO<A>): Kind<F, [A]> {
    return this.connect(this.kernel).use(this.F)(conn =>
      fa.foldMap(Kleisli.Monad<F, C>(this.F))(this.interpret)(conn),
    );
  }

  public trans<A>(fa: ConnectionIO<A>): Kind<F, [A]> {
    return this.connect(this.kernel).use(this.F)(conn =>
      this.strategy.resource
        .use(ConnectionIO.Async)(() => fa)
        .foldMap(this.KF)(this.interpret)(conn),
    );
  }

  public rawTransStream() {
    return <A>(sa: Stream<ConnectionIOF, A>): Stream<F, A> =>
      Stream.resource(this.F)(this.connect(this.kernel)).flatMap(conn =>
        sa.mapK(this.run(conn)),
      ).scope;
  }

  public transStream() {
    return <A>(sa: Stream<ConnectionIOF, A>): Stream<F, A> =>
      Stream.resource(this.F)(this.connect(this.kernel)).flatMap(conn =>
        Stream.resource(ConnectionIO.Async)(this.strategy.resource)
          .flatMap(() => sa)
          .mapK(this.run(conn)),
      ).scope;
  }

  /**
   * Wraps the underlying effect `fa` in a transaction using this transactor.
   *
   * This is an escape hatch, when one needs to interleave `ConnectionIO` composition
   * with an arbitrary effect type F.
   *
   * @note Since this method adds explicit transaction boundaries, the inner
   * transactions of `ConnectionIO` should use `translate`.
   */
  public withTransaction<A>(fa: Kind<F, [A]>): Kind<F, [A]> {
    return this.F.bracketOutcome_(
      ConnectionIO.beginTransaction().translate(this),
      () => fa,
      (_, oc) =>
        oc
          .fold(
            () => ConnectionIO.rollback(),
            () => ConnectionIO.rollback(),
            () => ConnectionIO.commit(),
          )
          .translate(this),
    );
  }
}

export type Transactor<F> = TransactorAux<F, any, any>;

interface StrategyProps {
  readonly before: ConnectionIO<void>;
  readonly after: ConnectionIO<void>;
  readonly onError: ConnectionIO<void>;
  readonly always: ConnectionIO<void>;
}
