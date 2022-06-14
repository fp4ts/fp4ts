// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class Option<out A> {
  readonly __void!: void;
  readonly _A!: () => A;

  public abstract readonly get: A;
  public abstract fold<B1, B2 = B1>(
    onNone: () => B1,
    onSome: (a: A) => B2,
  ): B1 | B2;
}

export class Some<A> extends Option<A> {
  public readonly tag = 'some';
  public constructor(public readonly get: A) {
    super();
  }

  public fold<B1, B2 = B1>(onNone: () => B1, onSome: (a: A) => B2): B1 | B2 {
    return onSome(this.get);
  }

  public override toString(): string {
    return `[Some value: ${this.get}]`;
  }
}

export const None = new (class None extends Option<never> {
  public readonly tag = 'none';

  public get get(): never {
    throw new Error('None.get');
  }

  public fold<B1, B2 = B1>(
    onNone: () => B1,
    onSome: (a: never) => B2,
  ): B1 | B2 {
    return onNone();
  }

  public override toString(): string {
    return `[None]`;
  }
})();
export type None = typeof None;

export type View<A> = Some<A> | None;

export const view = <A>(_: Option<A>): View<A> => _ as any;
