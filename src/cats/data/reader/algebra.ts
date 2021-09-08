// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Reader<R, A> {
  // @ts-ignore
  private readonly __void: void;
}

export class Pure<A> extends Reader<unknown, A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

export class FlatMap<R1, R2, E, A> extends Reader<R1 & R2, A> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: Reader<R1, E>,
    public readonly f: (a: E) => Reader<R2, A>,
  ) {
    super();
  }
}

export class Read<R> extends Reader<R, R> {
  public readonly tag = 'read';
}

export class Provide<R> extends Reader<unknown, void> {
  public readonly tag = 'provide';
  public constructor(public readonly environment: R) {
    super();
  }
}

export type View<R, A> =
  | Pure<A>
  | FlatMap<unknown, R, any, A>
  | Read<R>
  | Provide<unknown>;

export const view = <R, A>(_: Reader<R, A>): View<R, A> => _ as any;
