export abstract class Either<E, A> {
  private readonly __void!: void;
}

export class Right<A> extends Either<never, A> {
  public readonly tag = 'right';
  public constructor(public readonly value: A) {
    super();
  }

  public override toString(): string {
    return `[Right value: ${this.value}]`;
  }
}

export class Left<E> extends Either<E, never> {
  public readonly tag = 'left';
  public constructor(public readonly value: E) {
    super();
  }

  public override toString(): string {
    return `[Left value: ${this.value}]`;
  }
}

type View<E, A> = Left<E> | Right<A>;

export const view = <E, A>(_: Either<E, A>): View<E, A> => _ as any;
