// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { None, Option, Some } from '@fp4ts/cats';
import { TokenTypeTag } from './token-type';

export abstract class Source<A, Self extends Source<A, Self>> {
  readonly [TokenTypeTag]!: A;
  public constructor(
    public readonly cursor: number,
    protected readonly size: number,
  ) {
    assert(size >= 0, 'Size cannot be negative');
  }

  public get isEmpty(): boolean {
    return this.cursor > this.size;
  }
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }

  protected abstract elem(cursor: number): A;
  protected abstract copy(props?: Partial<Props>): Self;

  public get uncons(): Option<[A, Self]> {
    return this.cursor <= this.size
      ? Some([this.elem(this.cursor), this.copy({ cursor: this.cursor + 1 })])
      : None;
  }
}
type Props = {
  readonly cursor: number;
};
