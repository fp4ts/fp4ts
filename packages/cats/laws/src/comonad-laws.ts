// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Comonad } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { CoflatMapLaws } from './coflat-map-laws';

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

  // TODO: add Cokleisli
});
