export class Encoder<O, A> {
  private readonly __void!: void;

  public constructor(public readonly encode: (a: A) => O) {}
}
