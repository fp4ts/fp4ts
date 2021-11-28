// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, Kind, pipe } from '@fp4ts/core';
import { Applicative } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { ApplyLaws } from './apply-laws';

export const ApplicativeLaws = <F>(F: Applicative<F>): ApplicativeLaws<F> => ({
  ...ApplyLaws(F),

  applicativeIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      // prettier-ignore
      pipe(F.pure((a: A) => a), F.ap(fa)),
      fa,
    ),

  applicativeHomomorphism: <A, B>(a: A, f: (a: A) => B): IsEq<Kind<F, [B]>> =>
    new IsEq(pipe(F.pure(f), F.ap(F.pure(a))), F.pure(f(a))),

  applicativeInterchange: <A, B>(
    a: A,
    ff: Kind<F, [(a: A) => B]>,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(
      F.ap_(ff, F.pure(a)),
      pipe(
        F.pure((f: (a: A) => B) => f(a)),
        F.ap(ff),
      ),
    ),

  applicativeMap: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> => new IsEq(F.map_(fa, f), pipe(F.pure(f), F.ap(fa))),

  applicativeComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    fab: Kind<F, [(a: A) => B]>,
    fbc: Kind<F, [(a: B) => C]>,
  ): IsEq<Kind<F, [C]>> => {
    const comp: (g: (b: B) => C) => (f: (a: A) => B) => (a: A) => C = g => f =>
      compose(g, f);

    return new IsEq(
      pipe(F.pure(comp), F.ap(fbc), F.ap(fab), F.ap(fa)),
      pipe(fbc, F.ap(F.ap_(fab, fa))),
    );
  },

  apProductConsistent: <A, B>(
    fa: Kind<F, [A]>,
    ff: Kind<F, [(a: A) => B]>,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(
      F.ap_(ff, fa),
      // prettier-ignore
      pipe(F.product_(ff, fa), F.map(([f, a]) => f(a))),
    ),

  applicativeUnit: <A>(a: A): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.map_(F.unit, () => a),
      F.pure(a),
    ),
});

export interface ApplicativeLaws<F> extends ApplyLaws<F> {
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
