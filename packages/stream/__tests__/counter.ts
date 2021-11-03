import { Kind } from '@fp4ts/core';
import { Ref, Sync } from '@fp4ts/effect-kernel';

export class Counter<F> {
  private constructor(private readonly ref: Ref<F, number>) {}

  public readonly increment = this.ref.update(x => x + 1);
  public readonly decrement = this.ref.update(x => x - 1);
  public readonly get = this.ref.get();

  public static of = <F>(F: Sync<F>): Kind<F, [Counter<F>]> =>
    F.map_(Ref.of(F)(0), ref => new Counter(ref));
}
