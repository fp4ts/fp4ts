// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { PoolConfig, ClientConfig, Client, Pool } from 'pg';
import { Async, Resource } from '@fp4ts/effect';
import { Strategy, TransactorAux } from '@fp4ts/sql-core';
import {
  PgClientConnection,
  PgConnection,
  PgPoolConnection,
} from './pg-connection';
import { PgInterpreter } from './pg-interpreter';

export const PgTransactor = Object.freeze({
  make: <F>(F: Async<F>, config?: ClientConfig): PgTransactor<F> =>
    new TransactorAux(
      F,
      config,
      Strategy.default,
      new PgInterpreter(F).liftK(),
      config =>
        Resource.make(F)(
          F.fromPromise(
            F.delay(() => {
              const client = new Client(config);
              return client.connect().then(() => client);
            }),
          ),
          client => F.fromPromise(F.delay(() => client.end())),
        ).map(client => new PgClientConnection(client)),
    ),
});
export type PgTransactor<F> = TransactorAux<
  F,
  ClientConfig | undefined,
  PgConnection
>;

export const PgPoolTransactor = Object.freeze({
  make: <F>(
    F: Async<F>,
    config?: PoolConfig,
  ): Resource<F, PgPoolTransactor<F>> =>
    Resource.make(F)(
      F.delay(() => new Pool(config)),
      pool => F.fromPromise(F.delay(() => pool.end())),
    ).map(
      pool =>
        new TransactorAux(
          F,
          pool,
          Strategy.default,
          new PgInterpreter(F).liftK(),
          pool =>
            Resource.make(F)(
              F.fromPromise(F.delay(() => pool.connect())),
              (client, ec) =>
                ec.fold(
                  () => F.delay(() => client.release()),
                  e => F.delay(() => client.release(e)),
                  () => F.delay(() => client.release()),
                ),
            ).map(client => new PgPoolConnection(client)),
        ),
    ),
});
export type PgPoolTransactor<F> = TransactorAux<F, Pool, PgConnection>;
