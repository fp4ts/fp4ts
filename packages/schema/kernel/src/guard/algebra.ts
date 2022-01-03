// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class Guard<I, A extends I> {
  private readonly __void!: void;

  public constructor(public readonly test: (i: I) => i is A) {}
}
