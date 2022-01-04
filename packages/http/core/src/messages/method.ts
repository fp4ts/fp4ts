// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class Method {
  public static readonly GET = new Method('GET');
  public static readonly POST = new Method('POST');
  public static readonly PUT = new Method('PUT');
  public static readonly DELETE = new Method('DELETE');

  private readonly __void!: void;
  private constructor(public readonly methodName: string) {}
}
