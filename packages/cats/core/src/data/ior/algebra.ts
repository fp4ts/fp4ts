// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class Ior<out A, out B> {
  private readonly __void!: void;

  private _A!: () => A;
  private _B!: () => B;
}

export class Left<A> extends Ior<A, never> {
  public readonly tag = 'left';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Right<B> extends Ior<never, B> {
  public readonly tag = 'right';
  public constructor(public readonly value: B) {
    super();
  }
}

export class Both<A, B> extends Ior<A, B> {
  public readonly tag = 'both';
  public constructor(public readonly _left: A, public readonly _right: B) {
    super();
  }
}

export type View<A, B> = Left<A> | Right<B> | Both<A, B>;

export const view = <A, B>(_: Ior<A, B>): View<A, B> => _ as any;
