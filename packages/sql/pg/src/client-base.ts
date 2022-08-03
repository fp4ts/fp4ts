// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  ClientBase as PGClientBase,
  QueryArrayConfig,
  QueryArrayResult,
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from 'pg';
import PgCursor, { CursorQueryConfig } from 'pg-cursor';
import { Kind } from '@fp4ts/core';
import { Some } from '@fp4ts/cats';
import { Async, Resource } from '@fp4ts/effect';
import { Chunk, Stream } from '@fp4ts/stream';

import { Cursor } from './cursor';
import { PgQueryStreamConfig } from './query-stream';

export abstract class ClientBase<F> {
  public constructor(
    protected readonly F: Async<F>,
    protected readonly underlying: PGClientBase,
  ) {}

  public query<R extends any[] = any[], I extends any[] = any[]>(
    queryConfig: QueryArrayConfig<I>,
    values?: I,
  ): Kind<F, [QueryArrayResult<R>]>;
  public query<R extends QueryResultRow = any, I extends any[] = any[]>(
    queryConfig: QueryConfig<I>,
  ): Kind<F, [QueryResult<R>]>;
  public query<R extends QueryResultRow = any, I extends any[] = any[]>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: I,
  ): Kind<F, [QueryResult<R>]>;
  public query(query: any, values?: any): Kind<F, [any]> {
    return this.F.fromPromise(
      this.F.delay(() => this.underlying.query(query, values)),
    );
  }

  public cursor<Row = any>(
    query: string,
    values?: any[],
    config?: CursorQueryConfig,
  ): Resource<F, Cursor<F, Row>> {
    const F = this.F;
    return Resource.make(F)(
      F.delay(() => this.underlying.query(new PgCursor(query, values, config))),
      pgCursor => F.fromPromise(F.delay(() => pgCursor.close())),
    ).map(pgCursor => new Cursor(F, pgCursor));
  }

  public stream<Row = any>(
    query: string,
    values?: any[],
    config: PgQueryStreamConfig = {},
  ): Stream<F, Row> {
    const F = this.F;
    return Stream.resource(F)(this.cursor(query, values, config)).flatMap(
      cursor =>
        Stream.repeatEval(
          F.map_(cursor.read(config.batchSize ?? 5), xs =>
            Some(Chunk.fromArray(xs)).filter(chunk => chunk.nonEmpty),
          ),
        ).unNoneTerminate(),
    ).unchunks;
  }
}
