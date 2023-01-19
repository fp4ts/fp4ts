// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ConnectionIO } from '@fp4ts/sql-core';
import { Connection, PoolConnection } from 'mariadb';

export interface MariaConnection {
  readonly client: PoolConnection | Connection;
  close(): ConnectionIO<void>;
}

export class MariaClientConnection implements MariaConnection {
  public constructor(public readonly client: Connection) {}

  public close(): ConnectionIO<void> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() => this.client.end()),
    );
  }
}

export class MariaPoolConnection implements MariaConnection {
  public constructor(public readonly client: PoolConnection) {}

  public close(): ConnectionIO<void> {
    return ConnectionIO.fromPromise(
      ConnectionIO.delay(() => this.client.release()),
    );
  }
}
