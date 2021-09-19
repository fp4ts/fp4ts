import { AnyK, Kind } from '@cats4ts/core';

export class CancellationError extends Error {}

export abstract class Outcome<F extends AnyK, E, A> {
  // @ts-ignore
  private readonly __void: void;
}

export class Success<F extends AnyK, A> extends Outcome<F, never, A> {
  public readonly tag = 'success';
  public constructor(public readonly result: Kind<F, [A]>) {
    super();
  }
  public override toString(): string {
    return `[Success: ${this.result}]`;
  }
}

export class Failure<F extends AnyK, E> extends Outcome<F, E, never> {
  public readonly tag = 'failure';
  public constructor(public readonly error: E) {
    super();
  }
  public override toString(): string {
    return `[Failure: ${this.error}]`;
  }
}

export class Canceled<F extends AnyK> extends Outcome<F, never, never> {
  public readonly tag = 'canceled';
  public override toString(): string {
    return '[Canceled]';
  }
}

export type OutcomeView<F extends AnyK, E, A> =
  | Success<F, A>
  | Failure<F, E>
  | Canceled<F>;

export const view = <F extends AnyK, E, A>(
  _: Outcome<F, E, A>,
): OutcomeView<F, E, A> => _ as any;
