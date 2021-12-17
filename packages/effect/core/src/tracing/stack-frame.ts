export class StackFrame {
  public constructor(
    public readonly op: string | undefined,
    public readonly file: string,
    public readonly line: string,
    public readonly col: string,
  ) {}

  toString(): string {
    const { op, file, line, col } = this;
    return op != null
      ? `${op} (${file}:${line}:${col})`
      : `${file}:${line}:${col}`;
  }
}
