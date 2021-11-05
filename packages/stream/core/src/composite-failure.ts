import { ok as assert } from 'assert';
import { List, Option, Some, None, Either, Left } from '@fp4ts/cats';

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

  public static fromResults(
    fst: Either<Error, void>,
    snd: Either<Error, void>,
  ): Either<Error, void> {
    return fst.fold(
      fstE =>
        snd.fold(
          sndE => Left(this.fromList(List(fstE, sndE)).get),
          () => Left(fstE),
        ),
      () => snd,
    );
  }
}
