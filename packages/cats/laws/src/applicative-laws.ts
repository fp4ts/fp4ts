import { AnyK, compose, Kind, pipe } from '@cats4ts/core';
import { Applicative } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

import { ApplyLaws } from './apply-laws';

export const ApplicativeLaws = <F extends AnyK>(
  F: Applicative<F>,
): ApplicativeLaws<F> => ({
  ...ApplyLaws(F),

  applicativeIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    // prettier-ignore
    pipe(F.pure((a: A) => a), F.ap(fa))['<=>'](fa),

  applicativeHomomorphism: <A, B>(a: A, f: (a: A) => B): IsEq<Kind<F, [B]>> =>
    pipe(F.pure(f), F.ap(F.pure(a)))['<=>'](F.pure(f(a))),

  applicativeInterchange: <A, B>(
    a: A,
    ff: Kind<F, [(a: A) => B]>,
  ): IsEq<Kind<F, [B]>> =>
    F.ap_(ff, F.pure(a))['<=>'](
      pipe(
        F.pure((f: (a: A) => B) => f(a)),
        F.ap(ff),
      ),
    ),

  applicativeMap: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> => {
    return F.map_(fa, f)['<=>'](pipe(F.pure(f), F.ap(fa)));
  },

  applicativeComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    fab: Kind<F, [(a: A) => B]>,
    fbc: Kind<F, [(a: B) => C]>,
  ): IsEq<Kind<F, [C]>> => {
    const comp: (g: (b: B) => C) => (f: (a: A) => B) => (a: A) => C = g => f =>
      compose(g, f);

    return pipe(F.pure(comp), F.ap(fbc), F.ap(fab), F.ap(fa))['<=>'](
      pipe(fbc, F.ap(F.ap_(fab, fa))),
    );
  },

  apProductConsistent: <A, B>(
    fa: Kind<F, [A]>,
    ff: Kind<F, [(a: A) => B]>,
  ): IsEq<Kind<F, [B]>> =>
    // prettier-ignore
    F.ap_(ff, fa)['<=>'](pipe(F.product_(ff, fa), F.map(([f, a]) => f(a)))),

  applicativeUnit: <A>(a: A): IsEq<Kind<F, [A]>> =>
    F.map_(F.unit, () => a)['<=>'](F.pure(a)),
});

export interface ApplicativeLaws<F extends AnyK> extends ApplyLaws<F> {
  applicativeIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  applicativeHomomorphism: <A, B>(a: A, f: (a: A) => B) => IsEq<Kind<F, [B]>>;

  applicativeInterchange: <A, B>(
    a: A,
    ff: Kind<F, [(a: A) => B]>,
  ) => IsEq<Kind<F, [B]>>;

  applicativeMap: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ) => IsEq<Kind<F, [B]>>;

  applicativeComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    fab: Kind<F, [(a: A) => B]>,
    fbc: Kind<F, [(a: B) => C]>,
  ) => IsEq<Kind<F, [C]>>;

  apProductConsistent: <A, B>(
    fa: Kind<F, [A]>,
    ff: Kind<F, [(a: A) => B]>,
  ) => IsEq<Kind<F, [B]>>;

  applicativeUnit: <A>(a: A) => IsEq<Kind<F, [A]>>;
}
