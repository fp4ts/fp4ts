export class ExitCode {
  private constructor(public readonly code: number) {}

  public static of(code: number): ExitCode {
    return new ExitCode(code & 0xff);
  }

  public static Success: ExitCode = new ExitCode(0);
  public static Error: ExitCode = new ExitCode(1);
}
