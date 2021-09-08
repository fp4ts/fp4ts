// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class State<S, A> {
  // @ts-ignore
  private readonly __void: void;
}

export class Pure<S, A> extends State<S, A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

export class FlatMap<S, E, A> extends State<S, A> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: State<S, E>,
    public readonly f: (a: E) => State<S, A>,
  ) {
    super();
  }
}

export class SetState<S> extends State<S, void> {
  public readonly tag = 'setState';
  public constructor(public readonly state: S) {
    super();
  }
}

export class GetState<S> extends State<S, S> {
  public readonly tag = 'getState';
}

export type View<S, A> =
  | Pure<S, A>
  | FlatMap<S, any, A>
  | SetState<S>
  | GetState<S>;

export const view = <S, A>(_: State<S, A>): View<S, A> => _ as any;
