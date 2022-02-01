// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class Set<A> {
  public readonly __void!: void;

  public abstract readonly size: number;
}

export class Bin<A> extends Set<A> {
  public readonly tag = 'bin';
  public readonly size: number;
  public constructor(
    public readonly value: A,
    public readonly lhs: Set<A>,
    public readonly rhs: Set<A>,
  ) {
    super();
    this.size = 1 + lhs.size + rhs.size;
  }
}

export const Empty = new (class Empty extends Set<never> {
  public readonly tag = 'empty';
  public readonly size: number = 0;
})();
export type Empty = typeof Empty;

export type Node<A> = Bin<A> | Empty;

export const toNode = <A>(_: Set<A>): Node<A> => _ as any;
