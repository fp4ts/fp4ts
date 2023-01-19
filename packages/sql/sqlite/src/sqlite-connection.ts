// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left } from '@fp4ts/cats';
import { ConnectionIO } from '@fp4ts/sql-core';
import { Database } from 'sqlite3';

export class SqliteConnection {
  public constructor(public readonly db: Database) {}

  public close(): ConnectionIO<void> {
    return ConnectionIO.async_(cb =>
      this.db.close(err => cb(err ? Left(err) : Either.rightUnit)),
    );
  }
}
