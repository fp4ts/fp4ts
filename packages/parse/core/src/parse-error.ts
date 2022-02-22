// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Compare } from '@fp4ts/cats';
import { SourcePosition } from './source-position';

export class ParseError {
  public static empty(sp: SourcePosition): ParseError {
    return new ParseError(sp, []);
  }

  public constructor(
    public readonly position: SourcePosition,
    public readonly msgs: string[],
  ) {}

  public get isEmpty(): boolean {
    return this.msgs.length === 0;
  }
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }

  public merge(that: ParseError): ParseError {
    if (that.isEmpty && this.nonEmpty) return this;
    if (this.isEmpty && that.nonEmpty) return that;
    switch (this.position.compare(that.position)) {
      case Compare.EQ:
        return new ParseError(this.position, [...this.msgs, ...that.msgs]);
      case Compare.LT:
        return that;
      case Compare.GT:
        return this;
    }
  }
}
