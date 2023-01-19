// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Chunk } from '@fp4ts/stream';
import { ConnectionIO } from './connection-io';

export abstract class ResultSet {
  private readonly __void!: void;

  public abstract getRows(): ConnectionIO<unknown[]>;
  public abstract getRowCount(): ConnectionIO<number>;
}

export abstract class StreamedResultSet {
  private readonly __void!: void;

  public abstract getNextChunk(chunkSize: number): ConnectionIO<Chunk<unknown>>;
  public abstract close(): ConnectionIO<void>;
}
