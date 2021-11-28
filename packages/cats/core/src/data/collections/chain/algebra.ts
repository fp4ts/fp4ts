// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { Kind } from '@fp4ts/core';
import { Foldable } from '../../../foldable';

export abstract class Chain<A> {
  readonly __void!: void;
}

export const Empty = new (class Empty extends Chain<never> {
  public readonly tag = 'empty';
})();
export type Empty = typeof Empty;

export class Singleton<A> extends Chain<A> {
  public readonly tag = 'singleton';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Concat<A> extends Chain<A> {
  public readonly tag = 'concat';
  public constructor(
    public readonly lhs: NonEmpty<A>,
    public readonly rhs: NonEmpty<A>,
  ) {
    super();
  }
}

export class Wrap<F, A> extends Chain<A> {
  public readonly tag = 'wrap';
  public constructor(
    public readonly F: Foldable<F>,
    public readonly values: Kind<F, [A]>,
  ) {
    super();
    assert(F.size(values) > 0, 'Wrap cannot wrap an empty vector');
  }
}

export type NonEmpty<A> = Singleton<A> | Concat<A> | Wrap<unknown, A>;
export type View<A> = Empty | NonEmpty<A>;

export const view = <A>(_: Chain<A>): View<A> => _ as any;
