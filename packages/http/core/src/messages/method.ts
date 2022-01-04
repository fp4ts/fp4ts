export class Method {
  public static readonly GET = new Method('GET');
  public static readonly POST = new Method('POST');
  public static readonly PUT = new Method('PUT');
  public static readonly DELETE = new Method('DELETE');

  private readonly __void!: void;
  private constructor(public readonly methodName: string) {}
}
