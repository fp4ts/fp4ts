import { Kind } from '@fp4ts/core';

export class Kleisli<F, A, B> {
  private readonly __void!: void;

  public constructor(public readonly run: (a: A) => Kind<F, [B]>) {}
}
