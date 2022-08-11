// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { Chain, Kleisli } from '@fp4ts/cats';
import { Read, Write } from '@fp4ts/sql-core';
import {
  PreparedStatement,
  ResultSet,
  StreamedResultSet,
  PrepareStatement,
  BeginTransaction,
  Commit,
  Rollback,
  Close,
  ConnectionIO,
  FragmentVisitor,
  EmptyFragment,
  QueryFragment,
  ParamFragment,
  ConcatFragment,
  KleisliInterpreter,
} from '@fp4ts/sql-core/lib/free';
import { Chunk } from '@fp4ts/stream';

import {
  Client as PgClient,
  ClientBase as PgClientBase,
  QueryResult,
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

  public getRowCount(): ConnectionIO<number> {
    return ConnectionIO.pure(this.result.rowCount);
  }
}

class PgStreamedResultSet extends StreamedResultSet {
  public constructor(protected readonly cursor: PgCursor) {
    super();
  }

  public getNextChunk<A>(chunkSize: number): ConnectionIO<Chunk<A>> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() => this.cursor.read(chunkSize)),
    ).map(Chunk.fromArray);
  }

  public close(): ConnectionIO<void> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() => this.cursor.close()),
    );
  }
}

class PgPreparedStatement extends PreparedStatement {
  public constructor(
    public readonly fragment: PgFragment,
    private readonly underlying: PgClientBase,
  ) {
    super();
  }

  public set<A>(W: Write<A>): (a: A) => ConnectionIO<PreparedStatement> {
    return a =>
      ConnectionIO.pure(
        new PgPreparedStatement(
          new PgFragment(
            this.fragment.sql,
            this.fragment.params['+++'](Chain.fromArray(W.toRow(a))),
          ),
          this.underlying,
        ),
      );
  }

  public query(): ConnectionIO<ResultSet> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() =>
        this.underlying.query({
          text: this.fragment.sql,
          values: this.fragment.params.toArray,
          rowMode: 'array',
        }),
      ),
    ).map(result => new PgResultSet(result));
  }

  public queryStream(): ConnectionIO<StreamedResultSet> {
    return ConnectionIO.delay(() =>
      this.underlying.query(
        new PgCursor(this.fragment.sql, this.fragment.params.toArray, {
          rowMode: 'array',
        }),
      ),
    ).map(cursor => new PgStreamedResultSet(cursor));
  }

  public close(): ConnectionIO<void> {
    return ConnectionIO.unit;
  }
}

class PgFragment {
  public static readonly empty: PgFragment = new PgFragment('', Chain.empty);
  public static query(q: string): PgFragment {
    return new PgFragment(q, Chain.empty);
  }
  public static param(p: unknown): PgFragment {
    return new PgFragment('', Chain(p));
  }

  public constructor(
    public readonly sql: string,
    public readonly params: Chain<unknown>,
  ) {}

  public concat(that: PgFragment): PgFragment {
    return new PgFragment(this.sql + that.sql, this.params['+++'](that.params));
  }
  public '+++'(that: PgFragment): PgFragment {
    return this.concat(that);
  }
}

class PgFragmentVisitor extends FragmentVisitor<PgFragment> {
  private paramCount: number = 0;

  public visitEmpty(f: EmptyFragment): PgFragment {
    return PgFragment.empty;
  }
  public visitQuery(f: QueryFragment): PgFragment {
    return PgFragment.query(f.value);
  }
  public visitParam(f: ParamFragment): PgFragment {
    return PgFragment.query(`$${++this.paramCount}`)['+++'](
      PgFragment.param(f.value),
    );
  }
  public visitConcat(f: ConcatFragment): PgFragment {
    return f.lhs.visit(this)['+++'](f.rhs.visit(this));
  }
}

export class PgConnectionOpVisitor<F> extends KleisliInterpreter<
  F,
  PgConnection
> {
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
      this.F.pure(
        new PgPreparedStatement(
          fa.fragment.visit(new PgFragmentVisitor()),
          conn.client,
        ),
      ),
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
}
