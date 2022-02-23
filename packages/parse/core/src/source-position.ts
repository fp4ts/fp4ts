// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Compare, Ord } from '@fp4ts/cats';

export class SourcePosition {
  private __void!: void;

  public constructor(
    public readonly line: number,
    public readonly column: number,
  ) {}

  public compare(that: SourcePosition): Compare {
    // prettier-ignore
    if (this.line < that.line || (this.line === that.line && this.column < that.column)) {
      return Compare.LT;
    }
    // prettier-ignore
    if (this.line > that.line || (this.line === that.line && this.column > that.column)) {
      return Compare.GT;
    }
    if (this.line === that.line && this.column === that.column) {
      return Compare.EQ;
    }

    throw new Error('Unhandled case');
  }

  public toString(): string {
    return `${this.line}:${this.column}`;
  }

  // -- Instances

  public get Ord(): Ord<SourcePosition> {
    return sourceLocationOrd();
  }
}

const sourceLocationOrd: Lazy<Ord<SourcePosition>> = lazyVal(() =>
  Ord.of({
    compare: (x, y) => x.compare(y),
  }),
);
