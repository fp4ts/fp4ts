// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class Consumed<A> {
  public static readonly Consumed = <A>(a: A) => new Consumed('consumed', a);
  public static readonly Empty = <A>(a: A) => new Consumed('empty', a);

  public constructor(
    public readonly tag: 'consumed' | 'empty',
    public readonly value: A,
  ) {}
}
