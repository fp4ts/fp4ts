// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Source } from '@fp4ts/parse-kernel';

export class ArraySource<A> extends Source<A, ArraySource<A>> {
  public static fromArray<A>(source: A[]): ArraySource<A> {
    return new ArraySource(source, 1);
  }

  private constructor(public readonly source: A[], cursor: number) {
    super(cursor, source.length);
  }

  protected elem(cursor: number): A {
    return this.source[cursor - 1];
  }

  protected copy({
    cursor = this.cursor,
  }: Partial<{ readonly cursor: number }> = {}): ArraySource<A> {
    return new ArraySource(this.source, cursor);
  }
}
