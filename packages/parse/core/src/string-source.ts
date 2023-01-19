// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from '@fp4ts/core';
import { None, Option, Some } from '@fp4ts/cats';
import { Source } from '@fp4ts/parse-kernel';

export class StringSource extends Source<Char, StringSource> {
  public static fromString(source: string): StringSource {
    return new StringSource(source, 1);
  }

  private constructor(public readonly source: string, cursor: number) {
    super(cursor, source.length);
  }

  protected elem(cursor: number): Char {
    return this.source.charAt(cursor - 1) as Char;
  }

  protected copy({
    cursor = this.cursor,
  }: Partial<{ readonly cursor: number }> = {}): StringSource {
    return new StringSource(this.source, cursor);
  }

  public drop(n: number): StringSource {
    return this.copy({ cursor: this.cursor + n });
  }

  public unconsN(n: number): Option<[string, StringSource]> {
    return this.cursor + n <= this.size
      ? Some([
          this.source.substring(0, n),
          this.copy({ cursor: this.cursor + n }),
        ])
      : None;
  }
}
