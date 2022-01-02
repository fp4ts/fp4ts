export class Guard<I, A extends I> {
  private readonly __void!: void;

  public constructor(public readonly test: (i: I) => i is A) {}
}
