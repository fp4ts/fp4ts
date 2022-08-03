// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Async } from '@fp4ts/effect';
import PgCursor from 'pg-cursor';

export class Cursor<F, Row = any> {
  public constructor(
    private readonly F: Async<F>,
    private readonly underlying: PgCursor<Row>,
  ) {}

  public read(maxRows: number): Kind<F, [Row[]]> {
    const F = this.F;
    return F.fromPromise(F.delay(() => this.underlying.read(maxRows)));
  }
}
