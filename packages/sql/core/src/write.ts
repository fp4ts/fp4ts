// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class Write<in A> {
  public static readonly unit: Write<void> = new Write(() => []);

  public constructor(public readonly toRow: (a: A) => unknown[]) {}

  public contramap<A0>(f: (a0: A0) => A): Write<A0> {
    return new Write(a0 => this.toRow(f(a0)));
  }
}
