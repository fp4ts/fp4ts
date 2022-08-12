// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Async, Resource } from '@fp4ts/effect';
import { Strategy, TransactorAux } from '@fp4ts/sql-core';
import { ConnectionConfig, createConnection } from 'mariadb';
import { MariaClientConnection } from './maria-connection';
import { MariaInterpreter } from './maria-interpreter';

export const MariaTransactor = Object.freeze({
  make: <F>(F: Async<F>, config: ConnectionConfig): MariaTransactor<F> =>
    new TransactorAux(
      F,
      config,
      Strategy.default,
      new MariaInterpreter(F).liftK(),
      config =>
        Resource.make(F)(
          F.fromPromise(F.delay(() => createConnection(config))),
          conn => F.fromPromise(F.delay(() => conn.end())),
        ).map(conn => new MariaClientConnection(conn)),
    ),
});
export type MariaTransactor<F> = TransactorAux<
  F,
  ConnectionConfig,
  MariaClientConnection
>;
