// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class Map<K, V> {
  readonly __void!: void;

  readonly _K!: () => K;
  readonly _V!: () => V;

  public abstract readonly size: number;
}

export class Bin<K, V> extends Map<K, V> {
  public readonly tag = 'bin';
  public readonly size: number;

  public constructor(
    public readonly key: K,
    public readonly value: V,
    public readonly lhs: Map<K, V>,
    public readonly rhs: Map<K, V>,
  ) {
    super();
    this.size = 1 + lhs.size + rhs.size;
  }
}

export const Empty = new (class Empty extends Map<never, never> {
  public readonly tag = 'empty';
  public readonly size: number = 0;
})();
export type Empty = typeof Empty;

export type Node<K, V> = Bin<K, V> | Empty;

export const toNode = <K, V>(_: Map<K, V>): Node<K, V> => _ as any;
