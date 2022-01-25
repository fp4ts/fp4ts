export class AddHeader<H, A> {
  private readonly __void!: void;
  public constructor(public readonly header: H, public readonly body: A) {}
}
