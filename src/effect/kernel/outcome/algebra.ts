import { Auto, Fix, Kind, URIS } from '../../../core';

export class CancellationError extends Error {}

export abstract class Outcome<F extends URIS, E, A, C = Auto> {
  // @ts-ignore
  private readonly __void: void;
}

export class Success<F extends URIS, C2, S2, R2, E2, A> extends Outcome<
  F,
  never,
  A,
  C2 & Fix<'S', S2> & Fix<'R', R2> & Fix<'E', E2>
> {
  public readonly tag = 'success';
  public constructor(public readonly result: Kind<F, C2, S2, R2, E2, A>) {
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
  | Success<F, unknown, unknown, unknown, A, C>
  | Failure<F, E, C>
  | Canceled<F, C>;

export const view = <F extends URIS, E, A, C = Auto>(
  _: Outcome<F, E, A, C>,
): OutcomeView<F, E, A, C> => _ as any;
