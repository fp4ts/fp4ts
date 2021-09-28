import { AnyK, Kind, pipe } from '@cats4ts/core';
import { Monad } from '@cats4ts/cats-core';
import { Kleisli, Left, Right } from '@cats4ts/cats-core/lib/data';
import { IsEq } from '@cats4ts/cats-test-kit';

import { ApplicativeLaws } from './applicative-laws';
import { FlatMapLaws } from './flat-map-laws';

export const MonadLaws = <F extends AnyK>(F: Monad<F>): MonadLaws<F> => ({
  ...ApplicativeLaws(F),
  ...FlatMapLaws(F),

  monadLeftIdentity: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> => pipe(F.pure(a), F.flatMap(f))['<=>'](f(a)),

  monadRightIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    F.flatMap_(fa, F.pure)['<=>'](fa),

  kleisliLeftIdentity: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> =>
    Kleisli<F, A, A>(F.pure)['>=>'](F)(Kleisli(f)).run(a)['<=>'](f(a)),

  kleisliRightIdentity: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> =>
    Kleisli(f)['>=>'](F)(Kleisli(F.pure)).run(a)['<=>'](f(a)),

  mapFlatMapCoherence: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> =>
    F.flatMap_(fa, a => F.pure(f(a)))['<=>'](F.map_(fa, f)),

  tailRecMStackSafety: (): IsEq<Kind<F, [number]>> => {
    const n = 50_000;
    const res = F.tailRecM(0)(i => F.pure(i < n ? Left(i + 1) : Right(i)));

    return res['<=>'](F.pure(n));
  },
});

export interface MonadLaws<F extends AnyK>
  extends ApplicativeLaws<F>,
    FlatMapLaws<F> {
  monadLeftIdentity: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
  ) => IsEq<Kind<F, [B]>>;

  monadRightIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  kleisliLeftIdentity: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
  ) => IsEq<Kind<F, [B]>>;

  kleisliRightIdentity: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
  ) => IsEq<Kind<F, [B]>>;

  mapFlatMapCoherence: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ) => IsEq<Kind<F, [B]>>;

  tailRecMStackSafety: () => IsEq<Kind<F, [number]>>;
}
