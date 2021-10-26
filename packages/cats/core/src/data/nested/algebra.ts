import { Kind } from '@fp4ts/core';

export class Nested<F, G, A> {
  private readonly __void!: void;

  public constructor(public readonly value: Kind<F, [Kind<G, [A]>]>) {}
}
