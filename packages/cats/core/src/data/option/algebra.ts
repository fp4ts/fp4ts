// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class Option<A> {
  readonly __void!: void;
  readonly _A!: () => A;

  public abstract readonly get: A;
}

export class Some<A> extends Option<A> {
  public readonly tag = 'some';
  public constructor(public readonly get: A) {
    super();
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

  public override toString(): string {
    return `[None]`;
  }
})();
export type None = typeof None;

export type View<A> = Some<A> | None;

export const view = <A>(_: Option<A>): View<A> => _ as any;
