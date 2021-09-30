export abstract class Try<A> {
  private readonly __void!: void;
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
