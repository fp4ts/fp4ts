import { AnyK, flow, id, Kind, pipe } from '@cats4ts/core';
import { Bifunctor } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

export const BifunctorLaws = <F extends AnyK>(
  F: Bifunctor<F>,
): BifunctorLaws<F> => ({
  bifunctorIdentity: <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [A, B]>> =>
    F.bimap_(fab, id, id)['<=>'](fab),

  bifunctorComposition: <A, B, C, X, Y, Z>(
    fax: Kind<F, [A, X]>,
    f1: (a: A) => B,
    g1: (x: X) => Y,
    f2: (b: B) => C,
    g2: (y: Y) => Z,
  ): IsEq<Kind<F, [C, Z]>> =>
    pipe(fax, F.bimap(f1, g1), F.bimap(f2, g2))['<=>'](
      F.bimap_(fax, flow(f1, f2), flow(g1, g2)),
    ),

  bifunctorLeftMapIdentity: <A, B>(
    fab: Kind<F, [A, B]>,
  ): IsEq<Kind<F, [A, B]>> => F.leftMap_(fab, id)['<=>'](fab),

  bifunctorLeftMapComposition: <A, X, B, C>(
    fax: Kind<F, [A, X]>,
    f1: (a: A) => B,
    f2: (b: B) => C,
  ): IsEq<Kind<F, [C, X]>> =>
    pipe(fax, F.leftMap(f1), F.leftMap(f2))['<=>'](
      F.leftMap_(fax, flow(f1, f2)),
    ),

  bifunctorMapIdentity: <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [A, B]>> =>
    F.map_(fab, id)['<=>'](fab),

  bifunctorMapComposition: <X, A, B, C>(
    fxa: Kind<F, [X, A]>,
    g1: (a: A) => B,
    g2: (b: B) => C,
  ): IsEq<Kind<F, [X, C]>> =>
    pipe(fxa, F.map(g1), F.map(g2))['<=>'](F.map_(fxa, flow(g1, g2))),
});

export interface BifunctorLaws<F extends AnyK> {
  bifunctorIdentity: <A, B>(fab: Kind<F, [A, B]>) => IsEq<Kind<F, [A, B]>>;

  bifunctorComposition: <A, B, C, X, Y, Z>(
    fax: Kind<F, [A, X]>,
    f1: (a: A) => B,
    g1: (x: X) => Y,
    f2: (b: B) => C,
    g2: (y: Y) => Z,
  ) => IsEq<Kind<F, [C, Z]>>;

  bifunctorLeftMapIdentity: <A, B>(
    fab: Kind<F, [A, B]>,
  ) => IsEq<Kind<F, [A, B]>>;

  bifunctorLeftMapComposition: <A, X, B, C>(
    fax: Kind<F, [A, X]>,
    f1: (a: A) => B,
    f2: (b: B) => C,
  ) => IsEq<Kind<F, [C, X]>>;

  bifunctorMapIdentity: <A, B>(fab: Kind<F, [A, B]>) => IsEq<Kind<F, [A, B]>>;

  bifunctorMapComposition: <X, A, B, C>(
    fxa: Kind<F, [X, A]>,
    g1: (a: A) => B,
    g2: (b: B) => C,
  ) => IsEq<Kind<F, [X, C]>>;
}
