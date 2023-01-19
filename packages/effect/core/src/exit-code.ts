// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class ExitCode {
  private constructor(public readonly code: number) {}

  public static of(code: number): ExitCode {
    return new ExitCode(code & 0xff);
  }

  public static Success: ExitCode = new ExitCode(0);
  public static Error: ExitCode = new ExitCode(1);
}
