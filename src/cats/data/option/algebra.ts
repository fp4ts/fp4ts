// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Option<A> {
  // @ts-ignore
  private readonly __void: void;
}

export class Some<A> extends Option<A> {
  public readonly tag = 'some';
  public constructor(public readonly value: A) {
    super();
  }

  public override toString(): string {
    return `[Some value: ${this.value}]`;
  }
}

export const None = new (class None extends Option<never> {
  public readonly tag = 'none';
  public override toString(): string {
    return `[None]`;
  }
})();
export type None = typeof None;

export type View<A> = Some<A> | None;

export const view = <A>(_: Option<A>): View<A> => _ as any;
