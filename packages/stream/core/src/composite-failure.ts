import { ok as assert } from 'assert';
import { List, Option, Some, None } from '@fp4ts/cats';

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

  public static fromList(xs: List<Error>): Option<Error> {
    return xs.uncons.fold(
      () => None,
      ([fst, tl]) =>
        tl.uncons.fold(
          () => Some(fst),
          ([snd, rest]) => Some(new CompositeFailure(fst, rest.prepend(snd))),
        ),
    );
  }
}
