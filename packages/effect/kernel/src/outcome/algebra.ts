// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';

export class CancellationError extends Error {}

export abstract class Outcome<F, out E, out A> {
  private readonly __void!: void;

  private readonly _F!: F;
  private readonly _E!: () => E;
  private readonly _A!: () => A;
}

export class Success<F, A> extends Outcome<F, never, A> {
  public readonly tag = 'success';
  public constructor(public readonly result: Kind<F, [A]>) {
    super();
  }
  public override toString(): string {
    return `[Success: ${this.result}]`;
  }
}

export class Failure<F, E> extends Outcome<F, E, never> {
  public readonly tag = 'failure';
  public constructor(public readonly error: E) {
    super();
  }
  public override toString(): string {
    return `[Failure: ${this.error}]`;
  }
}

export class Canceled<F> extends Outcome<F, never, never> {
  public readonly tag = 'canceled';
  public override toString(): string {
    return '[Canceled]';
  }
}

export type OutcomeView<F, E, A> = Success<F, A> | Failure<F, E> | Canceled<F>;

export const view = <F, E, A>(_: Outcome<F, E, A>): OutcomeView<F, E, A> =>
  _ as any;
