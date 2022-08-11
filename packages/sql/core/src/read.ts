// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class Read<out A> {
  public constructor(public readonly fromRow: (r: unknown) => A) {}

  public map<B>(f: (a: A) => B): Read<B> {
    return new Read(a => f(this.fromRow(a)));
  }
}
