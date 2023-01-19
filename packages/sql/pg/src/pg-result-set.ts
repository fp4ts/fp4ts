// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { QueryResult as PgQueryResult } from 'pg';
import PgCursor from 'pg-cursor';
import { ConnectionIO, ResultSet, StreamedResultSet } from '@fp4ts/sql-core';
import { Chunk } from '@fp4ts/stream';

export class PgResultSet extends ResultSet {
  public constructor(private readonly result: PgQueryResult) {
    super();
  }

  public getRows(): ConnectionIO<unknown[]> {
    return ConnectionIO.pure(this.result.rows);
  }

  public getRowCount(): ConnectionIO<number> {
    return ConnectionIO.pure(this.result.rowCount);
  }
}

export class PgStreamedResultSet extends StreamedResultSet {
  public constructor(protected readonly cursor: PgCursor) {
    super();
  }

  public getNextChunk(chunkSize: number): ConnectionIO<Chunk<unknown>> {
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
