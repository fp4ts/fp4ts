export class Identity<A> {
  // @ts-ignore
  private readonly __void: void;

  public constructor(public readonly get: A) {}
}
