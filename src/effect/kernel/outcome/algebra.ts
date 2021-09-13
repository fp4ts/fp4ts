import { Auto, Kind1, URIS } from '../../../core';

export class CancellationError extends Error {}

export abstract class Outcome<F extends URIS, E, A> {
  // @ts-ignore
  private readonly __void: void;
}

export class Success<F extends URIS, C, A> extends Outcome<F, never, A> {
  public readonly tag = 'success';
  public constructor(public readonly result: Kind1<F, C, A>) {
    super();
  }
  public toString(): string {
    return `[Success: ${this.result}]`;
  }
}

export class Failure<F extends URIS, E> extends Outcome<F, E, never> {
  public readonly tag = 'failure';
  public constructor(public readonly error: E) {
    super();
  }
  public toString(): string {
    return `[Failure: ${this.error}]`;
  }
}

export class Canceled<F extends URIS> extends Outcome<F, never, never> {
  public readonly tag = 'canceled';
  public toString(): string {
    return '[Canceled]';
  }
}

export type OutcomeView<F extends URIS, E, A> =
  | Success<F, Auto, A>
  | Failure<F, E>
  | Canceled<F>;

export const view = <F extends URIS, E, A>(
  _: Outcome<F, E, A>,
): OutcomeView<F, E, A> => _ as any;
