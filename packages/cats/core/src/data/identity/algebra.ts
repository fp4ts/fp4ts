export class Identity<A> {
  private readonly __void!: void;

  public constructor(public readonly get: A) {}
}
