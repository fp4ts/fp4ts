// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Client as PGClient, ClientConfig } from 'pg';
import { Async, Resource } from '@fp4ts/effect';
import { ClientBase } from './client-base';

export class Client<F> extends ClientBase<F> {
  public readonly user?: string | undefined;
  public readonly database?: string | undefined;
  public readonly port: number;
  public readonly host: string;
  public readonly password?: string | undefined;
  public readonly ssl: boolean;

  public static make = <F>(
    F: Async<F>,
    config?: string | ClientConfig,
  ): Resource<F, Client<F>> =>
    Resource.make(F)(
      F.fromPromise(
        F.delay(() => {
          const pgClient = new PGClient(config);
          return pgClient.connect().then(() => pgClient);
        }),
      ),
      pgClient => F.void(F.fromPromise(F.delay(() => pgClient.end()))),
    ).map(pgClient => new Client(F, pgClient));

  private constructor(F: Async<F>, underlying: PGClient) {
    super(F, underlying);
    this.user = underlying.user;
    this.database = underlying.database;
    this.port = underlying.port;
    this.host = underlying.host;
    this.password = underlying.password;
    this.ssl = underlying.ssl;
  }
}
