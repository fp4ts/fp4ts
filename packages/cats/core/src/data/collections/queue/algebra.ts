// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List } from '../list';

export class Queue<A> {
  private readonly __void!: void;
  public constructor(
    public readonly _in: List<A>,
    public readonly _out: List<A>,
  ) {}
}
