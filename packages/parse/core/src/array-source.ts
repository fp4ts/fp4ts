// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Source } from './source';

export class ArraySource<A> extends Source<A, ArraySource<A>> {
  public static fromString<A>(source: A[]): ArraySource<A> {
    return new ArraySource(source, 0);
  }

  private constructor(public readonly source: A[], idx: number) {
    super(idx, source.length);
  }

  protected elem(idx: number): A {
    return this.source[idx];
  }

  protected copy({
    idx = this.cursor,
  }: Partial<{ readonly idx: number }> = {}): ArraySource<A> {
    return new ArraySource(this.source, idx);
  }
}
