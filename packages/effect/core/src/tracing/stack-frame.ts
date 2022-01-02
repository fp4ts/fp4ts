// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
