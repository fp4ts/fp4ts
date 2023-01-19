// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ConnectionIO } from '@fp4ts/sql-core';
import {
  ClientBase as PgClientBase,
  Client as PgClient,
  PoolClient as PgPoolClient,
} from 'pg';

export interface PgConnection {
  readonly client: PgClientBase;
  close(): ConnectionIO<void>;
}

export class PgClientConnection implements PgConnection {
  public constructor(public readonly client: PgClient) {}

  public close(): ConnectionIO<void> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() => this.client.end()),
    );
  }
}

export class PgPoolConnection implements PgConnection {
  public constructor(public readonly client: PgPoolClient) {}

  public close(): ConnectionIO<void> {
    return ConnectionIO.delay(() => this.client.release());
  }
}
