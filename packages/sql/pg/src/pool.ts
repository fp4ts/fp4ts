// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Pool as PgPool,
  PoolConfig,
  QueryArrayConfig,
  QueryArrayResult,
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from 'pg';
import { Kind } from '@fp4ts/core';
import { Async, Resource } from '@fp4ts/effect';
import { ClientBase } from './client-base';

export class PoolClient<F> extends ClientBase<F> {}

export class Pool<F> {
  public static make = <F>(
    F: Async<F>,
    config?: PoolConfig,
  ): Resource<F, Pool<F>> =>
    Resource.make(F)(
      F.delay(() => new PgPool(config)),
      pgPool => F.void(F.fromPromise(F.delay(() => pgPool.end()))),
    ).map(pgPool => new Pool(F, pgPool));

  private constructor(
    protected readonly F: Async<F>,
    protected readonly underlying: PgPool,
  ) {}

  public connect(): Resource<F, PoolClient<F>> {
    const F = this.F;
    return Resource.make(F)(
      F.fromPromise(F.delay(() => this.underlying.connect())),
      (pgPoolClient, e) =>
        e.fold(
          () => F.delay(() => pgPoolClient.release()),
          e => F.delay(() => pgPoolClient.release(e)),
          () => F.delay(() => pgPoolClient.release()),
        ),
    ).map(pgPoolClient => new PoolClient(F, pgPoolClient));
  }

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
    const F = this.F;
    return F.fromPromise(F.delay(() => this.underlying.query(query, values)));
  }
}
