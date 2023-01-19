// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Left, Right } from '@fp4ts/cats';
import { ConnectionIO, ResultSet, StreamedResultSet } from '@fp4ts/sql-core';
import { Chunk } from '@fp4ts/stream';
import { Statement } from 'sqlite3';

export class SqliteResultSet extends ResultSet {
  public constructor(private readonly stmt: Statement) {
    super();
  }

  public getRowCount(): ConnectionIO<number> {
    return ConnectionIO.async_<number>(cb =>
      this.stmt.each(
        () => {},
        (err, count) => cb(err ? Left(err) : Right(count)),
      ),
    );
  }

  public getRows(): ConnectionIO<unknown[]> {
    return ConnectionIO.async_<unknown[]>(cb =>
      this.stmt.all((err, rows) => cb(err ? Left(err) : Right(rows))),
    );
  }
}

export class SqliteStreamedResultSet extends StreamedResultSet {
  public constructor(private readonly stmt: Statement) {
    super();
  }

  public getNextChunk(chunkSize: number): ConnectionIO<Chunk<unknown>> {
    return ConnectionIO.async_(cb => {
      const go = (chunk: Chunk<unknown>, count: number): any =>
        count >= chunkSize
          ? cb(Right(chunk))
          : this.stmt.get((err, row) =>
              err
                ? cb(Left(err))
                : row == null
                ? cb(Right(chunk))
                : go(chunk['+++'](Chunk(row)), count + 1),
            );
      go(Chunk.empty, 0);
    });
  }

  public close(): ConnectionIO<void> {
    return ConnectionIO.unit;
  }
}
