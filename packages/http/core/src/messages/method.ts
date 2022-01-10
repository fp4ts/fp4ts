// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from '@fp4ts/cats';

export class Method {
  public static readonly GET = new Method('GET');
  public static readonly POST = new Method('POST');
  public static readonly PUT = new Method('PUT');
  public static readonly DELETE = new Method('DELETE');
  public static readonly PATCH = new Method('PATCH');

  public static fromString(s: string): Either<Error, Method> {
    if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(s)) {
      return Right(new Method(s));
    } else {
      return Left(new Error(`Invalid method name '${s}'`));
    }
  }

  public static fromStringUnsafe(s: string): Method {
    return this.fromString(s).get;
  }

  private readonly __void!: void;
  private constructor(public readonly methodName: string) {}
}
