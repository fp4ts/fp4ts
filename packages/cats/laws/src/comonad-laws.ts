// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Comonad } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { CoflatMapLaws } from './coflat-map-laws';
import { Cokleisli } from '@fp4ts/cats-core/lib/data';

export const ComonadLaws = <F>(F: Comonad<F>) => ({
  ...CoflatMapLaws(F),

  extractCoflattenIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(pipe(fa, F.coflatten, F.extract), fa),

  mapCoflattenIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(pipe(fa, F.coflatten, F.map(F.extract)), fa),

  comonadLeftIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(pipe(fa, F.coflatMap(F.extract)), fa),

  comonadRightIdentity: <A, B>(
    fa: Kind<F, [A]>,
    f: (fa: Kind<F, [A]>) => B,
  ): IsEq<B> => new IsEq(pipe(fa, F.coflatMap(f), F.extract), f(fa)),

  cokleisliLeftIdentity: <A, B>(
    fa: Kind<F, [A]>,
    f: (fa: Kind<F, [A]>) => B,
  ): IsEq<B> => {
    const C = Cokleisli.Compose(F);
    return new IsEq(
      C.andThen_(Cokleisli<F, A, A>(F.extract), Cokleisli(f))(fa),
      f(fa),
    );
  },

  cokleisliRightIdentity: <A, B>(
    fa: Kind<F, [A]>,
    f: (fa: Kind<F, [A]>) => B,
  ): IsEq<B> => {
    const C = Cokleisli.Compose(F);
    return new IsEq(
      C.andThen_(Cokleisli(f), Cokleisli<F, B, B>(F.extract))(fa),
      f(fa),
    );
  },
});
