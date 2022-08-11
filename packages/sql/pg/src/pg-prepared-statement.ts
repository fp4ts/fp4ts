// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ClientBase as PgClientBase } from 'pg';
import PgCursor from 'pg-cursor';
import { Chain } from '@fp4ts/cats';
import {
  ConnectionIO,
  PreparedStatement,
  ResultSet,
  StreamedResultSet,
  Write,
} from '@fp4ts/sql-core';
import { PgResultSet, PgStreamedResultSet } from './pg-result-set';
import { PgFragment } from './pg-fragment';

export class PgPreparedStatement extends PreparedStatement {
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
        this.underlying.query(this.fragment.sql, this.fragment.params.toArray),
      ),
    ).map(result => new PgResultSet(result));
  }

  public queryStream(): ConnectionIO<StreamedResultSet> {
    return ConnectionIO.delay(() =>
      this.underlying.query(
        new PgCursor(this.fragment.sql, this.fragment.params.toArray),
      ),
    ).map(cursor => new PgStreamedResultSet(cursor));
  }

  public close(): ConnectionIO<void> {
    return ConnectionIO.unit;
  }
}
