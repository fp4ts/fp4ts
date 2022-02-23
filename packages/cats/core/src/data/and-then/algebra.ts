// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { runLoop_ } from './runLoop';

export abstract class AndThen<A, B> {
  private readonly __void!: void;
}
export interface AndThen<A, B> {
  (a: A): B;
}

export class Single<A, B> extends AndThen<A, B> {
  public readonly tag = 'single';
  public constructor(
    public readonly fun: (a: A) => B,
    public readonly idx: number,
  ) {
    super();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const apply = function (this: AndThen<A, B>, a: A): B {
      return runLoop_(self, a);
    };

    Object.setPrototypeOf(apply, this.constructor.prototype);
    (apply as any).tag = this.tag;
    (apply as any).fun = fun;
    (apply as any).idx = idx;
    return apply as this;
  }
}

export class Concat<A, E, B> extends AndThen<A, B> {
  public readonly tag = 'concat';
  public constructor(
    public readonly left: AndThen<A, E>,
    public readonly right: AndThen<E, B>,
  ) {
    super();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const apply = function (this: AndThen<A, B>, a: A): B {
      return runLoop_(self, a);
    };

    Object.setPrototypeOf(apply, this.constructor.prototype);
    (apply as any).tag = this.tag;
    (apply as any).left = left;
    (apply as any).right = right;
    return apply as this;
  }
}

export type View<A, B> = Single<A, B> | Concat<A, any, B>;
export const view = <A, B>(_: AndThen<A, B>): View<A, B> => _ as any;
