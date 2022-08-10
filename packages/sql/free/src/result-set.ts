// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '@fp4ts/cats';
import { Chunk } from '@fp4ts/stream';
import { ConnectionIO } from './connection-io';

export abstract class ResultSet {
  private readonly __void!: void;

  public abstract getRows<A>(): ConnectionIO<A[]>;
}

export abstract class StreamedResultSet {
  private readonly __void!: void;

  public abstract getNextChunk<A>(
    chunkSize: number,
  ): ConnectionIO<Option<Chunk<A>>>;

  public abstract close(): ConnectionIO<void>;
}
