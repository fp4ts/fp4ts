import { Kind } from '@fp4ts/core';
import { Either } from '@fp4ts/cats';

export class Lease<F> {
  public constructor(public readonly cancel: Kind<F, [Either<Error, void>]>) {}
}
