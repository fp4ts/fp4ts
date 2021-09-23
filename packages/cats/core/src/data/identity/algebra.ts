export class Identity<A> {
  private readonly __void!: void;
  private readonly _A!: () => A;

  public constructor(public readonly get: A) {}
}
