import { Kind, pipe } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats-core';
import { Kleisli, Left, Right } from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';

import { ApplicativeLaws } from './applicative-laws';
import { FlatMapLaws } from './flat-map-laws';

export const MonadLaws = <F>(F: Monad<F>): MonadLaws<F> => ({
  ...ApplicativeLaws(F),
  ...FlatMapLaws(F),

  monadLeftIdentity: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> => new IsEq(pipe(F.pure(a), F.flatMap(f)), f(a)),

  monadRightIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.flatMap_(fa, F.pure), fa),

  kleisliLeftIdentity: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(Kleisli<F, A, A>(F.pure)['>=>'](F)(Kleisli(f)).run(a), f(a)),

  kleisliRightIdentity: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(Kleisli(f)['>=>'](F)(Kleisli(F.pure)).run(a), f(a)),

  mapFlatMapCoherence: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(
      F.flatMap_(fa, a => F.pure(f(a))),
      F.map_(fa, f),
    ),

  tailRecMStackSafety: (): IsEq<Kind<F, [number]>> => {
    const n = 50_000;
    const res = F.tailRecM(0)(i => F.pure(i < n ? Left(i + 1) : Right(i)));

    return new IsEq(res, F.pure(n));
  },
});

export interface MonadLaws<F> extends ApplicativeLaws<F>, FlatMapLaws<F> {
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
