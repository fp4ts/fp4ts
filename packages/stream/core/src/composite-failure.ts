import { ok as assert } from 'assert';
import { List } from '@cats4ts/cats-core/lib/data';

export class CompositeFailure extends Error {
  public constructor(
    public readonly head: Error,
    public readonly tail: List<Error>,
  ) {
    super();
    assert(tail.nonEmpty, 'Composite failure must have at least two items');
  }

  public static from(
    fst: Error,
    snd: Error,
    tl: List<Error> = List.empty,
  ): CompositeFailure {
    return new CompositeFailure(fst, tl.prepend(snd));
  }
}
