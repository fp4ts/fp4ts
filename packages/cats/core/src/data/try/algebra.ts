// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class Try<out A> {
  /** @hidden */
  private readonly __void!: void;
  private readonly _A!: () => A;
}

export class Success<A> extends Try<A> {
  public readonly tag = 'success';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Failure extends Try<never> {
  public readonly tag = 'failure';
  public constructor(public readonly error: Error) {
    super();
  }
}

export type View<A> = Success<A> | Failure;

export const view = <A>(_: Try<A>): View<A> => _ as any;
