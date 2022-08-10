// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ResultSet, StreamedResultSet } from './result-set';
import { ConnectionIO } from './connection-io';

export abstract class PreparedStatement {
  private readonly __void!: void;

  public abstract query(): ConnectionIO<ResultSet>;
  public abstract queryStream(): ConnectionIO<StreamedResultSet>;
  public abstract update(): ConnectionIO<number>;
  public abstract close(): ConnectionIO<void>;
}
