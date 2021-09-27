import { AnyK, Kind } from '@cats4ts/core';

export class Tuple2K<F extends AnyK, G extends AnyK, A> {
  private readonly __void!: void;
  public constructor(
    public readonly fst: Kind<F, [A]>,
    public readonly snd: Kind<G, [A]>,
  ) {}
}
