import { AnyK, Kind } from '@cats4ts/core';

export class Kleisli<F extends AnyK, A, B> {
  private readonly __void!: void;

  public constructor(public readonly run: (a: A) => Kind<F, [B]>) {}
}
