import { AnyK, Kind } from '@cats4ts/core';

export class Nested<F extends AnyK, G extends AnyK, A> {
  private readonly __void!: void;

  public constructor(public readonly value: Kind<F, [Kind<G, [A]>]>) {}
}
