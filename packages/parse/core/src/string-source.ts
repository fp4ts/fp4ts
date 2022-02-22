// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from '@fp4ts/core';
import { Source } from './source';

export class StringSource extends Source<Char, StringSource> {
  public static fromString(source: string): StringSource {
    return new StringSource(source, 0);
  }

  private constructor(public readonly source: string, idx: number) {
    super(idx, source.length);
  }

  protected elem(idx: number): Char {
    return this.source[idx] as Char;
  }

  protected copy({
    idx = this.cursor,
  }: Partial<{ readonly idx: number }> = {}): StringSource {
    return new StringSource(this.source, idx);
  }
}
