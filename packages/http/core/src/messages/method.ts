// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Option } from '@fp4ts/cats';
import { ParsingFailure } from './message-failure';

export class Method {
  public static readonly GET = new Method('GET');
  public static readonly POST = new Method('POST');
  public static readonly PUT = new Method('PUT');
  public static readonly DELETE = new Method('DELETE');
  public static readonly PATCH = new Method('PATCH');
  public static readonly HEAD = new Method('HEAD');

  public static fromString(s: string): Either<Error, Method> {
    return Option(this.all.find(m => m.methodName === s)).toRight(
      () => new ParsingFailure(`Invalid method name ${s}`),
    );
  }

  public static fromStringUnsafe(s: string): Method {
    return this.fromString(s).get;
  }

  private static readonly all: Method[] = [
    this.GET,
    this.POST,
    this.PUT,
    this.DELETE,
    this.PATCH,
    this.HEAD,
  ];

  private readonly __void!: void;
  private constructor(public readonly methodName: string) {}
}
