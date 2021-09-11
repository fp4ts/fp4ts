import { Auto, Kind1, URIS } from '../../../core';

export class CancellationError extends Error {}

export abstract class Outcome<F extends URIS, E, A, C = Auto> {
  // @ts-ignore
  private readonly __void: void;
}

export class Success<F extends URIS, C, A> extends Outcome<F, never, A, C> {
  public readonly tag = 'success';
  public constructor(public readonly result: Kind1<F, C, A>) {
    super();
  }
  public toString(): string {
    return `[Success: ${this.result}]`;
  }
}

export class Failure<F extends URIS, E, C = Auto> extends Outcome<
  F,
  E,
  never,
  C
> {
  public readonly tag = 'failure';
  public constructor(public readonly error: E) {
    super();
  }
  public toString(): string {
    return `[Failure: ${this.error}]`;
  }
}

export class Canceled<F extends URIS, C = Auto> extends Outcome<
  F,
  never,
  never,
  C
> {
  public readonly tag = 'canceled';
  public toString(): string {
    return '[Canceled]';
  }
}

export type OutcomeView<F extends URIS, E, A, C = Auto> =
  | Success<F, A, C>
  | Failure<F, E, C>
  | Canceled<F, C>;

export const view = <F extends URIS, E, A, C = Auto>(
  _: Outcome<F, E, A, C>,
): OutcomeView<F, E, A, C> => _ as any;
