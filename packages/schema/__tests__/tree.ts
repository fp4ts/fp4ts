// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '@fp4ts/cats';
import { $type, TyK, TyVar } from '@fp4ts/core';

export abstract class Tree<K, A> {
  private readonly __void!: void;

  public abstract readonly toArray: A[];
}

export class Bin<K, A> extends Tree<K, A> {
  public readonly tag = 'bin';
  public constructor(
    public readonly k: K,
    public readonly v: A,
    public readonly lhs: Tree<K, A>,
    public readonly rhs: Tree<K, A>,
  ) {
    super();
  }

  public get toArray(): A[] {
    return [...this.lhs.toArray, this.v, ...this.rhs.toArray];
  }
}

export const Tip: Tree<never, never> = new (class Tip extends Tree<
  never,
  never
> {
  public readonly tag = 'tip';
  public readonly toArray = [];
})();

export interface TreeK extends TyK<[unknown, unknown]> {
  [$type]: Tree<TyVar<this, 0>, TyVar<this, 1>>;
}
export interface BinK extends TyK<[unknown, unknown]> {
  [$type]: Bin<TyVar<this, 0>, TyVar<this, 1>>;
}
export interface TipK extends TyK<[unknown, unknown]> {
  [$type]: typeof Tip;
}

export class Tree1<K, A> {
  private readonly __void!: void;
  public constructor(
    public readonly k: K,
    public readonly v: A,
    public readonly lhs: Option<Tree1<K, A>>,
    public readonly rhs: Option<Tree1<K, A>>,
  ) {}

  public get toArray(): A[] {
    return [
      ...this.lhs.map(t => t.toArray).getOrElse(() => []),
      this.v,
      ...this.rhs.map(t => t.toArray).getOrElse(() => []),
    ];
  }
}

export interface Tree1K extends TyK<[unknown, unknown]> {
  [$type]: Tree1<TyVar<this, 0>, TyVar<this, 1>>;
}
