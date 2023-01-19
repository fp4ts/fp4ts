// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Readable } from 'stream';
import { Left, None, Option, Right, Some } from '@fp4ts/cats';
import { Chunk } from '@fp4ts/stream';
import { ConnectionIO } from '@fp4ts/sql-core';
import { ResultSet, StreamedResultSet } from '@fp4ts/sql-core/lib/free';

export class MariaResultSet extends ResultSet {
  public constructor(private readonly result: any) {
    super();
  }

  public getRows(): ConnectionIO<unknown[]> {
    return ConnectionIO.pure([...this.result]);
  }

  public getRowCount(): ConnectionIO<number> {
    return 'affectedRows' in this.result
      ? ConnectionIO.pure(this.result.affectedRows)
      : ConnectionIO.pure(this.result.length);
  }
}

export class MariaStreamedResultSet extends StreamedResultSet {
  public constructor(private readonly readable: Readable) {
    super();
  }

  public getNextChunk(chunkSize: number): ConnectionIO<Chunk<unknown>> {
    // The continuation of the data returns
    //  1. Some(void) in case there is some more data to be consumed
    //  2. None       in case the stream has been closed (fully consumed and/or closed because of some other reason)
    // or throws an error when there's an error encountered while waiting for the data to be consumed
    const waitForData = (): ConnectionIO<Option<void>> => {
      if (this.readable.destroyed) {
        return ConnectionIO.pure(None);
      }

      return ConnectionIO.async<Option<void>>(cb =>
        ConnectionIO.delay(() => {
          const cleanup = (): void => {
            this.readable.removeListener('readable', readable);
            this.readable.removeListener('error', error);
            this.readable.removeListener('end', end);
          };
          const readable = (): void => {
            cleanup();
            cb(Right(Some<void>(undefined)));
          };
          const error = (e: Error): void => {
            cleanup();
            cb(Left(e));
          };
          const end = (): void => {
            cleanup();
            cb(Right(None));
          };
          this.readable.on('readable', readable);
          this.readable.on('error', error);
          this.readable.on('end', end);
          return Some(ConnectionIO.delay(cleanup));
        }),
      );
    };

    const go = (
      acc: Chunk<unknown>,
      cnt: number,
    ): ConnectionIO<Chunk<unknown>> =>
      ConnectionIO.defer(() => {
        let next: unknown;
        while (cnt < chunkSize && (next = this.readable.read())) {
          acc = acc['+++'](Chunk(next));
          cnt += 1;
        }
        return cnt >= chunkSize
          ? ConnectionIO.pure(acc)
          : waitForData().flatMap(opt =>
              opt.fold(
                () => ConnectionIO.pure(acc),
                () => go(acc, cnt),
              ),
            );
      });
    return ConnectionIO.defer(() => go(Chunk.empty, 0));
  }

  public close(): ConnectionIO<void> {
    return ConnectionIO.delay(() => this.readable.destroy()).map(() => {});
  }
}
