import { AnyK, compose, id, Kind, pipe } from '@cats4ts/core';
import { Invariant } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

export const InvariantLaws = <F extends AnyK>(
  F: Invariant<F>,
): InvariantLaws<F> => ({
  invariantIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    F.imap_(fa, id, id)['<=>'](fa),

  invariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f1: (a: A) => B,
    g1: (b: B) => C,
    f2: (b: B) => A,
    g2: (c: C) => B,
  ): IsEq<Kind<F, [C]>> =>
    pipe(fa, F.imap(f1, f2), F.imap(g1, g2))['<=>'](
      F.imap_(fa, compose(g1, f1), compose(f2, g2)),
    ),
});

export interface InvariantLaws<F extends AnyK> {
  invariantIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  invariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f1: (a: A) => B,
    g1: (b: B) => C,
    f2: (b: B) => A,
    g2: (c: C) => B,
  ) => IsEq<Kind<F, [C]>>;
}
