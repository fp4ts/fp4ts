// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class OrderedMap<K, V> {
  readonly __void!: void;

  readonly _K!: () => K;
  readonly _V!: () => V;
}

export class Bin<K, V> extends OrderedMap<K, V> {
  public readonly tag = 'bin';
  public constructor(
    public readonly key: K,
    public readonly value: V,
    public readonly height: number,
    public readonly lhs: OrderedMap<K, V>,
    public readonly rhs: OrderedMap<K, V>,
  ) {
    super();
  }
}

export const Empty = new (class Empty extends OrderedMap<never, never> {
  public readonly tag = 'empty';
})();
export type Empty = typeof Empty;

export type Node<K, V> = Bin<K, V> | Empty;

export const toNode = <K, V>(_: OrderedMap<K, V>): Node<K, V> => _ as any;
